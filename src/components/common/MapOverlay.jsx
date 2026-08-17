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
const MapOverlay = ({ latitude, longitude, children }) => {
  const map = useMap()
  const maps = useMapsLibrary('maps')

  const [container] = useState(() => {
    const element = document.createElement('div')
    element.style.position = 'absolute'
    return element
  })

  useEffect(() => {
    if (!map || !maps) return undefined

    const overlay = new maps.OverlayView()

    // 마커보다 위에 있고 클릭도 받는 층이다.
    overlay.onAdd = () => overlay.getPanes()?.floatPane.appendChild(container)
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
  }, [container, latitude, longitude, map, maps])

  return createPortal(children, container)
}

export default MapOverlay
