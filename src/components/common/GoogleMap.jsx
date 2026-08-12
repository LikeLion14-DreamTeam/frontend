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

const GoogleMap = ({
  markers = [],
  center,
  zoom = 12,
  height = '470px',
  children,
}) => {
  if (!HAS_API_KEY) {
    return <MapFallback $height={height}>지도 Placeholder</MapFallback>
  }

  // 중심을 지정하지 않으면 마커가 모두 보이도록 영역을 잡는다.
  const viewProps =
    !center && markers.length > 0
      ? { defaultBounds: getBounds(markers) }
      : { defaultCenter: center || DEFAULT_CENTER, defaultZoom: zoom }

  return (
    <MapFrame $height={height}>
      <Map
        mapId={MAP_ID}
        gestureHandling="greedy"
        disableDefaultUI
        style={{ width: '100%', height: '100%' }}
        {...viewProps}
      >
        {markers.map(({ name, lat, lng }) => (
          <AdvancedMarker key={name} position={{ lat, lng }} title={name}>
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
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`

const MapFallback = styled.div`
  width: 100%;
  height: ${({ $height }) => $height};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d8dde3;
  border-radius: 4px;
  background: #fbfcfd;
  color: #c3c8cf;
  font-size: 12px;
`
