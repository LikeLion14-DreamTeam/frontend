import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const DRAG_START_DISTANCE = 5

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * 화면 하단에 고정되는 시트용 공통 컨테이너입니다.
 * 핸들을 누르거나 위·아래로 끌면 열린 위치와 접힌 위치 사이로 스냅됩니다.
 */
const SnapSheet = ({
  ariaLabel,
  centered = false,
  children,
  className,
  collapsedOffset,
  contentLabel,
  height,
  initiallyCollapsed = false,
  onCollapsedChange,
  onOffsetChange,
  snapThreshold = collapsedOffset / 2,
  title,
}) => {
  const offsetRef = useRef(initiallyCollapsed ? collapsedOffset : 0)
  const dragRef = useRef(null)
  const [offset, setOffset] = useState(offsetRef.current)
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed)
  const [isDragging, setIsDragging] = useState(false)

  const moveTo = useCallback((nextOffset) => {
    const next = clamp(nextOffset, 0, collapsedOffset)
    offsetRef.current = next
    setOffset(next)
    onOffsetChange?.(next)
  }, [collapsedOffset, onOffsetChange])

  const snapTo = useCallback((collapsed) => {
    setIsCollapsed(collapsed)
    setIsDragging(false)
    moveTo(collapsed ? collapsedOffset : 0)
    onCollapsedChange?.(collapsed)
  }, [collapsedOffset, moveTo, onCollapsedChange])

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
    snapTo(drag.moved ? offsetRef.current >= snapThreshold : !isCollapsed)
  }, [isCollapsed, snapThreshold, snapTo])

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    snapTo(!isCollapsed)
  }

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
        aria-hidden={isCollapsed}
        aria-label={contentLabel}
        inert={isCollapsed ? true : undefined}
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

const Content = styled.div`
  height: ${({ $hasTitle }) => ($hasTitle ? 'calc(100% - 63px)' : 'calc(100% - 30px)')};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
  transition: opacity 120ms ease;
`
