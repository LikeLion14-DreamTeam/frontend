import { useEffect, useState } from 'react'

const LANDSCAPE_QUERY = '(orientation: landscape)'

/**
 * 지금 화면이 가로인지.
 *
 * 창 크기를 재지 않고 방향을 직접 묻는다. 그래야 키보드가 올라와 높이만
 * 줄어든 경우를 가로로 오해하지 않는다.
 */
const useIsLandscape = () => {
  const [isLandscape, setIsLandscape] = useState(
    () => window.matchMedia(LANDSCAPE_QUERY).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(LANDSCAPE_QUERY)
    const syncOrientation = (event) => setIsLandscape(event.matches)

    // 붙기 전에 돌아갔을 수 있어 한 번 맞춰 둔다.
    setIsLandscape(query.matches)
    query.addEventListener('change', syncOrientation)

    return () => query.removeEventListener('change', syncOrientation)
  }, [])

  return isLandscape
}

export default useIsLandscape
