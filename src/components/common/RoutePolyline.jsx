import { useEffect, useState } from 'react'
import { Polyline, useMap } from '@vis.gl/react-google-maps'

const ROUTE_COLOR = '#c99a45'

/*
 * 꺾쇠 모양. 위(-y)가 진행 방향이고, 선의 기울기에 맞춰 저절로 돌아간다.
 *
 * 구글이 주는 기본 화살표(`SymbolPath.FORWARD_CLOSED_ARROW`)는 뾰족한 끝이
 * 기준점이라 `offset: '50%'` 을 줘도 끝만 가운데에 닿고 몸통은 뒤로 처진다.
 * 기준점이 한가운데가 되도록 직접 그려, 꺾쇠 중앙이 선 가운데에 오게 한다.
 * 좌표는 그대로 픽셀이다.
 *
 * 삼각형과 달리 닫지(`Z`) 않는다. 두 획만 남아 선의 일부처럼 읽힌다.
 */
// 일반 구간은 기존 크기를 유지하고, 가까운 핀 사이에서만 아래 scale을 적용한다.
const ARROW_LENGTH = 6
const ARROW_WIDTH = 6
const ARROW_PATH = [
  `M ${-ARROW_WIDTH / 2} ${ARROW_LENGTH / 2}`,
  `L 0 ${-ARROW_LENGTH / 2}`,
  `L ${ARROW_WIDTH / 2} ${ARROW_LENGTH / 2}`,
].join(' ')

/* 핀 중심 사이가 이보다 좁게 보일 때만 화살표를 함께 줄인다. */
const SHORT_LEG_MAX_PX = 72
const MIN_SHORT_LEG_ARROW_SCALE = 0.4

/* `fromLatLngToPoint` 는 확대 전 세계 좌표(256px 기준)를 돌려준다. */
const getLegScreenDistance = ([from, to], view) => {
  if (!view?.projection || view.zoom == null) return Infinity

  const fromPoint = view.projection.fromLatLngToPoint(from)
  const toPoint = view.projection.fromLatLngToPoint(to)
  if (!fromPoint || !toPoint) return Infinity

  // 점 좌표 자체가 확대 전 256px 기준이므로, 줌에 따른 배율만 곱한다.
  const worldSize = 2 ** view.zoom
  // 날짜 변경선 양쪽도 실제로 가까운 거리로 재야 한다.
  const xDistance = Math.min(
    Math.abs(toPoint.x - fromPoint.x),
    1 - Math.abs(toPoint.x - fromPoint.x),
  ) * worldSize
  const yDistance = Math.abs(toPoint.y - fromPoint.y) * worldSize

  return Math.hypot(xDistance, yDistance)
}

const getShortLegArrowScale = (screenDistance) =>
  screenDistance >= SHORT_LEG_MAX_PX
    ? 1
    : Math.max(MIN_SHORT_LEG_ARROW_SCALE, screenDistance / SHORT_LEG_MAX_PX)

/* 충분히 먼 구간은 고정 크기다. 현재 화면에서 가까워 보이는 구간만 골라
   축소하려고 확대·축소가 끝날 때 화면 거리만 다시 잰다. */
const useMapView = () => {
  const map = useMap()
  const [view, setView] = useState(null)

  useEffect(() => {
    if (!map) return undefined

    const syncView = () => {
      const projection = map.getProjection()
      const zoom = map.getZoom()
      if (projection && zoom != null) setView({ projection, zoom })
    }

    syncView()
    const idleListener = map.addListener('idle', syncView)

    return () => idleListener.remove()
  }, [map])

  return view
}

/* 핀에서 핀으로 가는 구간들. 화살표를 구간마다 하나씩 놓는다. */
const getLegs = (path) =>
  path.slice(0, -1).map((from, index) => [from, path[index + 1]])

const toRadian = (degree) => (degree * Math.PI) / 180

/* 메르카토르에서의 세로 좌표. 북쪽으로 갈수록 커진다. */
const mercatorY = (lat) => Math.log(Math.tan(Math.PI / 4 + toRadian(lat) / 2))

/**
 * 두 지점 사이 경도 차이를 짧은 쪽으로 접는다(-180 ~ 180).
 *
 * 지도는 두 점을 이을 때 짧은 쪽으로 긋는다. 미국(-122)에서 한국(127)이면
 * 태평양을 건너 서쪽으로 111 만 가면 되는데, 그냥 빼면 +249 가 나와 지구를
 * 거의 한 바퀴 도는 동쪽으로 읽힌다. 그러면 선은 왼쪽으로 가는데 화살표만
 * 오른쪽을 가리킨다. 차이가 180 을 넘는 구간에서만 생기는 일이다.
 */
const getLongitudeDelta = (from, to) => ((to - from + 540) % 360) - 180

/**
 * 화면에서 보이는 구간의 기울기(도, 시계 방향).
 *
 * 지도는 메르카토르라 위도가 높을수록 세로가 늘어난다. 위경도 차이를 그대로
 * 각도로 쓰면 그만큼 어긋나므로, 투영한 좌표로 재야 선과 정확히 맞는다.
 *
 * 화살표는 위(-y)를 보고 있고 화면의 y 는 북쪽이 작다. 정북이면 0, 정동이면 90 이다.
 */
const getBearing = ([from, to]) =>
  (Math.atan2(
    toRadian(getLongitudeDelta(from.lng, to.lng)),
    mercatorY(to.lat) - mercatorY(from.lat),
  ) *
    180) /
  Math.PI

/* 구글이 알아서 돌려 주는 각도에 맡기지 않고(`fixedRotation`) 직접 계산해 넣는다. */
const buildDirectionArrow = (leg, scale) => [
  {
    icon: {
      path: ARROW_PATH,
      /* 열린 모양이라 채우면 두 획 사이가 메워진다. 선으로만 그린다.
         굵기는 동선과 같게 둔다. 구글의 심볼은 끝 모양·이음매를 고를 수 없어
         기본값(각진 끝, 뾰족한 이음매)으로 그려진다. */
      strokeColor: ROUTE_COLOR,
      strokeOpacity: 1,
      strokeWeight: 3 * scale,
      fillOpacity: 0,
      rotation: getBearing(leg),
      scale,
    },
    fixedRotation: true,
    // `repeat` 을 주지 않으면 이 자리에 하나만 놓인다.
    offset: '50%',
  },
]

/**
 * 여정 동선.
 *
 * 선만 그으면 어느 쪽에서 어느 쪽으로 갔는지 알 수 없어, 핀과 핀 사이 구간마다
 * 한가운데에 이동 방향 화살표를 하나씩 얹는다.
 *
 * 화살표는 구간별로 따로 그린다. 선 하나에 몰아 얹으면 꺾이는 지점에 걸린
 * 화살표가 한쪽 구간 기울기만 따라가 선과 어긋나 보인다.
 *
 * `path` 는 방문한 순서대로 와야 한다. 화살표는 그 순서를 따른다.
 * 점이 둘 미만이면 이을 것이 없어 아무것도 그리지 않는다.
 */
const RoutePolyline = ({ path }) => {
  const view = useMapView()

  if (path.length < 2) return null

  return (
    <>
      <Polyline
        path={path}
        strokeColor={ROUTE_COLOR}
        strokeOpacity={0.92}
        strokeWeight={3}
      />

      {/* 화살표만 얹는 선들이다. 동선은 위에서 이미 그렸으므로 보이지 않게 둔다. */}
      {getLegs(path).map((leg, index) => {
        const scale = getShortLegArrowScale(getLegScreenDistance(leg, view))

        return (
          <Polyline
            key={`${leg[0].lat},${leg[0].lng}-${index}`}
            path={leg}
            strokeOpacity={0}
            icons={buildDirectionArrow(leg, scale)}
          />
        )
      })}
    </>
  )
}

export default RoutePolyline
