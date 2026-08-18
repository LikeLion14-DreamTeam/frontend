import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import GoogleMap from '../../components/common/GoogleMap'
import SnapSheet from '../../components/common/SnapSheet'
import NavBar from '../../components/layout/NavBar'
import { reverseGeocode } from '../../features/pins/reverseGeocode'
import crosshairIcon from '../../assets/map/manual-pin-crosshair.svg'
import markerIcon from '../../assets/map/manual-pin-marker.svg'
import searchIcon from '../../assets/map/manual-pin-search.svg'
import recordPlusIcon from '../../assets/map/record-plus.png'

/** 위치를 못 얻었을 때 시작 지점. 여기서 직접 옮겨 찍으면 된다. */
const FALLBACK_CENTER = { lat: 37.5796, lng: 126.9849 }

/**
 * 지도가 이만큼 멈춰 있어야 주소를 물어본다.
 *
 * 중심이 바뀔 때마다 부르면 드래그 한 번에 수십 번씩 요청이 나간다.
 */
const ADDRESS_DEBOUNCE_MS = 600

/** 주소 아래 줄. 도시·나라를 못 받았으면 좌표라도 보여준다. */
const formatPlaceMeta = ({ place, center, isResolving }) => {
  const region = place
    ? [place.city, place.countryName].filter(Boolean).join(' · ')
    : ''

  if (region) return region
  if (!center) return '위치를 확인하는 중이에요'
  if (isResolving) return '주소를 확인하는 중이에요'

  return `위도 ${center.lat.toFixed(5)} · 경도 ${center.lng.toFixed(5)}`
}

const ManualPinAdd = () => {
  const navigate = useNavigate()
  /**
   * 지도를 처음 그릴 중심. 현재 위치를 받은 뒤에야 정해진다.
   *
   * `GoogleMap` 은 중심을 `defaultCenter` 로 넘겨서 처음 그릴 때 한 번만 반영된다.
   * 먼저 띄워 두고 나중에 바꾸면 지도가 따라오지 않아, 받아 온 다음에 그린다.
   */
  const [initialCenter, setInitialCenter] = useState(null)
  const [selectedCenter, setSelectedCenter] = useState(null)
  const [place, setPlace] = useState(null)
  const [isResolvingPlace, setIsResolvingPlace] = useState(false)
  const [address, setAddress] = useState('')

  useEffect(() => {
    let ignore = false

    const startFrom = (center) => {
      if (ignore) return

      setInitialCenter(center)
      setSelectedCenter(center)
    }

    if (!navigator.geolocation) {
      startFrom(FALLBACK_CENTER)
      return undefined
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        startFrom({ lat: coords.latitude, lng: coords.longitude }),
      // 권한을 거부하거나 시간이 지나도 핀은 찍을 수 있어야 한다.
      () => startFrom(FALLBACK_CENTER),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )

    return () => {
      ignore = true
    }
  }, [])

  // 지도를 멈춘 곳의 주소를 물어본다. 움직이는 동안에는 예약만 계속 미뤄진다.
  useEffect(() => {
    if (!selectedCenter) return undefined

    let ignore = false
    setIsResolvingPlace(true)

    const timer = setTimeout(() => {
      void reverseGeocode({
        latitude: selectedCenter.lat,
        longitude: selectedCenter.lng,
      }).then((resolved) => {
        if (ignore) return

        setPlace(resolved)
        setIsResolvingPlace(false)
      })
    }, ADDRESS_DEBOUNCE_MS)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [selectedCenter])

  const handleCenterChanged = (event) => {
    const center = event.detail?.center
    if (!center) return

    setSelectedCenter({ lat: center.lat, lng: center.lng })
  }

  const handleContinue = () => {
    if (!selectedCenter) return

    navigate('/map/pin/new/details', {
      state: {
        latitude: selectedCenter.lat,
        longitude: selectedCenter.lng,
        address: address.trim(),
        // 여기서 이미 받아둔 값을 넘겨 다음 화면이 다시 묻지 않게 한다.
        place,
      },
    })
  }

  return (
    <Page>
      <MapLayer>
        {initialCenter && (
          /*
           * 지도를 움직여 위치를 직접 맞추는 화면이라 건물이 구분되는 단계까지
           * 당긴다. 위치 지정 UI 를 쓰는 앱들이 잡는 정도다.
           */
          <GoogleMap
            center={initialCenter}
            zoom={18}
            height="100%"
            borderRadius="0"
            bordered={false}
            mapOptions={{
              clickableIcons: false,
              gestureHandling: 'greedy',
              keyboardShortcuts: false,
              onCenterChanged: handleCenterChanged,
            }}
          />
        )}
      </MapLayer>

      <SearchBar>
        <SearchIcon src={searchIcon} alt="" aria-hidden="true" />
        <SearchInput
          type="search"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          aria-label="선택 위치의 주소"
          placeholder="주소 입력 (선택)"
        />
      </SearchBar>

      <CancelButton
        type="button"
        aria-label="핀 추가 취소"
        onClick={() => navigate('/map', { replace: true })}
      >
        <img src={recordPlusIcon} alt="" />
      </CancelButton>

      <Hint>
        {selectedCenter
          ? '지도를 움직여 위치를 맞춰주세요'
          : '현재 위치를 찾는 중...'}
      </Hint>

      <CenterMarker aria-hidden="true">
        <MarkerIcon src={markerIcon} alt="" />
        <CrosshairIcon src={crosshairIcon} alt="" />
      </CenterMarker>

      <AddressSheet
        ariaLabel="선택한 위치"
        collapsedOffset={137}
        height={191}
      >
        <LocationLabel>선택한 위치</LocationLabel>
        <LocationTitle>
          {address.trim() || place?.address || '지도에서 선택한 위치'}
        </LocationTitle>
        <LocationMeta>
          {formatPlaceMeta({
            place,
            center: selectedCenter,
            isResolving: isResolvingPlace,
          })}
        </LocationMeta>
        <ContinueButton
          type="button"
          onClick={handleContinue}
          disabled={!selectedCenter}
        >
          이 위치로 계속
        </ContinueButton>
      </AddressSheet>

      <NavBar activeOverride="map" />
    </Page>
  )
}

export default ManualPinAdd

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

/* 지도 화면의 핀 추가 버튼과 같은 자리·크기다. */
const CANCEL_BUTTON_SIZE = 40
const CANCEL_BUTTON_INSET = 13
const CANCEL_BUTTON_TOP = 19

/* 지도 화면의 여정 선택 드롭바와 같은 자리·높이에 선다.
   두 화면을 오갈 때 같은 줄에 있어야 흔들리지 않는다. */
const SearchBar = styled.div`
  position: absolute;
  z-index: 4;
  top: ${CANCEL_BUTTON_TOP}px;
  /* 오른쪽은 취소 버튼 자리를 비우고, 버튼과의 사이도 바깥 여백만큼 띄운다. */
  right: ${CANCEL_BUTTON_INSET * 2 + CANCEL_BUTTON_SIZE}px;
  left: ${CANCEL_BUTTON_INSET}px;
  height: 40px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  border-radius: 20px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Card);
`

/* 지도 화면의 핀 추가 버튼과 같은 모습이다. 가운데 표시만 + 대신 X 다. */
const CancelButton = styled.button`
  position: absolute;
  z-index: 4;
  top: ${CANCEL_BUTTON_TOP}px;
  right: ${CANCEL_BUTTON_INSET}px;
  width: ${CANCEL_BUTTON_SIZE}px;
  height: ${CANCEL_BUTTON_SIZE}px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: var(--Primary-Cognac);
  box-shadow: var(--Effect-CTA);
  cursor: pointer;

  /* 핀 추가 버튼의 + 를 그대로 돌려 쓴다. 굵기와 끝 모양이 저절로 같다. */
  img {
    width: 30px;
    height: 30px;
    display: block;
    object-fit: contain;
    transform: rotate(45deg);
  }
`

const SearchIcon = styled.img`
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
`

const SearchInput = styled.input`
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--State-Disabled-Text);
  font: var(--text-ui-label);

  &::placeholder {
    color: var(--State-Disabled-Text);
    opacity: 1;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
`

/* 주소 입력칸(19 + 40) 아래 8px 에 붙는다. 칸이 줄어든 만큼 글자도 줄인다. */
const Hint = styled.p`
  position: absolute;
  z-index: 4;
  top: 67px;
  left: 50%;
  padding: 5px 10px;
  border-radius: 12px;
  background: rgb(36 28 22 / 68%);
  color: var(--Text-Inverse);
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 500;
  line-height: 14px;
  white-space: nowrap;
  transform: translateX(-50%);
`

const CenterMarker = styled.div`
  position: absolute;
  z-index: 3;
  top: calc(50% - 65px);
  left: 50%;
  width: 54px;
  height: 66px;
  transform: translateX(-50%);
  pointer-events: none;
`

const MarkerIcon = styled.img`
  position: absolute;
  inset: 0;
  width: 54px;
  height: 66px;
`

const CrosshairIcon = styled.img`
  position: absolute;
  top: 54px;
  left: 50%;
  width: 16px;
  height: 11px;
  transform: translateX(-50%);
`

const AddressSheet = styled(SnapSheet)`
  z-index: 8;
  bottom: 75px;
  border-radius: 22px 22px 0 0;
  background: var(--Surface-Base);
`

const LocationLabel = styled.p`
  position: absolute;
  top: 32px;
  left: 24px;
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

/* 주소는 길이가 제각각이라 시트 폭에 맞춰 자른다. */
const LocationTitle = styled.h1`
  position: absolute;
  top: 52px;
  right: 24px;
  left: 24px;
  overflow: hidden;
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const LocationMeta = styled.p`
  position: absolute;
  top: 81px;
  right: 24px;
  left: 24px;
  overflow: hidden;
  color: var(--Text-Secondary);
  font: var(--text-ui-label);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ContinueButton = styled(Button)`
  position: absolute;
  top: 118px;
  right: 24px;
  left: 24px;
  width: auto;
  height: 54px;
  color: var(--Text-Inverse);
  background: var(--Primary-Cognac);
  font: var(--text-ui-button);
`
