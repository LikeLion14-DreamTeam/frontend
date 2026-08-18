import { Polyline } from '@vis.gl/react-google-maps'

const ROUTE_COLOR = '#c99a45'

/*
 * 화살표 모양. 위(-y)가 진행 방향이고, 선의 기울기에 맞춰 저절로 돌아간다.
 *
 * 구글이 주는 기본 화살표(`SymbolPath.FORWARD_CLOSED_ARROW`)는 뾰족한 끝이
 * 기준점이라 `offset: '50%'` 을 줘도 끝만 가운데에 닿고 몸통은 뒤로 처진다.
 * 기준점이 한가운데인 삼각형을 직접 그려 화살표 중앙이 선 가운데에 오게 한다.
 * 좌표는 그대로 픽셀이다.
 */
const ARROW_LENGTH = 8
const ARROW_WIDTH = 7
const ARROW_PATH = [
  `M 0 ${-ARROW_LENGTH / 2}`,
  `L ${ARROW_WIDTH / 2} ${ARROW_LENGTH / 2}`,
  `L ${-ARROW_WIDTH / 2} ${ARROW_LENGTH / 2}`,
  'Z',
].join(' ')

/* 핀에서 핀으로 가는 구간들. 화살표를 구간마다 하나씩 놓는다. */
const getLegs = (path) =>
  path.slice(0, -1).map((from, index) => [from, path[index + 1]])

const toRadian = (degree) => (degree * Math.PI) / 180

/* 메르카토르에서의 세로 좌표. 북쪽으로 갈수록 커진다. */
const mercatorY = (lat) => Math.log(Math.tan(Math.PI / 4 + toRadian(lat) / 2))

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
    toRadian(to.lng - from.lng),
    mercatorY(to.lat) - mercatorY(from.lat),
  ) *
    180) /
  Math.PI

/* 구글이 알아서 돌려 주는 각도에 맡기지 않고(`fixedRotation`) 직접 계산해 넣는다. */
const buildDirectionArrow = (leg) => [
  {
    icon: {
      path: ARROW_PATH,
      /* 끝이 뾰족해서 선을 두르면 이음매가 뾰족한 끝 너머로 길게 삐져나온다.
         한쪽으로 쏠려 보이므로 채우기만 쓴다. */
      strokeWeight: 0,
      fillColor: ROUTE_COLOR,
      fillOpacity: 1,
      rotation: getBearing(leg),
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
      {getLegs(path).map((leg, index) => (
        <Polyline
          key={`${leg[0].lat},${leg[0].lng}-${index}`}
          path={leg}
          strokeOpacity={0}
          icons={buildDirectionArrow(leg)}
        />
      ))}
    </>
  )
}

export default RoutePolyline
