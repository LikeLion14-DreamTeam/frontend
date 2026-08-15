import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Marker, Polyline, useApiIsLoaded } from '@vis.gl/react-google-maps'
import Button from '../../components/common/Button'
import GoogleMap from '../../components/common/GoogleMap'
import NavBar from '../../components/layout/NavBar'
import currentPositionIcon from '../../assets/map/current-position.svg'
import dropdownCheckIcon from '../../assets/map/dropdown-check.svg'
import activePinIcon from '../../assets/map/map-pin-active.svg'
import pinIcon from '../../assets/map/map-pin.svg'
import myLocationIcon from '../../assets/map/my-location.svg'
import recordPlusIcon from '../../assets/map/record-plus.png'
import tripAvatar from '../../assets/map/trip-avatar.svg'
import tripSelectChevron from '../../assets/icons/trip-select-chevron.svg'
import { getPin, getPinPhotos } from '../../features/pins/pinApi'
import { getTripPins, getTrips } from '../../features/trips/tripApi'
import { MAP_STYLES } from './mapStyles'

// 여정을 아직 못 받았을 때 잠깐 보여줄 위치.
const DEFAULT_CENTER = { lat: 48.8569, lng: 2.3376 }

// 아이콘 파일의 원본 크기. 정중앙을 좌표에 맞추는 데 쓴다.
const PIN_SIZE = { width: 38, height: 38 }
const ACTIVE_PIN_SIZE = { width: 48, height: 48 }
const CURRENT_POSITION_SIZE = { width: 68, height: 56 }

const rangeFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const formatRange = (startAt, endAt) =>
  [startAt, endAt]
    .filter(Boolean)
    .map((value) => rangeFormatter.format(new Date(value)).replace(/\.$/, ''))
    .join(' ~ ')

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
  const [mapKey, setMapKey] = useState(0)

  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [tripPins, setTripPins] = useState([])
  const [tripError, setTripError] = useState('')

  /** 4.1. 첫 여정을 기본 선택으로 잡는다. */
  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const { trips: list } = await getTrips()

        if (ignore) return

        setTrips(list)
        setSelectedTripId((current) => current ?? list[0]?.segment_id ?? null)
      } catch (error) {
        if (!ignore) setTripError(error.message)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  /** 4.5. 고른 여정의 핀만 받아 지도에 올린다. */
  useEffect(() => {
    if (!selectedTripId) return undefined

    let ignore = false
    setTripError('')

    const load = async () => {
      try {
        const { pins } = await getTripPins(selectedTripId)

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

  // 여정을 바꾸면 그 여정의 첫 핀으로 지도를 옮긴다.
  useEffect(() => {
    const [first] = mapPins
    if (!first) return

    setMapCenter({ lat: first.latitude, lng: first.longitude })
    setMapKey((current) => current + 1)
  }, [mapPins])

  const selectedTrip = trips.find(
    ({ segment_id }) => segment_id === selectedTripId,
  )
  const selectedPin = mapPins.find(({ pin_id }) => pin_id === selectedPinId)

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

  const handleLocate = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setMapCenter({ lat: coords.latitude, lng: coords.longitude })
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
          center={mapCenter}
          zoom={13.3}
          height="100%"
          styles={MAP_STYLES}
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

          <Marker
            position={{ lat: 48.8589, lng: 2.3462 }}
            icon={centeredIcon(currentPositionIcon, CURRENT_POSITION_SIZE)}
            title="현재 위치"
            zIndex={4}
          />
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

      <PinSheet $expanded={Boolean(selectedPin)} aria-hidden={!selectedPin}>
        <SheetHandle
          type="button"
          aria-label={selectedPin ? '핀 정보 접기' : '핀 정보 펼치기'}
          onClick={() => {
            if (selectedPin) setSelectedPinId(null)
            else if (mapPins[0]) setSelectedPinId(mapPins[0].pin_id)
          }}
        >
          <span />
        </SheetHandle>

        <SheetContent $visible={Boolean(selectedPin)}>
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
        </SheetContent>
      </PinSheet>

      <NavBar activeOverride="map" />

      {dropdownOpen && (
        <TripDropdown id="trip-dropdown">
          {/* TODO: 국가별 묶음은 4.1 응답에 국가 정보가 없어 붙이지 못했다. */}
          <TripGroup>
            {trips.length === 0 && (
              <DropdownMessage>
                {tripError || '종료된 여정이 없습니다.'}
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
                      {formatRange(trip.start_at, trip.end_at)}
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

const PinSheet = styled.section`
  position: absolute;
  z-index: 8;
  right: 0;
  bottom: ${({ $expanded }) => ($expanded ? '75px' : '-181px')};
  left: 0;
  height: 281px;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Bottom-Sheet);
  transition: bottom 220ms ease;
`

const SheetHandle = styled.button`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 50%;
  width: 72px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  transform: translateX(-50%);
  cursor: pointer;

  span {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: rgb(181 161 140 / 50%);
  }
`

const SheetContent = styled.div`
  height: 100%;
  padding: 30px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 17px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 140ms ease;
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
