import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useMap } from '@vis.gl/react-google-maps'
import Button from '../../components/common/Button'
import GoogleMap from '../../components/common/GoogleMap'
import SnapSheet from '../../components/common/SnapSheet'
import NavBar from '../../components/layout/NavBar'
import {
  geocodeAddress,
  reverseGeocode,
} from '../../features/pins/reverseGeocode'
import crosshairIcon from '../../assets/map/manual-pin-crosshair.svg'
import markerIcon from '../../assets/map/manual-pin-marker.svg'
import searchIcon from '../../assets/map/manual-pin-search.svg'
import recordPlusIcon from '../../assets/map/record-plus.png'
import { normalizeMapPosition } from '../../utils/coordinates'

/* 건물 하나를 찾았을 때 이보다 더 파고들지 않는다. 처음 배율과 같은 값이라
   검색 전후로 보이는 정도가 크게 달라지지 않는다. */
const SEARCH_MAX_ZOOM = 18

/**
 * 찾은 자리로 지도를 옮긴다.
 *
 * `GoogleMap` 은 중심을 `defaultCenter` 로 넘겨 처음 그릴 때만 반영한다.
 * 나중에 옮기려면 지도를 직접 잡아야 해서 자식으로 둔다. 그리는 건 없다.
 *
 * 구글이 준 표시 영역(`viewport`)에 맞추면 나라를 찾으면 나라가, 도시를 찾으면
 * 도시가 화면에 들어온다. 지도 상자는 위로 빼 두었으므로 그만큼 위쪽에 여백을
 * 줘야 찾은 곳이 가려지지 않는다.
 *
 * 자리를 잡은 뒤에는 중심을 직접 읽어 알려 준다. 지도가 알려주기를 기다리면
 * 옮겼는데도 선택 위치가 이전 자리에 머무를 수 있고, 여백을 준 만큼 중심이
 * 밀리기 때문에 찍히는 자리와도 어긋난다.
 */
const PanToSearched = ({ result, fitPadding, onSettled }) => {
  const map = useMap()
  const fitPaddingRef = useRef(fitPadding)

  // 시트를 접고 펼 때에도 마지막 검색 결과를 다시 적용하지 않는다.
  fitPaddingRef.current = fitPadding

  useEffect(() => {
    if (!map || !result) return undefined

    const center = normalizeMapPosition({
      lat: result.latitude,
      lng: result.longitude,
    })

    if (!result.viewport) {
      map.panTo(center)
      onSettled(center)
      return undefined
    }

    map.fitBounds(result.viewport, fitPaddingRef.current)

    /* `fitBounds` 에는 상한이 없다. 자리를 잡은 뒤 한 번만 눌러 준다. */
    const listener = map.addListener('idle', () => {
      if ((map.getZoom() ?? 0) > SEARCH_MAX_ZOOM) map.setZoom(SEARCH_MAX_ZOOM)

      const settled = map.getCenter()
      if (settled) onSettled({ lat: settled.lat(), lng: settled.lng() })

      listener.remove()
    })

    return () => listener.remove()
  }, [map, onSettled, result])

  return null
}

/* 위는 안내 문구(67 에서 시작해 높이 24), 아래는 주소 시트와 하단
   내비게이션(75)이 막는다. 핀을 찍을 자리는 그 사이 한가운데다. */
const HINT_BOTTOM = 67 + 24
const NAV_HEIGHT = 75
const SHEET_HEIGHT = 191
const SHEET_COLLAPSED_OFFSET = 137

/** 찾은 곳이 가장자리에 붙지 않도록 두는 여백 */
const FIT_MARGIN = 24

/**
 * 시트 상태에 따라 달라지는 지도 배치.
 *
 * `shift` — 지도를 위로 빼 놓을 거리. 지도의 중심은 늘 담긴 상자의 한가운데라,
 * 상자를 화면에 딱 맞추면 중심이 시트 쪽으로 내려간다. 위로 늘려 두면 중심이
 * 안내 문구와 시트 사이의 한가운데로 올라오고, 시트를 접어도 아래에 빈자리가
 * 생기지 않는다. 접으면 가리는 만큼이 줄어드니 빼는 거리도 함께 줄인다.
 *
 * `fitPadding` — 검색한 곳을 맞출 때 비켜 둘 자리. `fitBounds` 는 상자 전체를
 * 기준으로 삼는데, 위로 뺀 부분과 아래 시트·내비게이션은 눈에 보이지 않는다.
 * 양쪽을 다 비켜 줘야 보이는 곳의 한가운데, 즉 핀 자리에 맞는다.
 */
const getMapLayout = (isSheetCollapsed) => {
  const sheetVisible = isSheetCollapsed
    ? SHEET_HEIGHT - SHEET_COLLAPSED_OFFSET
    : SHEET_HEIGHT

  const shift = NAV_HEIGHT + sheetVisible - HINT_BOTTOM

  return {
    shift,
    fitPadding: {
      top: shift + HINT_BOTTOM + FIT_MARGIN,
      right: FIT_MARGIN,
      bottom: NAV_HEIGHT + sheetVisible + FIT_MARGIN,
      left: FIT_MARGIN,
    },
  }
}

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
  const [searchedResult, setSearchedResult] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false)

  useEffect(() => {
    let ignore = false

    const startFrom = (center) => {
      if (ignore) return

      const normalizedCenter = normalizeMapPosition(center)
      setInitialCenter(normalizedCenter)
      setSelectedCenter(normalizedCenter)
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
    // 이전 좌표의 주소를 계속 보여 주면 핀이 옮겨졌는데도 검색 주소에
    // 고정된 것처럼 보인다. 새 좌표의 조회가 끝날 때까지는 확인 상태로 둔다.
    setPlace(null)
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

    setSelectedCenter(normalizeMapPosition(center))
  }

  // 검색한 위치에서 직접 지도를 옮기면, 입력칸도 새 위치를 찾는 상태로 비운다.
  const handleMapDragStart = () => {
    setSearchedResult(null)
    setAddress('')
    setSearchError('')
  }

  /* 입력한 주소를 좌표로 바꿔 지도를 옮긴다. 핀은 늘 지도 중심이라 따라온다. */
  const handleSearch = async (event) => {
    event.preventDefault()

    const keyword = address.trim()
    if (!keyword || isSearching) return

    setIsSearching(true)
    setSearchError('')

    const found = await geocodeAddress(keyword)

    setIsSearching(false)

    if (!found) {
      setSearchError('그 주소를 찾지 못했어요')
      return
    }

    // 매번 새 객체를 넘겨야 같은 자리를 다시 검색해도 지도가 반응한다.
    setSearchedResult({ ...found })
    setAddress(found.address)
  }

  const handleContinue = () => {
    if (!selectedCenter) return

    navigate('/map/pin/new/details', {
      state: {
        latitude: selectedCenter.lat,
        longitude: selectedCenter.lng,
        address: place?.address ?? address.trim(),
        // 여기서 이미 받아둔 값을 넘겨 다음 화면이 다시 묻지 않게 한다.
        place,
      },
    })
  }

  /*
   * 검색 결과를 지도에 맞추는 효과는 `fitPadding`을 의존성으로 가진다.
   * 렌더마다 새 레이아웃 객체를 만들면 지도를 드래그할 때마다 효과가 다시
   * 실행되어 검색한 주소로 되돌아간다. 시트 상태가 바뀔 때만 새 값을 만든다.
   */
  const { shift: mapShift, fitPadding } = useMemo(
    () => getMapLayout(isSheetCollapsed),
    [isSheetCollapsed],
  )

  return (
    <Page>
      <MapLayer $shift={mapShift}>
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
              onDragstart: handleMapDragStart,
            }}
          >
            <PanToSearched
              result={searchedResult}
              fitPadding={fitPadding}
              onSettled={setSelectedCenter}
            />
          </GoogleMap>
        )}
      </MapLayer>

      <SearchBar onSubmit={handleSearch}>
        <SearchBarInner>
          <SearchButton type="submit" aria-label="주소 검색" disabled={isSearching}>
            <img src={searchIcon} alt="" />
          </SearchButton>
          <SearchInput
            type="search"
            value={address}
            onChange={(event) => {
              setAddress(event.target.value)
              setSearchError('')
            }}
            aria-label="주소 검색"
            placeholder="주소를 입력하고 검색하세요"
            enterKeyHint="search"
          />
        </SearchBarInner>
      </SearchBar>

      <CancelButton
        type="button"
        aria-label="핀 추가 취소"
        onClick={() =>
          navigate('/map', { replace: true, viewTransition: true })
        }
      >
        <img src={recordPlusIcon} alt="" />
      </CancelButton>

      <Hint>
        {searchError ||
          (isSearching && '주소를 찾는 중...') ||
          (selectedCenter
            ? '지도를 움직여 위치를 맞춰주세요'
            : '현재 위치를 찾는 중...')}
      </Hint>

      <CenterMarker $shift={mapShift} aria-hidden="true">
        <MarkerIcon src={markerIcon} alt="" />
        <CrosshairIcon src={crosshairIcon} alt="" />
      </CenterMarker>

      <AddressSheet
        ariaLabel="선택한 위치"
        collapsedOffset={SHEET_COLLAPSED_OFFSET}
        height={SHEET_HEIGHT}
        onCollapsedChange={setIsSheetCollapsed}
      >
        <LocationLabel>선택한 위치</LocationLabel>
        <LocationTitle>
          {place?.address ||
            (isResolvingPlace ? '주소를 확인하는 중이에요' : '지도에서 선택한 위치')}
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
  top: ${({ $shift }) => `${-$shift}px`};
  right: 0;
  bottom: 0;
  left: 0;
  /* 시트를 접고 펼 때 지도와 표시가 같이 미끄러지듯 따라간다. */
  transition: top 240ms ease;
`

/* 지도 화면의 핀 추가 버튼과 같은 자리·크기다. */
const CANCEL_BUTTON_SIZE = 40
const CANCEL_BUTTON_INSET = 13
const CANCEL_BUTTON_TOP = 19

/* 지도 화면의 여정 선택 드롭바와 같은 자리·높이에 선다.
   두 화면을 오갈 때 같은 줄에 있어야 흔들리지 않는다. */
const SearchBar = styled.form`
  position: absolute;
  z-index: 4;
  /* 지도 화면의 여정 선택 드롭바와 이어지는 이름이다. */
  view-transition-name: map-top-bar;
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
  /* 지도 화면의 핀 추가 버튼과 이어지는 이름이다. */
  view-transition-name: map-top-action;
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
    view-transition-name: map-top-action-icon;
    width: 30px;
    height: 30px;
    display: block;
    object-fit: contain;
    transform: rotate(45deg);
  }
`

/* 알약은 폭이 줄고 늘지만 안의 내용은 그대로여야 한다. 지도 화면의 드롭바
   내용과 다른 이름을 붙여, 겹쳐 늘어나지 않고 흐려지며 바뀌게 한다. */
const SearchBarInner = styled.span`
  view-transition-name: map-top-bar-search;
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
`

/* 아이콘을 눌러도 검색되게 버튼으로 둔다. 모습은 그림 그대로다. */
const SearchButton = styled.button`
  flex: 0 0 auto;
  padding: 0;
  display: flex;
  align-items: center;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 18px;
    height: 18px;
    display: block;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
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

/* 십자 표시의 아래 끝이 지도의 중심에 닿아야 한다. 지도를 위로 뺀 만큼
   같이 올린다. 65 는 그림 안에서 십자까지의 거리다. */
const CenterMarker = styled.div`
  position: absolute;
  z-index: 3;
  top: ${({ $shift }) => `calc(50% - ${$shift / 2 + 65}px)`};
  transition: top 240ms ease;
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
