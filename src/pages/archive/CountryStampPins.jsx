import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { Marker, useApiIsLoaded } from '@vis.gl/react-google-maps'
import GoogleMap from '../../components/common/GoogleMap'
import pinIcon from '../../assets/map/map-pin.svg'
import activePinIcon from '../../assets/map/map-pin-active.svg'
import { getPinsByCountry } from '../../features/pins/pinApi'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_ZOOM = 5
const FIT_PADDING = { top: 90, right: 36, bottom: 96, left: 36 }

const PIN_SIZE = { width: 38, height: 38 }
const ACTIVE_PIN_SIZE = { width: 48, height: 48 }

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

const CountryStampPins = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const apiLoaded = useApiIsLoaded()

  const countryCode = (searchParams.get('country_code') ?? '').trim().toUpperCase()
  const countryName = (searchParams.get('country_name') ?? '').trim()

  const [pins, setPins] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPinId, setSelectedPinId] = useState(null)
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  const [mapBounds, setMapBounds] = useState(null)
  const [mapKey, setMapKey] = useState(0)

  const centeredIcon = (url, { width, height }) => {
    if (!apiLoaded || !window.google?.maps) return url

    const { Size, Point } = window.google.maps

    return {
      url,
      scaledSize: new Size(width, height),
      anchor: new Point(width / 2, height / 2),
    }
  }

  useEffect(() => {
    let ignore = false

    const load = async () => {
      if (!countryCode) {
        if (!ignore) {
          setError('국가 코드가 없어 도장을 불러올 수 없습니다.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const { pins: countryPins } = await getPinsByCountry({ countryCode })
        if (ignore) return

        setPins(countryPins)
        setSelectedPinId(countryPins[0]?.pin_id ?? null)
      } catch (loadError) {
        if (ignore) return

        setPins([])
        setSelectedPinId(null)
        setError(loadError.message)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [countryCode])

  const mapPins = useMemo(
    () =>
      pins
        .filter(({ latitude, longitude }) => latitude != null && longitude != null)
        .sort((a, b) => a.tagged_at.localeCompare(b.tagged_at)),
    [pins],
  )

  useEffect(() => {
    const [first] = mapPins
    if (!first) return

    setMapBounds(getPinBounds(mapPins))
    setMapCenter({ lat: first.latitude, lng: first.longitude })
    setMapZoom(DEFAULT_ZOOM)
    setMapKey((current) => current + 1)
  }, [mapPins])

  const selectedPin = mapPins.find((pin) => pin.pin_id === selectedPinId) ?? null

  return (
    <Page>
      <Header>
        <BackButton type="button" onClick={() => navigate('/', { replace: true })}>
          뒤로
        </BackButton>
        <HeaderTitle>{countryName || countryCode} 핀</HeaderTitle>
      </Header>

      <MapFrame>
        <GoogleMap
          key={mapKey}
          bounds={mapBounds}
          center={mapCenter}
          zoom={mapZoom}
          height="100%"
          borderRadius="0"
          bordered={false}
          mapOptions={{ clickableIcons: false, keyboardShortcuts: false, minZoom: 3 }}
        >
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
        </GoogleMap>
      </MapFrame>

      <BottomPanel>
        {isLoading ? (
          <StateText>불러오는 중...</StateText>
        ) : error ? (
          <StateText role="alert">{error}</StateText>
        ) : pins.length === 0 ? (
          <StateText>이 국가에 저장된 핀이 없습니다.</StateText>
        ) : selectedPin ? (
          <PinInfo>
            <PinTitle>{selectedPin.place_name || '이름 없는 장소'}</PinTitle>
            <PinMeta>{formatTaggedAt(selectedPin.tagged_at)}</PinMeta>
            <PinMeta>사진 {selectedPin.photo_count}</PinMeta>
          </PinInfo>
        ) : (
          <StateText>지도의 핀을 선택해 기록을 확인하세요.</StateText>
        )}
      </BottomPanel>
    </Page>
  )
}

export default CountryStampPins

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

const Header = styled.header`
  position: absolute;
  z-index: 10;
  top: 16px;
  left: 16px;
  right: 16px;
  height: 48px;
  display: flex;
  align-items: center;
  border-radius: 24px;
  background: rgb(245 238 228 / 92%);
  backdrop-filter: blur(4px);
`

const BackButton = styled.button`
  width: 68px;
  height: 100%;
  border: 0;
  background: none;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  cursor: pointer;
`

const HeaderTitle = styled.h1`
  flex: 1;
  margin-right: 68px;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  text-align: center;
`

const MapFrame = styled.div`
  position: absolute;
  inset: 0;
`

const BottomPanel = styled.section`
  position: absolute;
  z-index: 10;
  left: 16px;
  right: 16px;
  bottom: 24px;
  min-height: 88px;
  padding: 16px;
  border-radius: 16px;
  background: rgb(245 238 228 / 95%);
  box-shadow: var(--Effect-Card);
`

const StateText = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
`

const PinInfo = styled.div`
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