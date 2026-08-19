import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps'

/**
 * 지도 위 한 좌표에 붙는 겹침 층.
 *
 * 화면 좌표로 한 번 계산해 두면 지도를 끌 때 제자리에 남으므로, 구글의
 * `OverlayView` 에 얹어 지도가 다시 그려질 때마다 위치를 따라가게 한다.
 * 자식은 좌표가 원점(0,0)인 자리에 그려지니 `transform` 으로 방향을 잡는다.
 *
 * `<Map>` 안에서만 쓸 수 있다.
 */
const MapOverlay = ({
  latitude,
  longitude,
  zIndex,
  interactive = true,
  blockMapGestures = true,
  children,
}) => {
  const map = useMap()
  const maps = useMapsLibrary('maps')

  const [container] = useState(() => {
    const element = document.createElement('div')
    element.style.position = 'absolute'
    return element
  })

  useEffect(() => {
    container.style.zIndex = zIndex == null ? '' : String(zIndex)
    container.style.pointerEvents = interactive ? 'auto' : 'none'
  }, [container, interactive, zIndex])

  useEffect(() => {
    if (!map || !maps) return undefined

    const overlay = new maps.OverlayView()

    /*
     * 마커보다 위에 있고 클릭도 받는 층이다.
     *
     * 다만 지도가 자기 위에서 일어난 클릭·끌기를 먼저 가져가 버려, 그대로 두면
     * 안에 둔 버튼이 눌리지 않고 지도만 반응한다. 이 층에서 난 일은 지도가
     * 건드리지 않도록 막아 둔다.
     */
    overlay.onAdd = () => {
      overlay.getPanes()?.floatPane.appendChild(container)
      if (interactive) {
        if (blockMapGestures) {
          maps.OverlayView.preventMapHitsAndGesturesFrom(container)
        } else {
          // 숫자 핀 클릭은 지도 배경 클릭으로 전파하지 않되, 휠·핀치 제스처는 둔다.
          maps.OverlayView.preventMapHitsFrom(container)
        }
      }
    }
    overlay.onRemove = () => container.remove()

    overlay.draw = () => {
      const point = overlay
        .getProjection()
        ?.fromLatLngToDivPixel({ lat: latitude, lng: longitude })

      if (!point) return

      container.style.left = `${point.x}px`
      container.style.top = `${point.y}px`
    }

    overlay.setMap(map)

    return () => overlay.setMap(null)
  }, [blockMapGestures, container, interactive, latitude, longitude, map, maps])

  return createPortal(children, container)
}

export default MapOverlay
