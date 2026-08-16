import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
  Marker,
  Polyline,
  useApiIsLoaded,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import Button from '../../components/common/Button'
import GoogleMap from '../../components/common/GoogleMap'
import SnapSheet from '../../components/common/SnapSheet'
import NavBar from '../../components/layout/NavBar'
import currentPositionSvg from '../../assets/map/current-position.svg?raw'
import dropdownCheckIcon from '../../assets/map/dropdown-check.svg'
import activePinIcon from '../../assets/map/map-pin-active.svg'
import pinIcon from '../../assets/map/map-pin.svg'
import myLocationIcon from '../../assets/map/my-location.svg'
import recordPlusIcon from '../../assets/map/record-plus.png'
import tripAvatar from '../../assets/map/trip-avatar.svg'
import tripSelectChevron from '../../assets/icons/trip-select-chevron.svg'
import {
  getOngoingPins,
  getPin,
  getPinPhotos,
} from '../../features/pins/pinApi'
import { getTrip, getTripPins, getTrips } from '../../features/trips/tripApi'

// 여정을 아직 못 받았을 때 잠깐 보여줄 위치.
const DEFAULT_CENTER = { lat: 48.8569, lng: 2.3376 }

/* 여정을 볼 때 배율. 핀이 하나뿐이라 영역을 못 잡을 때만 쓰인다. */
const DEFAULT_ZOOM = 13.3

/* 내 위치로 갈 때 배율. 주변 길이 보일 만큼 당긴다. */
const CURRENT_POSITION_ZOOM = 17

/* 진행 중인 여행은 TRAVEL_SEGMENT 가 없어 segment_id 로 못 고른다.
   목록에서 구분하려고 쓰는 프론트 전용 값이다. */
const ONGOING_TRIP_ID = 'ongoing'

// 아이콘 파일의 원본 크기. 정중앙을 좌표에 맞추는 데 쓴다.
const PIN_SIZE = { width: 38, height: 38 }
const ACTIVE_PIN_SIZE = { width: 48, height: 48 }

/* 핀이 화면 가장자리에 딱 붙지 않도록 두는 여백.
   위쪽은 여정 선택 드롭다운, 아래쪽은 핀 시트에 가려지는 만큼 더 준다. */
const FIT_PADDING = { top: 110, right: 48, bottom: 150, left: 48 }

/* 핀을 고르면 이 배율까지 확대한다. 이미 더 당겨 봤다면 그대로 둔다.
   길 이름과 골목이 드러나는 단계로, 구글·애플 지도가 장소를 고를 때 잡는 정도다.
   내 위치로 갈 때와 같은 값이라 둘 사이를 오가도 배율이 튀지 않는다. */
const SELECTED_PIN_ZOOM = 17

/* 핀 시트(높이 281 + 아래 여백 75)가 화면 아래를 가린다.
   가려지지 않는 영역의 가운데에 오도록 그 절반만큼 위로 올린다. */
const SELECTED_PIN_OFFSET = (281 + 75) / 2

/** 핀으로 옮겨가는 데 걸리는 시간 */
const FOCUS_DURATION_MS = 520

/* 처음에 붙고 끝에서 감속한다. */
const easeOut = (progress) => 1 - (1 - progress) ** 3

const prefersReducedMotion = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * 화면 픽셀만큼 남쪽으로 내린 중심을 구한다. 그만큼 핀이 위로 올라온다.
 *
 * 세계 좌표는 배율과 무관하게 256px 기준이라, 화면 픽셀을 배율로 나눠서 더한다.
 */
const getOffsetCenter = (map, core, position, zoom) => {
  const projection = map.getProjection()
  if (!core || !projection) return position

  const point = projection.fromLatLngToPoint(position)
  const shifted = new core.Point(
    point.x,
    point.y + SELECTED_PIN_OFFSET / 2 ** zoom,
  )
  const latLng = projection.fromPointToLatLng(shifted)

  return { lat: latLng.lat(), lng: latLng.lng() }
}

/**
 * 고른 핀으로 지도를 옮긴다.
 *
 * `useMap` 은 `<Map>` 안에서만 쓸 수 있어 자식 컴포넌트로 둔다. 그리는 건 없다.
 */
const FocusSelectedPin = ({ latitude, longitude }) => {
  const map = useMap()
  const core = useMapsLibrary('core')

  useEffect(() => {
    if (!map) return undefined

    const startCenter = map.getCenter()
    const startZoom = map.getZoom()
    if (!startCenter || startZoom == null) return undefined

    // 이미 더 당겨 봤다면 뒤로 물러나지 않는다.
    const targetZoom = Math.max(startZoom, SELECTED_PIN_ZOOM)
    const targetCenter = getOffsetCenter(
      map,
      core,
      { lat: latitude, lng: longitude },
      targetZoom,
    )

    /*
     * 중심과 배율을 매 프레임 같이 옮긴다.
     *
     * `panTo` 는 중심만 부드럽고 `setZoom` 은 즉시 반영이라, 둘을 같이 쓰면
     * 배율만 툭 튀고 이동은 뒤늦게 따라온다. 카메라를 직접 그려야 한 동작이 된다.
     */
    const moveCamera = (center, zoom) => {
      if (typeof map.moveCamera === 'function') {
        map.moveCamera({ center, zoom })
        return
      }

      map.setZoom(zoom)
      map.setCenter(center)
    }

    if (prefersReducedMotion()) {
      moveCamera(targetCenter, targetZoom)
      return undefined
    }

    const from = {
      lat: startCenter.lat(),
      lng: startCenter.lng(),
      zoom: startZoom,
    }
    const startedAt = performance.now()
    let frame = 0

    const step = (now) => {
      const progress = Math.min((now - startedAt) / FOCUS_DURATION_MS, 1)
      const eased = easeOut(progress)

      moveCamera(
        {
          lat: from.lat + (targetCenter.lat - from.lat) * eased,
          lng: from.lng + (targetCenter.lng - from.lng) * eased,
        },
        from.zoom + (targetZoom - from.zoom) * eased,
      )

      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)

    // 다른 핀을 고르면 진행 중이던 이동을 멈추고 새로 시작한다.
    return () => cancelAnimationFrame(frame)
  }, [core, latitude, longitude, map])

  return null
}

/**
 * 핀이 모두 보이도록 지도 영역을 잡는다.
 *
 * 핀이 하나뿐이거나 전부 같은 자리면 영역이 점이 돼 최대 배율로 붙어버린다.
 * 그때는 null 을 돌려주고 중심·배율 방식으로 넘긴다.
 */
const getPinBounds = (pins) => {
  if (pins.length < 2) return null

  const lats = pins.map(({ latitude }) => latitude)
  const lngs = pins.map(({ longitude }) => longitude)

  const north = Math.max(...lats)
  const south = Math.min(...lats)
  const east = Math.max(...lngs)
  const west = Math.min(...lngs)

  if (north === south && east === west) return null

  return { north, south, east, west, padding: FIT_PADDING }
}

/* 현재 위치 아이콘은 점(17, 28)에서 오른쪽으로 원뿔이 뻗은 모양이다.
   그 점을 축으로 돌리면 원뿔이 원래 68x56 박스를 벗어나 잘리므로,
   점에서 원뿔 끝까지(38.25)를 반지름으로 하는 정사각형으로 다시 잡는다. */
const CURRENT_POSITION_ORIGIN = { x: 17, y: 28 }
const CURRENT_POSITION_RADIUS = 38.25
const CURRENT_POSITION_BOX = CURRENT_POSITION_RADIUS * 2

/**
 * 진행 방향만큼 돌린 현재 위치 아이콘을 만든다.
 * 원본 SVG 를 그대로 쓰고 바깥 그룹에 회전만 얹는다.
 */
const buildCurrentPositionIcon = (heading) => {
  const { x, y } = CURRENT_POSITION_ORIGIN
  const viewBox = `${x - CURRENT_POSITION_RADIUS} ${y - CURRENT_POSITION_RADIUS} ${CURRENT_POSITION_BOX} ${CURRENT_POSITION_BOX}`

  const svg = currentPositionSvg
    .replace(
      /width="[^"]*" height="[^"]*" viewBox="[^"]*"/,
      `width="${CURRENT_POSITION_BOX}" height="${CURRENT_POSITION_BOX}" viewBox="${viewBox}"`,
    )
    // 아이콘이 기본으로 동쪽을 보고 있어 90도를 뺀다(heading 은 북쪽이 0).
    .replace(
      '<g id="Group 3">',
      `<g id="Group 3" transform="rotate(${heading - 90} ${x} ${y})">`,
    )

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** 여정 목록 부제. 아직 못 받은 값은 빼고 잇는다. */
const formatCounts = ({ pin_count, photo_count }) =>
  [
    pin_count == null ? null : `핀 ${pin_count}`,
    photo_count == null ? null : `사진 ${photo_count}`,
  ]
    .filter(Boolean)
    .join(' · ')

const sheetDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const formatTaggedAt = (taggedAt) =>
  taggedAt
    ? sheetDateFormatter.format(new Date(taggedAt)).replace(/\. /g, '.')
    : ''

const MapPage = () => {
  const navigate = useNavigate()
  const apiLoaded = useApiIsLoaded()

  /**
   * 구글 지도는 아이콘의 아래 가운데를 좌표에 맞춘다. 그래서 핀 그림이 좌표보다
   * 위(북쪽)에 떠 보인다. 아이콘 정중앙을 좌표에 맞춘다.
   */
  const centeredIcon = (url, { width, height }) => {
    if (!apiLoaded || !window.google?.maps) return url

    const { Size, Point } = window.google.maps

    return {
      url,
      scaledSize: new Size(width, height),
      anchor: new Point(width / 2, height / 2),
    }
  }
  const [selectedPinId, setSelectedPinId] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  /** 영역(mapBounds)을 못 잡을 때 쓰는 배율 */
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  /** 핀이 둘 이상일 때만 쓴다. null 이면 mapCenter 로 잡는다. */
  const [mapBounds, setMapBounds] = useState(null)
  const [mapKey, setMapKey] = useState(0)

  const [currentPosition, setCurrentPosition] = useState(null)
  const [heading, setHeading] = useState(0)
  const compassStartedRef = useRef(false)

  /**
   * 나침반 값. iOS 는 `webkitCompassHeading`(북쪽 기준 시계방향)을 그대로 주고,
   * 그 밖에는 절대 방위일 때의 `alpha`(반시계방향)를 뒤집어 쓴다.
   */
  const handleOrientation = useCallback((event) => {
    const compass =
      typeof event.webkitCompassHeading === 'number'
        ? event.webkitCompassHeading
        : event.absolute && typeof event.alpha === 'number'
          ? 360 - event.alpha
          : null

    if (compass != null && !Number.isNaN(compass)) setHeading(compass)
  }, [])

  const startCompass = useCallback(() => {
    if (compassStartedRef.current) return

    compassStartedRef.current = true
    window.addEventListener('deviceorientationabsolute', handleOrientation)
    window.addEventListener('deviceorientation', handleOrientation)
  }, [handleOrientation])

  useEffect(() => {
    // iOS 는 사용자 탭에서 권한을 받아야 해서 여기서 바로 붙이지 않는다.
    if (typeof window.DeviceOrientationEvent?.requestPermission !== 'function') {
      startCompass()
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation)
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [handleOrientation, startCompass])
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [tripPins, setTripPins] = useState([])
  const [tripError, setTripError] = useState('')

  /**
   * 현재 위치 마커. 걸어 다니며 쓰는 화면이라 한 번만 받지 않고 계속 따라간다.
   * 권한을 거부하면 마커를 그리지 않는다.
   */
  useEffect(() => {
    if (!navigator.geolocation) return undefined

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setCurrentPosition({ lat: coords.latitude, lng: coords.longitude })

        // 나침반이 붙어 있으면 그쪽이 더 정확하다. 없을 때만 이동 방향을 쓴다.
        // heading 은 움직일 때만 들어오므로 멈춰 있으면 마지막 방향을 유지한다.
        if (
          !compassStartedRef.current &&
          coords.heading != null &&
          !Number.isNaN(coords.heading)
        ) {
          setHeading(coords.heading)
        }
      },
      () => setCurrentPosition(null),
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  /**
   * 4.1 로 종료된 여정을 받고, 진행 중인 여행이 있으면 목록 맨 앞에 얹는다.
   * 진행 중인 여행이 있으면 그쪽을, 없으면 가장 최근 여정을 기본으로 고른다.
   */
  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const [{ trips: list }, ongoing] = await Promise.all([
          getTrips(),
          getOngoingPins(),
        ])

        if (ignore) return

        // TODO: 4.1 에 pin_count · photo_count 가 없어 여정마다 4.2 를 더 부른다.
        // 목록 응답에 개수가 들어오면 이 호출을 지운다.
        const summaries = await Promise.all(
          list.map((trip) =>
            getTrip(trip.segment_id).catch(() => null),
          ),
        )

        if (ignore) return

        const ended = list.map((trip, index) => ({
          ...trip,
          pin_count: summaries[index]?.pin_count,
          photo_count: summaries[index]?.photo_count,
        }))

        const options =
          ongoing.pins.length > 0
            ? [
                {
                  segment_id: ONGOING_TRIP_ID,
                  name: '진행 중인 여행',
                  pin_count: ongoing.pins.length,
                },
                ...ended,
              ]
            : ended

        setTrips(options)
        setSelectedTripId(
          (current) => current ?? options[0]?.segment_id ?? null,
        )
      } catch (error) {
        if (!ignore) setTripError(error.message)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  /** 고른 여정의 핀만 받아 지도에 올린다(종료된 여정은 4.5). */
  useEffect(() => {
    if (!selectedTripId) return undefined

    let ignore = false
    setTripError('')

    const load = async () => {
      try {
        const { pins } =
          selectedTripId === ONGOING_TRIP_ID
            ? await getOngoingPins()
            : await getTripPins(selectedTripId)

        if (ignore) return

        setTripPins(pins)
        setSelectedPinId(null)
      } catch (error) {
        if (ignore) return

        setTripPins([])
        setTripError(error.message)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [selectedTripId])

  /**
   * 구간에서 제외한 핀은 지도에 올리지 않는다. 좌표가 없는 핀도 그릴 수 없다.
   * 방문한 순서대로 정렬해 마커 순번과 동선이 어긋나지 않게 한다.
   */
  const mapPins = useMemo(
    () =>
      tripPins
        .filter(
          ({ latitude, longitude, included_in_segment }) =>
            included_in_segment && latitude != null && longitude != null,
        )
        .sort((a, b) => a.tagged_at.localeCompare(b.tagged_at)),
    [tripPins],
  )

  const routePath = useMemo(
    () =>
      mapPins.map(({ latitude, longitude }) => ({
        lat: latitude,
        lng: longitude,
      })),
    [mapPins],
  )

  // 여정을 바꾸면 그 여정의 핀과 동선이 한눈에 들어오도록 지도를 다시 잡는다.
  useEffect(() => {
    const [first] = mapPins
    if (!first) return

    // 핀이 하나면 영역을 못 잡으니 그 핀을 가운데 둔다.
    setMapBounds(getPinBounds(mapPins))
    setMapCenter({ lat: first.latitude, lng: first.longitude })
    setMapZoom(DEFAULT_ZOOM)
    setMapKey((current) => current + 1)
  }, [mapPins])

  const selectedTrip = trips.find(
    ({ segment_id }) => segment_id === selectedTripId,
  )
  const selectedPin = mapPins.find(({ pin_id }) => pin_id === selectedPinId)

  const currentPositionIcon = useMemo(
    () => buildCurrentPositionIcon(heading),
    [heading],
  )

  const [pinDetail, setPinDetail] = useState(null)
  const [pinPhotos, setPinPhotos] = useState([])
  const [sheetError, setSheetError] = useState('')

  /** 핀을 고르면 시트에 채울 값을 5.1 · 5.4 로 받는다. */
  useEffect(() => {
    if (!selectedPinId) {
      setPinDetail(null)
      setPinPhotos([])
      setSheetError('')
      return undefined
    }

    let ignore = false
    setSheetError('')

    const load = async () => {
      try {
        const [detail, photoList] = await Promise.all([
          getPin(selectedPinId),
          getPinPhotos(selectedPinId),
        ])

        if (ignore) return

        setPinDetail(detail)
        setPinPhotos(photoList.photos)
      } catch (error) {
        if (ignore) return

        setPinDetail(null)
        setPinPhotos([])
        setSheetError(error.message)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [selectedPinId])

  const selectedIndex = mapPins.findIndex(
    ({ pin_id }) => pin_id === selectedPinId,
  )
  const coverPhoto =
    pinPhotos.find((photo) => photo.is_pin_cover) ?? pinPhotos[0]

  /** iOS 는 사용자 제스처 안에서만 나침반 권한을 물을 수 있다. */
  const requestCompass = async () => {
    const { DeviceOrientationEvent } = window
    if (typeof DeviceOrientationEvent?.requestPermission !== 'function') return

    try {
      const permission = await DeviceOrientationEvent.requestPermission()
      if (permission === 'granted') startCompass()
    } catch {
      // 거부하면 이동 방향(coords.heading)으로만 돌아간다.
    }
  }

  /**
   * 내 위치로 지도를 옮긴다.
   *
   * 고른 핀은 먼저 푼다. 지도를 다시 그리면 `FocusSelectedPin` 이 새 지도를
   * 받아 다시 동작해서, 내 위치로 갔다가 그 핀으로 되돌아간다.
   * 화면 밖으로 나간 핀의 시트를 열어두는 것도 맞지 않는다.
   */
  const handleLocate = () => {
    requestCompass()
    setSelectedPinId(null)

    if (currentPosition) {
      // 내 위치로 갈 때는 영역이 아니라 그 점을 가운데 두고 더 당겨 본다.
      setMapBounds(null)
      setMapCenter(currentPosition)
      setMapZoom(CURRENT_POSITION_ZOOM)
      setMapKey((current) => current + 1)
      return
    }

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude }

      setCurrentPosition(position)
      setMapBounds(null)
      setMapCenter(position)
      setMapZoom(CURRENT_POSITION_ZOOM)
      setMapKey((current) => current + 1)
    })
  }

  const selectTrip = (segmentId) => {
    setSelectedTripId(segmentId)
    setDropdownOpen(false)
  }

  return (
    <Page>
      <MapLayer>
        <GoogleMap
          key={mapKey}
          bounds={mapBounds}
          center={mapCenter}
          zoom={mapZoom}
          height="100%"
          borderRadius="0"
          bordered={false}
          mapOptions={{
            clickableIcons: false,
            keyboardShortcuts: false,
            minZoom: 3,
          }}
        >
          <Polyline
            path={routePath}
            strokeColor="#c99a45"
            strokeOpacity={0.92}
            strokeWeight={3}
          />

          {mapPins.map((pin) => {
            const isSelected = pin.pin_id === selectedPinId

            return (
              <Marker
                key={pin.pin_id}
                position={{ lat: pin.latitude, lng: pin.longitude }}
                icon={
                  isSelected
                    ? centeredIcon(activePinIcon, ACTIVE_PIN_SIZE)
                    : centeredIcon(pinIcon, PIN_SIZE)
                }
                title={pin.place_name || '이름 없는 장소'}
                zIndex={isSelected ? 3 : 2}
                onClick={() => setSelectedPinId(pin.pin_id)}
              />
            )
          })}

          {currentPosition && (
            <Marker
              position={currentPosition}
              icon={centeredIcon(currentPositionIcon, {
                width: CURRENT_POSITION_BOX,
                height: CURRENT_POSITION_BOX,
              })}
              title="현재 위치"
              zIndex={4}
            />
          )}

          {selectedPin && (
            <FocusSelectedPin
              latitude={selectedPin.latitude}
              longitude={selectedPin.longitude}
            />
          )}
        </GoogleMap>
      </MapLayer>

      {dropdownOpen && (
        <Scrim
          type="button"
          aria-label="여행 목록 닫기"
          onClick={() => setDropdownOpen(false)}
        />
      )}

      <TripSelector
        type="button"
        aria-expanded={dropdownOpen}
        aria-controls="trip-dropdown"
        onClick={() => {
          setSelectedPinId(null)
          setDropdownOpen((open) => !open)
        }}
      >
        <TripAvatar src={tripAvatar} alt="" />
        <TripName>{selectedTrip?.name ?? '여정 선택'}</TripName>
        <Chevron src={tripSelectChevron} alt="" />
      </TripSelector>

      <LocationButton
        type="button"
        aria-label="내 위치로 이동"
        $raised={Boolean(selectedPin)}
        onClick={handleLocate}
      >
        <img src={myLocationIcon} alt="" />
      </LocationButton>

      {!selectedPin && !dropdownOpen && (
        <RecordButton
          type="button"
          aria-label="현재 위치에 기록 추가"
          onClick={() => navigate('/map/pin/new')}
        >
          <img src={recordPlusIcon} alt="" />
        </RecordButton>
      )}

      {selectedPin && (
        <PinSheet
          ariaLabel="핀 정보"
          collapsedOffset={227}
          height={281}
        >
          <PinSheetContent>
          {sheetError ? (
            <SheetMessage role="alert">{sheetError}</SheetMessage>
          ) : !pinDetail ? (
            <SheetMessage>불러오는 중...</SheetMessage>
          ) : (
            <>
              <PinSummary>
                <PinPhoto>
                  {coverPhoto && <PinPhotoImage src={coverPhoto.file_path} alt="" />}
                </PinPhoto>
                <PinText>
                  <PinTitle>
                    {pinDetail.place_name ||
                      pinDetail.address ||
                      '이름 없는 장소'}
                  </PinTitle>
                  {pinDetail.address && <PinMeta>{pinDetail.address}</PinMeta>}
                  <PinMeta>{formatTaggedAt(pinDetail.tagged_at)}</PinMeta>
                  <TagList>
                    <Tag>사진 {pinPhotos.length}</Tag>
                    {pinDetail.voice_memo && <Tag>음성 1</Tag>}
                  </TagList>
                </PinText>
              </PinSummary>

              <PinDescription>
                {pinDetail.text_note || '남긴 기록이 없습니다.'}
              </PinDescription>

              <DetailButton
                type="button"
                onClick={() => navigate(`/map/pin/${selectedPinId}`)}
              >
                이 핀 기록 자세히 보기
              </DetailButton>

              <Pagination aria-label={`${selectedIndex + 1} / ${mapPins.length}`}>
                {mapPins.map((pin, index) => (
                  <Dot key={pin.pin_id} $active={index === selectedIndex} />
                ))}
              </Pagination>
            </>
          )}
          </PinSheetContent>
        </PinSheet>
      )}

      <NavBar activeOverride="map" />

      {dropdownOpen && (
        <TripDropdown id="trip-dropdown">
          <TripGroup>
            {trips.length === 0 && (
              <DropdownMessage>
                {tripError || '여정이 없습니다.'}
              </DropdownMessage>
            )}

            {trips.map((trip) => {
              const isSelected = trip.segment_id === selectedTripId

              return (
                <CityButton
                  key={trip.segment_id}
                  type="button"
                  $selected={isSelected}
                  aria-pressed={isSelected}
                  onClick={() => selectTrip(trip.segment_id)}
                >
                  <CityText>
                    <CityName $selected={isSelected}>{trip.name}</CityName>
                    <CityStats>
                      {formatCounts(trip)}
                    </CityStats>
                  </CityText>
                  {isSelected && <CheckIcon src={dropdownCheckIcon} alt="" />}
                </CityButton>
              )
            })}
          </TripGroup>
        </TripDropdown>
      )}
    </Page>
  )
}

export default MapPage

const Page = styled.main`
  position: relative;
  width: 100%;
  max-width: 450px;
  height: var(--app-viewport-height);
  min-height: 620px;
  margin: 0 auto;
  overflow: hidden;
  background: var(--Map-Base);
`

const MapLayer = styled.div`
  position: absolute;
  inset: 0;
`

const TripSelector = styled.button`
  position: absolute;
  z-index: 34;
  top: 58px;
  left: 19px;
  width: 160px;
  height: 48px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 24px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Card);
  color: var(--Text-Primary);
  cursor: pointer;
`

const TripAvatar = styled.img`
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
`

const TripName = styled.span`
  flex: 1;
  overflow: hidden;
  font: var(--text-ui-label);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Chevron = styled.img`
  width: 11.5px;
  height: 6.5px;
  flex: 0 0 auto;
  margin-left: -5px;
`

/* 핀 시트가 올라오면 그 위로 함께 올라간다. 시트 위 여백(29)은 접힌 상태와 같다.
   접힘: 시트 윗변 100 + 29 = 129 / 펼침: 시트 윗변 356 + 29 = 385 */
const LocationButton = styled.button`
  position: absolute;
  z-index: 9;
  right: 13px;
  bottom: ${({ $raised }) => ($raised ? '385px' : '129px')};
  width: 76px;
  height: 76px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: bottom 220ms ease;

  img {
    width: 76px;
    height: 76px;
    display: block;
  }
`

const RecordButton = styled.button`
  position: absolute;
  top: 56px;
  right: 13px;
  z-index: 9;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--Primary-Cognac);
  box-shadow: var(--Effect-CTA);
  cursor: pointer;

  img {
    width: 38px;
    height: 38px;
    display: block;
    object-fit: contain;
  }
`

const PinSheet = styled(SnapSheet)`
  z-index: 8;
  bottom: 75px;
`

const PinSheetContent = styled.div`
  height: 100%;
  padding: 0 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 17px;
`

const PinSummary = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 20px;
`

const PinPhoto = styled.div`
  width: 106px;
  height: 106px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 12px;
  background: var(--Map-Land);
`

const PinPhotoImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const SheetMessage = styled.p`
  padding-top: 20px;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
`

const PinText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const PinTitle = styled.h2`
  overflow: hidden;
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PinMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const TagList = styled.div`
  padding-top: 4px;
  display: flex;
  gap: 6px;
`

const Tag = styled.span`
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--Background-Base);
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

const PinDescription = styled.p`
  overflow: hidden;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DetailButton = styled(Button)`
  height: 48px;
  flex: 0 0 auto;
  color: var(--Text-Inverse);
  background: var(--Primary-Cognac);
  font: var(--text-ui-button);
`

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`

const Dot = styled.span`
  width: ${({ $active }) => ($active ? '16px' : '5px')};
  height: 5px;
  border-radius: 3px;
  background: ${({ $active }) =>
    $active ? 'var(--Primary-Cognac)' : 'rgb(181 161 140 / 40%)'};
`

const Scrim = styled.button`
  position: absolute;
  z-index: 30;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: rgb(42 37 34 / 35%);
  cursor: default;
`

const TripDropdown = styled.section`
  position: absolute;
  z-index: 33;
  top: 114px;
  right: 43px;
  left: 19px;
  max-height: calc(100% - 142px);
  padding: 20px 15px;
  overflow-y: auto;
  border-radius: 18px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Card);
`

const TripGroup = styled.div`
  display: flex;
  flex-direction: column;
`

const CityButton = styled.button`
  width: 100%;
  min-height: 58px;
  padding: 11px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 12px;
  background: ${({ $selected }) =>
    $selected ? 'rgb(181 118 59 / 10%)' : 'transparent'};
  text-align: left;
  cursor: pointer;
`

const DropdownMessage = styled.p`
  padding: 14px 15px;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
`

const CityText = styled.span`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const CityName = styled.span`
  color: ${({ $selected }) =>
    $selected ? 'var(--Primary-Cognac)' : 'var(--Text-Primary)'};
  font: var(--text-ui-label);
`

const CityStats = styled.span`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const CheckIcon = styled.img`
  width: 15px;
  height: 12px;
  flex: 0 0 auto;
`
