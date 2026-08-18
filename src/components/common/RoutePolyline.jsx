import { Polyline, useMapsLibrary } from '@vis.gl/react-google-maps'

const ROUTE_COLOR = '#c99a45'

/**
 * 여정 동선.
 *
 * 선만 그으면 어느 쪽에서 어느 쪽으로 갔는지 알 수 없어, 가운데에 이동 방향
 * 화살표를 하나 얹는다. `repeat` 을 주지 않으면 `offset` 자리에 하나만 놓인다.
 *
 * `path` 는 방문한 순서대로 와야 한다. 화살표는 그 순서를 따른다.
 * 점이 둘 미만이면 이을 것이 없어 아무것도 그리지 않는다.
 */
const RoutePolyline = ({ path }) => {
  /* `SymbolPath` 는 core 라이브러리에 있다. 최신 로더는 나눠서 불러오기 때문에
     지도가 떴다고 이 값이 있는 건 아니다. 실리면 화살표가 뒤따라 붙는다. */
  const core = useMapsLibrary('core')

  if (path.length < 2) return null

  return (
    <Polyline
      path={path}
      strokeColor={ROUTE_COLOR}
      strokeOpacity={0.92}
      strokeWeight={3}
      icons={
        core
          ? [
              {
                icon: {
                  path: core.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: ROUTE_COLOR,
                  strokeWeight: 1,
                  fillColor: ROUTE_COLOR,
                  fillOpacity: 1,
                },
                offset: '50%',
              },
            ]
          : undefined
      }
    />
  )
}

export default RoutePolyline
