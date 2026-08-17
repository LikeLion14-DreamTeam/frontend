import { useRef, useState } from 'react'

/** 이만큼 가로로 움직여야 넘긴 것으로 본다. */
const SWIPE_THRESHOLD = 40

/**
 * 좌우로 넘겨 보는 목록을 다룬다. 홈의 여정 카드·여권, 저장 화면의 사진이 같은 방식이다.
 *
 * 반환한 핸들러를 감싸는 요소에 펼쳐 넣고, 그 안쪽 트랙을 `index` 만큼 밀면 된다.
 * 트랙에는 `touch-action: pan-y` 를 줘서 세로 스크롤을 막지 않아야 한다.
 *
 * @param length 넘길 수 있는 칸 수
 * @returns `{ index, setIndex, handlers }`
 */
const useSwipeNavigation = (length) => {
  const [index, setIndex] = useState(0)
  const startRef = useRef(null)

  const move = (step) => {
    // 칸이 없을 때 length - 1 이 -1 이 되므로 아래쪽을 마지막에 한 번 더 막는다.
    setIndex((current) =>
      Math.max(0, Math.min(current + step, length - 1)),
    )
  }

  const handlers = {
    onTouchStart: (event) => {
      const [touch] = event.touches
      startRef.current = { x: touch.clientX, y: touch.clientY }
    },

    onTouchEnd: (event) => {
      const start = startRef.current
      if (!start) return
      startRef.current = null

      const [touch] = event.changedTouches
      const movedX = touch.clientX - start.x
      const movedY = touch.clientY - start.y

      // 세로로 더 많이 움직였으면 페이지를 스크롤한 것이지 넘긴 게 아니다.
      if (Math.abs(movedX) < SWIPE_THRESHOLD) return
      if (Math.abs(movedX) <= Math.abs(movedY)) return

      move(movedX < 0 ? 1 : -1)
    },

    onTouchCancel: () => {
      startRef.current = null
    },
  }

  return { index, setIndex, handlers }
}

export default useSwipeNavigation
