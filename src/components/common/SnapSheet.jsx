import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

const DRAG_START_DISTANCE = 5

/* 이만큼 움직이면 다음 자리로 넘어간다. 가장 가까운 자리로 붙이면 자리 사이
   거리의 절반을 넘겨야 해서, 스크롤하듯 조금 쓸어올렸을 때 제자리로 튕긴다. */
const SNAP_TRIGGER_DISTANCE = 24

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * 화면 하단에 고정되는 시트용 공통 컨테이너입니다.
 * 핸들을 누르거나 위·아래로 끌면 정해진 위치들 사이로 스냅됩니다.
 *
 * 기본은 열린 위치(0)와 접힌 위치(`collapsedOffset`) 두 곳입니다. 그 사이에
 * 머무는 자리가 필요하면 `snapOffsets` 로 더 줍니다. 예를 들어 핀 상세는
 * 전체 화면·기본·지도 보기 세 곳을 오갑니다.
 *
 * `initialOffset` 은 처음 서는 자리입니다. 안 주면 열린 위치에서 시작합니다.
 */
const SnapSheet = ({
  ariaLabel,
  centered = false,
  children,
  className,
  collapsedOffset,
  contentLabel,
  height,
  expandOnScroll = false,
  initialOffset,
  initiallyCollapsed = false,
  onCollapsedChange,
  onOffsetChange,
  snapOffsets,
  title,
}) => {
  /* 0(끝까지 열림)과 `collapsedOffset`(접힘)은 늘 있다. 중복은 걸러 내고
     작은 값부터 늘어놓는다.

     쓰는 쪽이 배열을 그때그때 만들어 넘겨도 값이 같으면 다시 계산하지 않도록
     내용을 이어 붙인 글자를 기준으로 삼는다. */
  const snapKey = (snapOffsets ?? []).join(',')

  const offsets = useMemo(
    () =>
      [
        ...new Set([
          0,
          ...snapKey.split(',').filter(Boolean).map(Number),
          collapsedOffset,
        ]),
      ].sort((a, b) => a - b),
    [collapsedOffset, snapKey],
  )

  const startOffset =
    initialOffset ?? (initiallyCollapsed ? collapsedOffset : 0)

  const offsetRef = useRef(startOffset)
  const dragRef = useRef(null)
  const [offset, setOffset] = useState(startOffset)
  const [isCollapsed, setIsCollapsed] = useState(
    startOffset === collapsedOffset,
  )
  const [isDragging, setIsDragging] = useState(false)

  const moveTo = useCallback((nextOffset) => {
    const next = clamp(nextOffset, 0, collapsedOffset)
    offsetRef.current = next
    setOffset(next)
    onOffsetChange?.(next)
  }, [collapsedOffset, onOffsetChange])

  const settleAt = useCallback((target) => {
    const collapsed = target === collapsedOffset

    setIsCollapsed(collapsed)
    setIsDragging(false)
    moveTo(target)
    onCollapsedChange?.(collapsed)
  }, [collapsedOffset, moveTo, onCollapsedChange])

  /** 지금 자리에서 가장 가까운 스냅 위치 */
  const nearestOffset = useCallback(
    (value) =>
      offsets.reduce((best, candidate) =>
        Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
      ),
    [offsets],
  )

  /**
   * 끌기를 멈췄을 때 갈 자리.
   *
   * 움직인 방향으로 한 칸 옮긴다. 조금밖에 안 움직였으면 제자리에 둔다.
   */
  const nextOffset = useCallback(
    (startOffset, deltaY) => {
      if (Math.abs(deltaY) < SNAP_TRIGGER_DISTANCE) {
        return nearestOffset(startOffset)
      }

      const goingUp = deltaY < 0
      const candidates = offsets.filter((candidate) =>
        goingUp ? candidate < startOffset : candidate > startOffset,
      )

      if (candidates.length === 0) return nearestOffset(startOffset)

      return goingUp ? candidates.at(-1) : candidates[0]
    },
    [nearestOffset, offsets],
  )

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      captureTarget: event.currentTarget,
      moved: false,
      pointerId: event.pointerId,
      startOffset: offsetRef.current,
      startY: event.clientY,
    }
    setIsDragging(true)
  }

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaY) > DRAG_START_DISTANCE) drag.moved = true
    moveTo(drag.startOffset + deltaY)
  }, [moveTo])

  const handlePointerEnd = useCallback((event) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (drag.captureTarget?.hasPointerCapture(event.pointerId)) {
      drag.captureTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null

    /* 핸들을 끌지 않고 눌렀다 뗐으면 열고 닫는 것으로 본다.
       내용 위에서 시작한 손짓은 누르기만으로 자리를 바꾸지 않는다. */
    if (drag.moved || drag.fromContent) {
      settleAt(nextOffset(drag.startOffset, offsetRef.current - drag.startOffset))
      return
    }

    settleAt(isCollapsed ? 0 : collapsedOffset)
  }, [collapsedOffset, isCollapsed, nextOffset, settleAt])

  /*
   * 시트 몸통(손잡이 아래)을 잡고 쓸어도 시트가 따라 움직인다.
   *
   * 시트가 끝까지 열리기 전에는 내용의 스크롤을 잠가 두므로, 여기서 나는
   * 손짓은 전부 시트를 옮기는 데 쓴다. 끝까지 열린 뒤에는 잠금이 풀려 내용이
   * 평소처럼 스크롤되고, 맨 위에서 아래로 쓸어내릴 때만 다시 시트를 옮긴다.
   *
   * 손잡이와 달리 이쪽은 이 요소가 처음부터 끝까지 직접 처리한다. 창에 붙는
   * 리스너에 넘기면 붙는 시점이 한 박자 늦어 첫 손짓을 놓친다.
   *
   * 누르는 순간 바로 붙잡지도 않는다. 그러면 사진이나 버튼을 누르는 것까지
   * 가로챈다. 손가락이 실제로 움직인 뒤에 붙잡는다.
   */
  const contentDragRef = useRef(null)

  const handleContentPointerDown = (event) => {
    if (!expandOnScroll) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    contentDragRef.current = {
      active: false,
      pointerId: event.pointerId,
      startOffset: offsetRef.current,
      startY: event.clientY,
    }
  }

  const handleContentPointerMove = (event) => {
    const drag = contentDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const deltaY = event.clientY - drag.startY

    if (!drag.active) {
      if (Math.abs(deltaY) <= DRAG_START_DISTANCE) return

      /* 다 열린 상태에서는 내용이 스크롤된다. 그 자리를 뺏지 않도록, 맨 위에서
         아래로 쓸어내릴 때만 붙잡는다. 위로 쓸어올리거나 중간을 읽는 중이면
         그대로 스크롤에 맡긴다. */
      if (
        drag.startOffset === 0 &&
        !(deltaY > 0 && event.currentTarget.scrollTop <= 0)
      ) {
        contentDragRef.current = null
        return
      }

      drag.active = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setIsDragging(true)
    }

    moveTo(drag.startOffset + deltaY)
  }

  const handleContentPointerEnd = (event) => {
    const drag = contentDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    contentDragRef.current = null

    // 움직이지 않았으면 누른 것이다. 자리를 건드리지 않는다.
    if (!drag.active) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    settleAt(nextOffset(drag.startOffset, offsetRef.current - drag.startOffset))
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    settleAt(isCollapsed ? 0 : collapsedOffset)
  }

  /* 처음 서는 자리도 한 번 알려 준다. 끌 때만 알려주면, 시트를 내린 채로
     시작하는 화면에서 시트에 맞춰 놓은 요소들이 위에 뜬 채로 남는다. */
  const hasReportedStart = useRef(false)

  useEffect(() => {
    if (hasReportedStart.current) return
    hasReportedStart.current = true
    onOffsetChange?.(offsetRef.current)
  }, [onOffsetChange])

  useEffect(() => {
    if (!isDragging) return undefined
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [handlePointerEnd, handlePointerMove, isDragging])

  return (
    <Sheet
      className={className}
      $dragging={isDragging}
      $centered={centered}
      $height={height}
      $hasTitle={Boolean(title)}
      $offset={offset}
      aria-label={ariaLabel}
    >
      <DragHeader
        $hasTitle={Boolean(title)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? `${ariaLabel} 열기` : `${ariaLabel} 접기`}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
      >
        <Handle aria-hidden="true" />
        {title ? <Title>{title}</Title> : null}
      </DragHeader>
      <Content
        $hasTitle={Boolean(title)}
        $collapsed={isCollapsed}
        $scrollable={expandOnScroll}
        $locked={expandOnScroll && offset > 0}
        aria-hidden={isCollapsed}
        aria-label={contentLabel}
        inert={isCollapsed ? true : undefined}
        onPointerDown={handleContentPointerDown}
        onPointerMove={handleContentPointerMove}
        onPointerUp={handleContentPointerEnd}
        onPointerCancel={handleContentPointerEnd}
      >
        {children}
      </Content>
    </Sheet>
  )
}

export default SnapSheet

const Sheet = styled.section`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: ${({ $height }) => `${$height}px`};
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Bottom-Sheet);
  transform: ${({ $centered, $offset }) =>
    $centered ? `translate(-50%, ${$offset}px)` : `translateY(${$offset}px)`};
  transition: ${({ $dragging }) =>
    $dragging ? 'none' : 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)'};
  will-change: transform;
`

const DragHeader = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  height: ${({ $hasTitle }) => ($hasTitle ? '63px' : '30px')};
  display: flex;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;

  &:active { cursor: grabbing; }
  &:focus-visible { outline: 2px solid var(--Accent-Gold); outline-offset: -4px; }
`

const Handle = styled.span`
  position: absolute;
  top: 10px;
  left: 50%;
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: rgb(181 161 140 / 50%);
  transform: translateX(-50%);
`

const Title = styled.h2`
  margin-top: 30px;
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
`

/* 끝까지 열리기 전에는 스크롤을 잠근다. 잠겨 있어야 내용 위에서 쓸어올린
   손짓이 시트를 여는 데 온전히 쓰인다. */
const Content = styled.div`
  height: ${({ $hasTitle }) => ($hasTitle ? 'calc(100% - 63px)' : 'calc(100% - 30px)')};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
  transition: opacity 120ms ease;

  ${({ $scrollable, $locked }) =>
    $scrollable &&
    `
      overflow-y: ${$locked ? 'hidden' : 'auto'};
      overscroll-behavior: contain;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      ${
        $locked
          ? `
            /* 잠겨 있을 때는 세로 손짓을 브라우저에 넘기지 않는다. 넘기면
               스크롤로 가져가면서 손짓을 취소해 시트를 끌어올릴 수 없다.

               이 속성은 물려받지 않는다. 손가락이 실제로 닿는 곳은 사진이나
               글 같은 안쪽 요소라, 거기까지 함께 걸어야 한다. */
            &,
            & * {
              touch-action: none;
            }
          `
          : 'touch-action: pan-y;'
      }
    `}
`
