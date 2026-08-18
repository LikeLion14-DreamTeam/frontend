import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
  Marker,
  useApiIsLoaded,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import GoogleMap, { FOCUS_ZOOM } from '../../components/common/GoogleMap'
import MapOverlay from '../../components/common/MapOverlay'
import PinPopover from '../../components/common/PinPopover'
import RoutePolyline from '../../components/common/RoutePolyline'
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
  getPinsByCountry,
  getOngoingPins,
  getPin,
  getPinPhotos,
} from '../../features/pins/pinApi'
import {
  getCountryStamps,
  getTrip,
  getTripPins,
  getTrips,
} from '../../features/trips/tripApi'

// 위치 권한을 받을 수 없을 때만 쓰는 마지막 fallback.
const FALLBACK_CENTER = { lat: 37.5665, lng: 126.978 }

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
   위쪽은 여정 선택 드롭다운, 아래쪽은 하단 내비게이션에 가려지는 만큼 더 준다. */
const FIT_PADDING = { top: 110, right: 48, bottom: 150, left: 48 }

/* 핀을 고르면 이 배율까지 확대한다. 이미 더 당겨 봤다면 그대로 둔다.
   영역 맞춤 상한과 같은 값이라, 개요에서 핀을 골라도 배율이 튀지 않는다. */
const SELECTED_PIN_ZOOM = FOCUS_ZOOM

/* 고른 핀을 화면 가운데에서 이만큼 내린다(음수면 아래로).
   말풍선이 핀 위에 서므로, 핀을 가운데보다 내려야 말풍선이 다 보인다. */
const SELECTED_PIN_SHIFT = -82

/** 핀으로 옮겨가는 데 걸리는 시간 */
const FOCUS_DURATION_MS = 520

/* 처음에 붙고 끝에서 감속한다. */
const easeOut = (progress) => 1 - (1 - progress) ** 3

const prefersReducedMotion = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * 화면 픽셀만큼 남쪽으로 옮긴 중심을 구한다. 그만큼 핀이 위로 올라온다.
 *
 * 세계 좌표는 배율과 무관하게 256px 기준이라, 화면 픽셀을 배율로 나눠서 더한다.
 */
const getOffsetCenter = (map, core, position, zoom) => {
  const projection = map.getProjection()
  if (!core || !projection) return position

  const point = projection.fromLatLngToPoint(position)
  const shifted = new core.Point(
    point.x,
    point.y + SELECTED_PIN_SHIFT / 2 ** zoom,
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

  /*
   * 지도가 자리를 잡기 전에는 투영(projection)이 없다. 그때 옮기면 핀을 아래로
   * 내리는 계산을 못 해 핀이 화면 한가운데에 서 버린다. 핀 상세를 보다 뒤로
   * 왔을 때처럼 지도와 선택이 같이 살아나는 경우가 그렇다.
   */
  const [isProjectionReady, setIsProjectionReady] = useState(false)

  useEffect(() => {
    if (!map || isProjectionReady) return undefined

    if (map.getProjection()) {
      setIsProjectionReady(true)
      return undefined
    }

    const listener = map.addListener('idle', () => setIsProjectionReady(true))

    return () => listener.remove()
  }, [isProjectionReady, map])

  useEffect(() => {
    if (!map || !core || !isProjectionReady) return undefined

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
  }, [core, isProjectionReady, latitude, longitude, map])

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

const popoverDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

/* ko-KR 은 "2025. 06. 14. 오전 10:32" 로 준다.
   날짜의 점은 붙이고, 시각 앞은 시안대로 띄운다. */
const formatTaggedAt = (taggedAt) =>
  taggedAt
    ? popoverDateFormatter
        .format(new Date(taggedAt))
        .replace(/\. /g, '.')
        .replace(/\.(오전|오후)/, ' $1')
    : ''

/* 위치 권한은 허용했지만 기기가 좌표를 못 잡았을 때. */
const LOCATE_FAILED_MESSAGE = '지금 위치를 확인하지 못했어요. 잠시 후 다시 시도해주세요.'

/** 알림이 스스로 사라지기까지 */
const LOCATE_TOAST_MS = 4000

const MapPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const apiLoaded = useApiIsLoaded()
  const countryCode = (searchParams.get('country_code') ?? '').trim().toUpperCase()
  const countryName = (searchParams.get('country_name') ?? '').trim()
  const isCountryFilterMode = countryCode.length > 0

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
  const [mapCenter, setMapCenter] = useState(null)
  /** 영역(mapBounds)을 못 잡을 때 쓰는 배율 */
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  /** 핀이 둘 이상일 때만 쓴다. null 이면 mapCenter 로 잡는다. */
  const [mapBounds, setMapBounds] = useState(null)
  const [mapKey, setMapKey] = useState(0)

  const [currentPosition, setCurrentPosition] = useState(null)
  const [heading, setHeading] = useState(0)
  const compassStartedRef = useRef(false)
  const hasInitialMapViewRef = useRef(false)

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
  const [countryStamps, setCountryStamps] = useState([])
  const [selectedTripId, setSelectedTripId] = useState(null)
  /**
   * 들어올 때 주소에 적혀 있던 여정과 핀.
   *
   * 핀 상세를 보다 뒤로 오면 이 값으로 직전 화면을 그대로 되살린다.
   * 처음 값만 쓰므로, 아래에서 주소를 갱신해도 목록을 다시 부르지 않는다.
   */
  const initialParams = useRef({
    trip: searchParams.get('trip'),
    pin: searchParams.get('pin'),
  }).current
  const hasRestoredPinRef = useRef(false)
  const [tripPins, setTripPins] = useState([])
  const [tripError, setTripError] = useState('')
  const [locateError, setLocateError] = useState('')

  /**
   * 현재 위치 마커. 걸어 다니며 쓰는 화면이라 한 번만 받지 않고 계속 따라간다.
   * 권한을 거부하면 마커를 그리지 않는다.
   */
  useEffect(() => {
    if (!navigator.geolocation) {
      setMapCenter(FALLBACK_CENTER)
      setMapKey((current) => current + 1)
      hasInitialMapViewRef.current = true
      return undefined
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude }

        setCurrentPosition(position)

        if (!hasInitialMapViewRef.current) {
          hasInitialMapViewRef.current = true
          setMapBounds(null)
          setMapCenter(position)
          setMapZoom(CURRENT_POSITION_ZOOM)
          setMapKey((current) => current + 1)
        }

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
      () => {
        setCurrentPosition(null)

        if (!hasInitialMapViewRef.current) {
          hasInitialMapViewRef.current = true
          setMapCenter(FALLBACK_CENTER)
          setMapKey((current) => current + 1)
        }
      },
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
        const [{ trips: list }, ongoing, { stamps }] = await Promise.all([
          getTrips(),
          getOngoingPins(),
          getCountryStamps(),
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
        setCountryStamps(stamps ?? [])

        // 국가별로 보는 중이면 여정을 고르지 않는다.
        if (!isCountryFilterMode) {
          setSelectedTripId((current) => {
            if (current) return current

            // 주소에 적힌 여정이 아직 있으면 그걸 고른다. 없으면 목록 첫 번째.
            const fromUrl = options.find(
              ({ segment_id }) => String(segment_id) === initialParams.trip,
            )

            return fromUrl?.segment_id ?? options[0]?.segment_id ?? null
          })
        }
      } catch (error) {
        if (!ignore) setTripError(error.message)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [initialParams.trip, isCountryFilterMode])

  /** 고른 여정의 핀만 받아 지도에 올린다(종료된 여정은 4.5). */
  useEffect(() => {
    if (isCountryFilterMode) return undefined
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
  }, [isCountryFilterMode, selectedTripId])

  /** 국가 도장 탭에서 들어오면 그 나라의 핀만 보여준다(구간 배정 여부 무관). */
  useEffect(() => {
    if (!isCountryFilterMode) return undefined

    let ignore = false
    setTripError('')
    setDropdownOpen(false)

    const load = async () => {
      try {
        const { pins } = await getPinsByCountry({ countryCode })
        if (ignore) return

        setTripPins(pins)
        setSelectedPinId(null)
        setSelectedTripId(null)
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
  }, [countryCode, isCountryFilterMode])

  /**
   * 구간에서 제외한 핀은 지도에 올리지 않는다. 좌표가 없는 핀도 그릴 수 없다.
   * 방문한 순서대로 정렬해 마커 순번과 동선이 어긋나지 않게 한다.
   */
  const mapPins = useMemo(
    () =>
      tripPins
        .filter(
          ({ latitude, longitude, included_in_segment }) =>
            (isCountryFilterMode || included_in_segment) &&
            latitude != null &&
            longitude != null,
        )
        .sort((a, b) => a.tagged_at.localeCompare(b.tagged_at)),
    [isCountryFilterMode, tripPins],
  )

  const routePath = useMemo(
    () =>
      (isCountryFilterMode
        ? []
        : mapPins.map(({ latitude, longitude }) => ({
            lat: latitude,
            lng: longitude,
          }))),
    [isCountryFilterMode, mapPins],
  )

  // 여정을 바꾸면 그 여정의 핀과 동선이 한눈에 들어오도록 지도를 다시 잡는다.
  useEffect(() => {
    const [first] = mapPins
    if (!first) return

    const bounds = getPinBounds(mapPins)

    hasInitialMapViewRef.current = true
    setMapBounds(bounds)
    setMapCenter({ lat: first.latitude, lng: first.longitude })
    /*
     * 핀이 하나면 맞출 영역이 없어 배율을 직접 줘야 한다. 영역 맞춤 상한과 같은
     * 값을 써서, 핀이 하나든 여럿이든 첫 배율이 같게 보이도록 한다.
     */
    setMapZoom(bounds ? DEFAULT_ZOOM : FOCUS_ZOOM)
    setMapKey((current) => current + 1)
  }, [mapPins])

  /*
   * 핀 상세를 보다 뒤로 왔으면 그 핀을 다시 고른 상태로 되살린다.
   * 핀 목록이 준비된 뒤 한 번만 한다. 이후 사용자가 고르는 것을 덮으면 안 된다.
   */
  useEffect(() => {
    if (hasRestoredPinRef.current || !initialParams.pin) return
    if (mapPins.length === 0) return

    hasRestoredPinRef.current = true

    const target = mapPins.find(
      ({ pin_id }) => String(pin_id) === initialParams.pin,
    )

    if (target) setSelectedPinId(target.pin_id)
  }, [initialParams.pin, mapPins])

  /*
   * 보고 있는 여정과 고른 핀을 주소에 남긴다. 핀 상세로 갔다가 뒤로 오면
   * 이 주소로 돌아와 직전 화면이 그대로 살아난다.
   *
   * `replace` 라 기록이 쌓이지 않는다. 핀을 몇 번 눌러 보다 뒤로 갈 때
   * 지도 안에서 맴돌지 않고 직전 화면으로 나가야 맞다.
   */
  useEffect(() => {
    // 국가별로 보는 중에는 주소가 country_code 를 담고 있다. 덮어쓰면 안 된다.
    if (isCountryFilterMode || !selectedTripId) return

    const params = new URLSearchParams({ trip: String(selectedTripId) })
    if (selectedPinId) params.set('pin', String(selectedPinId))

    navigate(`/map?${params}`, { replace: true })
  }, [isCountryFilterMode, navigate, selectedPinId, selectedTripId])

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
  const [popoverError, setPopoverError] = useState('')

  /** 핀을 고르면 말풍선에 채울 값을 5.1 · 5.4 로 받는다. */
  useEffect(() => {
    if (!selectedPinId) {
      setPinDetail(null)
      setPinPhotos([])
      setPopoverError('')
      return undefined
    }

    let ignore = false
    setPopoverError('')

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
        setPopoverError(error.message)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [selectedPinId])

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
    setLocateError('')

    const moveTo = (position) => {
      // 내 위치로 갈 때는 영역이 아니라 그 점을 가운데 두고 더 당겨 본다.
      setMapBounds(null)
      setMapCenter(position)
      setMapZoom(CURRENT_POSITION_ZOOM)
      setMapKey((current) => current + 1)
    }

    if (currentPosition) {
      moveTo(currentPosition)
      return
    }

    if (!navigator.geolocation) {
      setLocateError(LOCATE_FAILED_MESSAGE)
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude }

        setCurrentPosition(position)
        moveTo(position)
      },
      /* 못 받았다는 걸 알려야 한다. 알리지 않으면 버튼이 고장 난 것처럼 보인다. */
      () => setLocateError(LOCATE_FAILED_MESSAGE),
      /* 기본값은 기다리는 시간이 없어, 못 잡으면 영영 안 돌아올 수 있다. */
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  useEffect(() => {
    if (!locateError) return undefined

    const timer = setTimeout(() => setLocateError(''), LOCATE_TOAST_MS)

    return () => clearTimeout(timer)
  }, [locateError])

  const selectTrip = (segmentId) => {
    setSelectedTripId(segmentId)
    setDropdownOpen(false)
    if (isCountryFilterMode) navigate('/map')
  }

  const selectCountry = (stamp) => {
    const nextCountryCode = stamp?.country_code?.toUpperCase()
    if (!nextCountryCode) return

    setDropdownOpen(false)
    if (nextCountryCode === countryCode) return

    const query = new URLSearchParams({
      country_code: nextCountryCode,
      country_name: stamp.country_name ?? '',
    })
    navigate(`/map?${query.toString()}`)
  }

  const isMapReady = Boolean(mapBounds || mapCenter)

  return (
    <Page>
      <MapLayer>
        {isMapReady ? (
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
              onClick: () => setSelectedPinId(null),
            }}
          >
            <RoutePolyline path={routePath} />

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
                clickable={false}
                title="현재 위치"
                zIndex={1}
              />
            )}

            {selectedPin && (
              <>
                <FocusSelectedPin
                  latitude={selectedPin.latitude}
                  longitude={selectedPin.longitude}
                />

                <MapOverlay
                  latitude={selectedPin.latitude}
                  longitude={selectedPin.longitude}
                >
                  <PopoverAnchor>
                    <PinPopover
                      title={
                        pinDetail?.place_name ||
                        pinDetail?.address ||
                        '이름 없는 장소'
                      }
                      taggedAt={formatTaggedAt(pinDetail?.tagged_at)}
                      photoCount={pinPhotos.length}
                      hasVoiceMemo={Boolean(pinDetail?.voice_memo)}
                      photos={pinDetail?.representative_photos ?? []}
                      message={
                        popoverError || (pinDetail ? '' : '불러오는 중...')
                      }
                      onClose={() => setSelectedPinId(null)}
                      onDetail={() => navigate(`/map/pin/${selectedPinId}`)}
                    />
                  </PopoverAnchor>
                </MapOverlay>
              </>
            )}
          </GoogleMap>
        ) : (
          <MapBootPlaceholder aria-label="현재 위치 확인 중" />
        )}
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
        <TripSelectorInner>
          <TripAvatar src={tripAvatar} alt="" />
          <TripName>
            {isCountryFilterMode
              ? countryName || countryCode
              : selectedTrip?.name ?? '여정 선택'}
          </TripName>
          <Chevron src={tripSelectChevron} alt="" />
        </TripSelectorInner>
      </TripSelector>

      <LocationButton
        type="button"
        aria-label="내 위치로 이동"
        onClick={handleLocate}
      >
        <img src={myLocationIcon} alt="" />
      </LocationButton>

      {!selectedPin && !dropdownOpen && (
        <RecordButton
          type="button"
          aria-label="현재 위치에 기록 추가"
          /* 수동 핀 추가 화면의 주소 입력칸·취소 버튼으로 이어진다. */
          onClick={() => navigate('/map/pin/new', { viewTransition: true })}
        >
          <img src={recordPlusIcon} alt="" />
        </RecordButton>
      )}

      {locateError && <LocateToast role="alert">{locateError}</LocateToast>}

      <NavBar activeOverride="map" />

      {dropdownOpen && (
        <TripDropdown id="trip-dropdown">
          <TripGroup>
            <DropdownSectionTitle>여정별</DropdownSectionTitle>
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
          <DropdownDivider aria-hidden="true" />
          <CountryGroup>
            <DropdownSectionTitle>국가별</DropdownSectionTitle>
            {countryStamps.length === 0 && (
              <DropdownMessage>방문한 국가가 없습니다.</DropdownMessage>
            )}

            {countryStamps.map((stamp) => {
              const isSelected =
                isCountryFilterMode &&
                stamp.country_code?.toUpperCase() === countryCode

              return (
                <CityButton
                  key={stamp.country_code}
                  type="button"
                  $selected={isSelected}
                  aria-pressed={isSelected}
                  onClick={() => selectCountry(stamp)}
                >
                  <CityText>
                    <CityName $selected={isSelected}>
                      {stamp.country_name}
                    </CityName>
                    <CityStats>핀 {stamp.pin_count ?? 0}</CityStats>
                  </CityText>
                  {isSelected && <CheckIcon src={dropdownCheckIcon} alt="" />}
                </CityButton>
              )
            })}
          </CountryGroup>
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

const MapBootPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: var(--Map-Base);
`

/* 지도 위에 뜬 버튼들이 화면 가장자리에서 띄우는 여백.
   내 위치 버튼은 아래도 하단 내비게이션(75) 위로 같은 만큼 띄운다. */
const MAP_BUTTON_INSET = 13

/* 여정 선택 버튼의 자리. 핀 추가 버튼이 같은 줄에 서도록 여기서 가져다 쓴다. */
const TRIP_SELECTOR_TOP = 19
const TRIP_SELECTOR_HEIGHT = 40

/* 여정 이름이 잘리지 않도록 글에 맞춰 늘어난다. 위아래 여백은 그림(28)에
   맞춰 최소로만 두고, 지나치게 긴 이름만 상한에서 말줄임으로 넘긴다.
   왼쪽 여백은 그림이 동그라미라 위아래와 거의 같게 둬야 가운데로 보인다. */
const TripSelector = styled.button`
  position: absolute;
  z-index: 34;
  /* 수동 핀 추가 화면의 주소 입력칸과 이어지는 이름이다. */
  view-transition-name: map-top-bar;
  top: ${TRIP_SELECTOR_TOP}px;
  /* 왼쪽 여백은 버튼들의 오른쪽 여백과 같은 값이다. */
  left: ${MAP_BUTTON_INSET}px;
  width: max-content;
  max-width: 240px;
  height: ${TRIP_SELECTOR_HEIGHT}px;
  padding: 6px 14px 6px 7px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 20px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Card);
  color: var(--Text-Primary);
  cursor: pointer;
`

/* 알약은 폭이 늘어나지만 안의 내용은 늘어나면 안 된다. 따로 이름을 붙여
   상자 밖으로 빼내면, 수동 핀 추가 화면의 내용과 겹치지 않고 흐려지며 바뀐다.
   두 화면의 이름을 다르게 둔 것이 그래서다. */
const TripSelectorInner = styled.span`
  view-transition-name: map-top-bar-trip;
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
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

/* 아이콘 파일(76)은 그림자가 번지는 자리까지 담고 있어 눈에 보이는 원(48)보다
   크다. 그래서 원의 지름을 정하고 파일 크기를 거기서 거꾸로 구한다.
   원의 가장자리를 여백에 맞추려면 그림자 여백만큼 밖으로 밀어야 한다. */
const LOCATION_CIRCLE_SIZE = 34
const LOCATION_SHADOW_SCALE = LOCATION_CIRCLE_SIZE / 48
const LOCATION_BUTTON_BOX = 76 * LOCATION_SHADOW_SCALE
const LOCATION_SHADOW_RIGHT = 14 * LOCATION_SHADOW_SCALE
const LOCATION_SHADOW_BOTTOM = 18 * LOCATION_SHADOW_SCALE

const LocationButton = styled.button`
  position: absolute;
  z-index: 9;
  right: ${MAP_BUTTON_INSET - LOCATION_SHADOW_RIGHT}px;
  bottom: ${75 + MAP_BUTTON_INSET - LOCATION_SHADOW_BOTTOM}px;
  width: ${LOCATION_BUTTON_BOX}px;
  height: ${LOCATION_BUTTON_BOX}px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: ${LOCATION_BUTTON_BOX}px;
    height: ${LOCATION_BUTTON_BOX}px;
    display: block;
  }
`

/* 여정 선택 버튼과 같은 줄이다. 높이가 서로 달라, 윗자리를 맞추는 대신
   가운데를 맞춘다. 오른쪽 여백은 아래 내 위치 버튼과 같은 값으로 둔다. */
const RECORD_BUTTON_SIZE = 40

/* 하단 내비게이션 바로 위, 가운데에 잠깐 떴다 사라진다.
   내 위치 버튼은 오른쪽에 있어 겹치지 않는다. */
const LocateToast = styled.p`
  position: absolute;
  z-index: 9;
  bottom: 95px;
  left: 50%;
  max-width: calc(100% - 100px);
  padding: 8px 14px;
  border-radius: 16px;
  background: rgb(36 28 22 / 82%);
  color: var(--Text-Inverse);
  font: var(--text-ui-caption);
  text-align: center;
  word-break: keep-all;
  transform: translateX(-50%);
`

const RecordButton = styled.button`
  position: absolute;
  /* 수동 핀 추가 화면의 취소 버튼과 이어지는 이름이다. */
  view-transition-name: map-top-action;
  top: ${TRIP_SELECTOR_TOP + (TRIP_SELECTOR_HEIGHT - RECORD_BUTTON_SIZE) / 2}px;
  right: ${MAP_BUTTON_INSET}px;
  z-index: 9;
  width: ${RECORD_BUTTON_SIZE}px;
  height: ${RECORD_BUTTON_SIZE}px;
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
    view-transition-name: map-top-action-icon;
    width: 30px;
    height: 30px;
    display: block;
    object-fit: contain;
  }
`

/* 좌표는 핀 그림의 한가운데다. 핀 위쪽 절반(24)과 시안의 틈(7)만큼 더 띄워
   꼬리 끝이 핀 바로 위에 오게 한다. */
const PopoverAnchor = styled.div`
  position: absolute;
  bottom: 31px;
  left: 0;
  transform: translateX(-50%);
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

/* 여정 선택 버튼(19 + 40) 아래 8px 에 붙는다. */
const TripDropdown = styled.section`
  position: absolute;
  z-index: 33;
  top: 67px;
  right: 43px;
  left: ${MAP_BUTTON_INSET}px;
  max-height: calc(100% - 95px);
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

const DropdownSectionTitle = styled.p`
  padding: 4px 15px 6px;
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

const DropdownDivider = styled.div`
  height: 1px;
  margin: 10px 15px;
  background: var(--Border-Default);
`

const CountryGroup = styled.div`
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
