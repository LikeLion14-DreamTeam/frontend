import React from 'react'
import styled from 'styled-components'
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'

// AdvancedMarker는 Map ID가 있어야 동작한다. 콘솔에서 발급받기 전까진 구글 제공 데모 ID 사용.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
const HAS_API_KEY = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const BOUNDS_PADDING = 0.6

const getBounds = (markers) => {
  const lats = markers.map(({ lat }) => lat)
  const lngs = markers.map(({ lng }) => lng)

  return {
    north: Math.max(...lats) + BOUNDS_PADDING,
    south: Math.min(...lats) - BOUNDS_PADDING,
    east: Math.max(...lngs) + BOUNDS_PADDING,
    west: Math.min(...lngs) - BOUNDS_PADDING,
  }
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
 * - `children` — `<Map>` 내부에 그대로 들어간다(폴리라인 등 추가할 때).
 * - `.env` 에 API 키가 없으면 Placeholder 박스를 렌더한다.
 */
const GoogleMap = ({
  markers = [],
  center,
  zoom = 12,
  height = '470px',
  styles,
  borderRadius = '4px',
  bordered = true,
  mapOptions = {},
  children,
}) => {
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

  // 중심을 지정하지 않으면 마커가 모두 보이도록 영역을 잡는다.
  const viewProps =
    !center && markers.length > 0
      ? { defaultBounds: getBounds(markers) }
      : { defaultCenter: center || DEFAULT_CENTER, defaultZoom: zoom }

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
        styles={styles}
        style={{ width: '100%', height: '100%' }}
        {...viewProps}
        {...mapOptions}
      >
        {markers.map(({ id, name, lat, lng }, index) => (
          <AdvancedMarker
            key={id ?? `${name}-${lat}-${lng}-${index}`}
            position={{ lat, lng }}
            title={name}
          >
            <Pin background="#111827" borderColor="#111827" glyphColor="#fff" />
          </AdvancedMarker>
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
