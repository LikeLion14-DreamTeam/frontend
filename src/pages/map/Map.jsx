import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Marker, Polyline } from '@vis.gl/react-google-maps'
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
import { MAP_STYLES } from './mapStyles'

const PARIS_CENTER = { lat: 48.8569, lng: 2.3376 }

// TODO: 지도 뷰 API 연동 대기. GET /trips/{segmentId}/pins(4.5)로 교체해야 한다.
// 그때까지는 핀 상세로 이동만 되도록 id 를 mock 의 pin_id 와 맞춰둔다.
const pins = [
  {
    id: 101,
    name: '파리 에펠탑 근처',
    lat: 48.8584,
    lng: 2.2945,
  },
  {
    id: 102,
    name: '루브르 박물관 앞',
    lat: 48.8606,
    lng: 2.3376,
  },
  {
    id: 103,
    name: '몽마르트르 언덕',
    lat: 48.8867,
    lng: 2.3431,
  },
  {
    id: 104,
    name: '이름 없는 장소',
    lat: 48.853,
    lng: 2.3499,
  },
  {
    id: 105,
    name: '베르사유 궁전 정원',
    lat: 48.8049,
    lng: 2.1204,
  },
]

const routePath = pins.map(({ lat, lng }) => ({ lat, lng }))

const tripGroups = [
  {
    country: 'FRANCE',
    countryKo: '프랑스',
    cities: [
      { id: 'paris', name: '파리', stats: '핀 12 · 사진 138' },
      { id: 'versailles', name: '베르사유', stats: '핀 3 · 사진 24' },
    ],
  },
  {
    country: 'CZECHIA',
    countryKo: '체코',
    cities: [
      { id: 'prague', name: '프라하', stats: '핀 9 · 사진 94' },
      {
        id: 'cesky-krumlov',
        name: '체스키크룸로프',
        stats: '핀 4 · 사진 31',
      },
    ],
  },
  {
    country: 'JAPAN',
    countryKo: '일본',
    cities: [{ id: 'kyoto', name: '교토', stats: '핀 7 · 사진 62' }],
  },
]

const MapPage = () => {
  const navigate = useNavigate()
  const [selectedPinId, setSelectedPinId] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState({
    id: 'paris',
    city: '파리',
    country: '프랑스',
  })
  const [mapCenter, setMapCenter] = useState(PARIS_CENTER)
  const [mapKey, setMapKey] = useState(0)

  const selectedPin = useMemo(
    () => pins.find(({ id }) => id === selectedPinId),
    [selectedPinId],
  )

  const handleLocate = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setMapCenter({ lat: coords.latitude, lng: coords.longitude })
      setMapKey((current) => current + 1)
    })
  }

  const selectTrip = (city, country) => {
    setSelectedTrip({ id: city.id, city: city.name, country })
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

          {pins.map((pin) => {
            const isSelected = pin.id === selectedPinId

            return (
              <Marker
                key={pin.id}
                position={{ lat: pin.lat, lng: pin.lng }}
                icon={isSelected ? activePinIcon : pinIcon}
                title={pin.name}
                zIndex={isSelected ? 3 : 2}
                onClick={() => setSelectedPinId(pin.id)}
              />
            )
          })}

          <Marker
            position={{ lat: 48.8589, lng: 2.3462 }}
            icon={currentPositionIcon}
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
        <TripName>{`${selectedTrip.city} · ${selectedTrip.country}`}</TripName>
        <Chevron src={tripSelectChevron} alt="" />
      </TripSelector>

      <LocationButton type="button" aria-label="내 위치로 이동" onClick={handleLocate}>
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
            else setSelectedPinId(pins[2].id)
          }}
        >
          <span />
        </SheetHandle>

        <SheetContent $visible={Boolean(selectedPin)}>
          <PinSummary>
            <PinPhoto aria-hidden="true" />
            <PinText>
              <PinTitle>상세 주소</PinTitle>
              <PinMeta>자동 입력 주소</PinMeta>
              <PinMeta>2025.06.14 오전 10:32</PinMeta>
              <TagList>
                <Tag>사진 8</Tag>
                <Tag>음성 1</Tag>
              </TagList>
            </PinText>
          </PinSummary>

          <PinDescription>
            오래된 돌담을 따라 걷다가, 해가 드는 순간에…
          </PinDescription>

          <DetailButton
            type="button"
            onClick={() => navigate(`/map/pin/${selectedPin?.id}`)}
          >
            이 핀 기록 자세히 보기
          </DetailButton>

          <Pagination aria-label="3 / 5">
            <Dot />
            <Dot />
            <Dot $active />
            <Dot />
            <Dot />
          </Pagination>
        </SheetContent>
      </PinSheet>

      <NavBar activeOverride="map" />

      {dropdownOpen && (
        <TripDropdown id="trip-dropdown">
          {tripGroups.map((group) => (
            <TripGroup key={group.country}>
              <CountryHeading>
                <CountryName>{group.country}</CountryName>
                <CountryNameKo>{group.countryKo}</CountryNameKo>
              </CountryHeading>

              {group.cities.map((city) => {
                const isSelected = city.id === selectedTrip.id

                return (
                  <CityButton
                    key={city.id}
                    type="button"
                    $selected={isSelected}
                    aria-pressed={isSelected}
                    onClick={() => selectTrip(city, group.countryKo)}
                  >
                    <CityText>
                      <CityName $selected={isSelected}>{city.name}</CityName>
                      <CityStats>{city.stats}</CityStats>
                    </CityText>
                    {isSelected && <CheckIcon src={dropdownCheckIcon} alt="" />}
                  </CityButton>
                )
              })}
            </TripGroup>
          ))}
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

const LocationButton = styled.button`
  position: absolute;
  z-index: 9;
  right: 13px;
  bottom: 129px;
  width: 76px;
  height: 76px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

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
  border-radius: 12px;
  background: var(--Map-Land);
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

const CountryHeading = styled.div`
  padding: 14px 12px 6px;
  display: flex;
  align-items: center;
  gap: 8px;

  ${TripGroup}:first-child & {
    padding-top: 8px;
  }
`

const CountryName = styled.span`
  color: var(--Accent-Gold);
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1.82px;
  line-height: 18px;
`

const CountryNameKo = styled.span`
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
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
