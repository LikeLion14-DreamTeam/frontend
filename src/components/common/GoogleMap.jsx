import React from 'react'
import styled from 'styled-components'
import { Map, Marker, useMapsLibrary } from '@vis.gl/react-google-maps'
import mapPinIcon from '../../assets/map/map-pin.svg'
import { MAP_STYLES } from './mapStyles'

// 클라우드 스타일을 쓸 때만 필요하다. 콘솔에서 발급받기 전까진 구글 제공 데모 ID 사용.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
const HAS_API_KEY = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

/* 마커가 화면 가장자리에 붙지 않도록 두는 여백. 위경도가 아니라 화면 픽셀이다.
   위경도로 주면 도 단위라 도시 하나짜리 여정도 나라 단위로 벌어진다. */
const BOUNDS_PADDING = 32
const PIN_SIZE = { width: 38, height: 38 }

/**
 * 핀 그림 한가운데를 좌표에 맞춘다.
 *
 * 물방울이 아니라 원형이라 기본값(아래 끝 기준)으로 두면 실제 위치보다
 * 아래에 찍힌다.
 *
 * @param core `Size` 와 `Point` 가 든 core 라이브러리. 아직 없으면 null
 */
const getPinIcon = (core) => {
  if (!core) return mapPinIcon

  return {
    url: mapPinIcon,
    scaledSize: new core.Size(PIN_SIZE.width, PIN_SIZE.height),
    anchor: new core.Point(PIN_SIZE.width / 2, PIN_SIZE.height / 2),
  }
}

/**
 * 마커가 모두 보이는 영역.
 *
 * 마커가 하나거나 전부 같은 자리면 영역이 점이 돼 최대 배율로 붙어버린다.
 * 그때는 null 을 돌려주고 중심·배율 방식으로 넘긴다.
 */
const getBounds = (markers) => {
  const lats = markers.map(({ lat }) => lat)
  const lngs = markers.map(({ lng }) => lng)

  const north = Math.max(...lats)
  const south = Math.min(...lats)
  const east = Math.max(...lngs)
  const west = Math.min(...lngs)

  if (north === south && east === west) return null

  return { north, south, east, west, padding: BOUNDS_PADDING }
}

/**
 * 공용 구글 지도. SDK 로더(`APIProvider`)는 `main.jsx` 에 이미 있으므로 여기서 감싸지 않는다.
 *
 *   // 마커가 전부 보이도록 영역 자동 계산
 *   <GoogleMap markers={[{ name: '도쿄', lat: 35.6812, lng: 139.7671 }]} />
 *
 *   // 중심·배율을 직접 지정
 *   <GoogleMap center={{ lat: 35.6812, lng: 139.7671 }} zoom={14} height="300px" />
 *
 * - `markers` — `{ name, lat, lng }` 배열. `name` 은 key와 마커 툴팁에 쓰인다.
 * - `center` — 주면 `zoom` 과 함께 쓰이고, 안 주면 `markers` 로 영역을 계산한다.
 * - `bounds` — `{ north, south, east, west, padding }`. 주면 이 영역이 다 보이게
 *   배율을 맞춘다. `center`·`zoom` 보다 우선한다. 마커를 children 으로 직접
 *   그리는 화면에서 쓴다.
 * - `children` — `<Map>` 내부에 그대로 들어간다(폴리라인 등 추가할 때).
 * - `styles` — 앱 지도 테마가 기본값이다. 구글 클라우드 스타일을 쓰려면 `null`.
 * - `.env` 에 API 키가 없으면 Placeholder 박스를 렌더한다.
 */
const GoogleMap = ({
  markers = [],
  center,
  bounds,
  zoom = 12,
  height = '470px',
  styles = MAP_STYLES,
  borderRadius = '4px',
  bordered = true,
  mapOptions = {},
  children,
}) => {
  /*
   * `Size` 와 `Point` 가 든 core 라이브러리. 최신 로더는 라이브러리를 나눠서
   * 불러오기 때문에, `window.google.maps` 가 생겼다고 이 둘이 있는 건 아니다.
   * 다 실리면 null 에서 바뀌며 다시 그려진다.
   */
  const core = useMapsLibrary('core')

  if (!HAS_API_KEY) {
    return (
      <MapFallback
        $height={height}
        $borderRadius={borderRadius}
        $bordered={bordered}
      >
        지도 Placeholder
      </MapFallback>
    )
  }

  /*
   * 영역을 직접 받으면 그대로 쓰고, 없으면 마커로 계산한다.
   * 둘 다 없을 때만 중심과 배율로 잡는다.
   */
  const [firstMarker] = markers
  const fitBounds =
    bounds ?? (!center && firstMarker ? getBounds(markers) : null)

  /* 마커가 하나뿐이면 영역을 못 잡는다. 그 마커를 가운데 두고 `zoom` 을 쓴다.
     기본 좌표로 두면 엉뚱하게 서울이 뜬다. */
  const fallbackCenter =
    center ??
    (firstMarker
      ? { lat: firstMarker.lat, lng: firstMarker.lng }
      : DEFAULT_CENTER)

  const viewProps = fitBounds
    ? { defaultBounds: fitBounds }
    : { defaultCenter: fallbackCenter, defaultZoom: zoom }

  return (
    <MapFrame
      $height={height}
      $borderRadius={borderRadius}
      $bordered={bordered}
    >
      <Map
        mapId={styles ? undefined : MAP_ID}
        gestureHandling="greedy"
        disableDefaultUI
        /*
         * 테마(styles)를 쓰면 래스터 지도라 소수점 배율이 기본으로 꺼져 있다.
         * 그대로 두면 zoom 값이 정수로 반올림되고, bounds 를 맞출 때도 정수
         * 단계로 떨어져 여백이 필요 이상으로 남는다.
         */
        isFractionalZoomEnabled
        styles={styles}
        style={{ width: '100%', height: '100%' }}
        {...viewProps}
        {...mapOptions}
      >
        {/* AdvancedMarker 는 Map ID 를 요구해 테마와 같이 못 쓴다. */}
        {markers.map(({ id, name, lat, lng }, index) => (
          <Marker
            key={id ?? `${name}-${lat}-${lng}-${index}`}
            position={{ lat, lng }}
            icon={getPinIcon(core)}
            title={name}
          />
        ))}
        {children}
      </Map>
    </MapFrame>
  )
}

export default GoogleMap

const MapFrame = styled.div`
  width: 100%;
  height: ${({ $height }) => $height};
  border: ${({ $bordered }) => ($bordered ? '1px solid #e5e7eb' : '0')};
  border-radius: ${({ $borderRadius }) => $borderRadius};
  overflow: hidden;
`

const MapFallback = styled.div`
  width: 100%;
  height: ${({ $height }) => $height};
  display: flex;
  align-items: center;
  justify-content: center;
  border: ${({ $bordered }) =>
    $bordered ? '1px dashed var(--Border-Default)' : '0'};
  border-radius: ${({ $borderRadius }) => $borderRadius};
  background: var(--Map-Base);
  color: var(--Text-Secondary);
  font-size: 12px;
`
