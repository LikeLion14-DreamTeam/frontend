import React, { useEffect } from 'react'
import styled from 'styled-components'
import { Map, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import mapPinIcon from '../../assets/map/map-pin.svg'
import MapOverlay from './MapOverlay'
import { MAP_STYLES } from './mapStyles'
import { normalizeLongitude } from '../../utils/coordinates'

// 클라우드 스타일을 쓸 때만 필요하다. 콘솔에서 발급받기 전까진 구글 제공 데모 ID 사용.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
const HAS_API_KEY = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

/*
 * 세계 밖은 보여주지 않는다.
 *
 * 그대로 두면 위아래로 벗어날 때 극지 너머의 빈 회색이 드러나고, 옆으로는
 * 같은 세계가 반복해 이어진다. 85도는 메르카토르에서 그릴 수 있는 끝이다.
 *
 * `strictBounds` 는 이 영역이 늘 화면을 덮도록 축소까지 막는다. 최소 배율을
 * 숫자로 정하지 않아도 화면 크기에 맞는 하한이 저절로 정해지고, 멀리 떨어진
 * 핀도 영역에 맞출 수 있다.
 */
const WORLD_RESTRICTION = {
  latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
  strictBounds: true,
}

/**
 * 한 지점을 들여다보는 배율.
 *
 * 영역에 맞출 때의 상한이자, 핀 하나를 골랐을 때 당기는 단계다. 두 값이 같아야
 * 개요에서 핀을 골라도 배율이 튀지 않는다. 길과 골목이 드러나는 단계라
 * 주요 지도 앱들이 장소를 고를 때 잡는 정도와 비슷하다.
 *
 * 영역 맞춤에 상한이 필요한 이유는, 핀이 한 골목에 몰려 있으면 딱 맞추느라
 * 건물 단위까지 파고들어 첫 화면에서 여기가 어디인지 알 수 없기 때문이다.
 */
export const FOCUS_ZOOM = 17

/**
 * 영역 맞춤이 너무 깊게 파고들지 않도록 첫 배치에서 한 번만 배율을 눌러 준다.
 *
 * `fitBounds` 에는 상한 옵션이 없어서, 지도가 자리를 잡은 뒤(idle) 확인한다.
 * 이후 사용자가 직접 확대하는 것까지 막으면 안 되므로 한 번 보고 손을 뗀다.
 */
const FitZoomLimit = ({ maxZoom }) => {
  const map = useMap()

  useEffect(() => {
    if (!map) return undefined

    const listener = map.addListener('idle', () => {
      if ((map.getZoom() ?? 0) > maxZoom) map.setZoom(maxZoom)
      listener.remove()
    })

    return () => listener.remove()
  }, [map, maxZoom])

  return null
}

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
  const lngs = markers.map(({ lng }) => normalizeLongitude(lng))

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
 * - `maxFitZoom` — 영역에 맞출 때의 배율 상한. 핀이 몰려 있어도 이보다 깊이
 *   들어가지 않는다. 사용자가 직접 확대하는 것은 막지 않는다.
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
  maxFitZoom = FOCUS_ZOOM,
  borderRadius = '4px',
  bordered = true,
  mapOptions = {},
  showSequenceNumbers = false,
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
  // 기존 서버 데이터에도 한 바퀴를 넘는 경도가 남아 있을 수 있다.
  const normalizedMarkers = markers.map((marker) => ({
    ...marker,
    lng: normalizeLongitude(marker.lng),
  }))
  const normalizedCenter = center
    ? { ...center, lng: normalizeLongitude(center.lng) }
    : undefined
  const [firstMarker] = normalizedMarkers
  const fitBounds =
    bounds ??
    (!normalizedCenter && firstMarker ? getBounds(normalizedMarkers) : null)

  /* 마커가 하나뿐이면 영역을 못 잡는다. 그 마커를 가운데 두고 `zoom` 을 쓴다.
     기본 좌표로 두면 엉뚱하게 서울이 뜬다. */
  const fallbackCenter =
    normalizedCenter ??
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
        restriction={WORLD_RESTRICTION}
        styles={styles}
        style={{ width: '100%', height: '100%' }}
        {...viewProps}
        {...mapOptions}
      >
        {/* 영역에 맞출 때만 걸린다. 중심·배율을 직접 준 경우는 그대로 둔다. */}
        {fitBounds && <FitZoomLimit maxZoom={maxFitZoom} />}

        {/* AdvancedMarker 는 Map ID 를 요구해 테마와 같이 못 쓴다. */}
        {showSequenceNumbers
          ? normalizedMarkers.map(({ id, name, lat, lng }, index) => (
              <MapOverlay
                key={id ?? `${name}-${lat}-${lng}-${index}`}
                latitude={lat}
                longitude={lng}
                interactive={false}
                zIndex={100 + index}
              >
                <SequencePin aria-label={`${index + 1}번 핀: ${name}`}>
                  {index + 1}
                </SequencePin>
              </MapOverlay>
            ))
          : normalizedMarkers.map(({ id, name, lat, lng }, index) => (
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

const SequencePin = styled.span`
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 2px solid var(--Background-Base);
  border-radius: 50%;
  background: var(--Map-Pin-Inactive);
  box-shadow: var(--Effect-Marker);
  color: var(--Text-Inverse);
  font: var(--text-ui-button);
  transform: translate(-50%, -50%);
`
