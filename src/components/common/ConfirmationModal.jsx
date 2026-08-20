import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import Button from './Button'
import overlayWidth from './overlayWidth'

const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  '[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * 공통 확인 바텀 시트.
 *
 * 대상 카드나 안내문처럼 화면마다 달라지는 내용은 children으로 전달한다.
 *
 * @example
 * <ConfirmationModal
 *   open={isOpen}
 *   title="이 구간을 삭제할까요?"
 *   confirmLabel="구간 삭제하기"
 *   onConfirm={handleDelete}
 *   onCancel={() => setIsOpen(false)}
 * >
 *   <DeleteSummary />
 * </ConfirmationModal>
 */
function ConfirmationModal({
  open,
  title,
  confirmLabel,
  cancelLabel = '취소',
  children,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  cancelDisabled = false,
  closeOnBackdrop = true,
  ariaDescribedBy,
  className,
}) {
  const titleId = useId()
  const sheetRef = useRef(null)
  const confirmButtonRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocusedElement = document.activeElement
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      const initialFocusTarget = cancelDisabled
        ? confirmButtonRef.current
        : cancelButtonRef.current

      initialFocusTarget?.focus()
    })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (cancelDisabled) return

        event.preventDefault()
        onCancelRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !sheetRef.current) return

      const focusableElements = Array.from(
        sheetRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true')

      if (focusableElements.length === 0) {
        event.preventDefault()
        sheetRef.current.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus()
      }
    }
  }, [cancelDisabled, open])

  if (!open || typeof document === 'undefined') return null

  const requestCancel = () => {
    if (!cancelDisabled) onCancel?.()
  }

  return createPortal(
    <ModalLayer className={className}>
      <Scrim
        type="button"
        aria-label="확인 창 닫기"
        onClick={() => {
          if (closeOnBackdrop) requestCancel()
        }}
      />
      <Sheet
        ref={sheetRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        <SheetHandle aria-hidden="true" />
        <Title id={titleId}>{title}</Title>
        <Content>{children}</Content>
        <Actions>
          <ConfirmButton
            ref={confirmButtonRef}
            type="button"
            $variant="primary"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </ConfirmButton>
          <CancelButton
            ref={cancelButtonRef}
            type="button"
            $variant="ghost"
            onClick={requestCancel}
            disabled={cancelDisabled}
          >
            {cancelLabel}
          </CancelButton>
        </Actions>
      </Sheet>
    </ModalLayer>,
    document.body,
  )
}

export default ConfirmationModal

const ModalLayer = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0 auto 0 50%;
  ${overlayWidth}
  transform: translateX(-50%);
`

const Scrim = styled.button`
  position: absolute;
  inset: 0;
  width: 100%;
  padding: 0;
  border: 0;
  background: rgb(42 37 34 / 50%);
  cursor: default;
`

const Sheet = styled.section`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  /* 높이를 내용에 맞춘다. 고정하면 남는 공간이 전부 본문과 버튼 사이에 생긴다.
     시안의 374px 는 삭제 확인처럼 내용이 꽉 찬 경우의 결과값이다. */
  max-height: calc(100% - 16px);
  flex-direction: column;
  overflow: hidden;
  padding: 32px 24px max(18px, env(safe-area-inset-bottom));
  border-radius: 24px 24px 0 0;
  outline: none;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Bottom-Sheet);
`

const SheetHandle = styled.span`
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
  flex: none;
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
  word-break: keep-all;
`

const Content = styled.div`
  min-height: 0;
  flex: 1 1 auto;
  margin-top: 14px;
  /* 내용이 최대 높이를 넘기면 잘리지 않고 스크롤되게 한다. */
  overflow-y: auto;
`

const Actions = styled.div`
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
`

const ConfirmButton = styled(Button)`
  height: 54px;
  flex: none;
  background: #2e2118;
  font: var(--text-ui-button);

  &:disabled {
    background: var(--State-Disabled-Fill);
    cursor: not-allowed;
  }
`

const CancelButton = styled(Button)`
  height: 48px;
  flex: none;
  font: var(--text-ui-button);

  &:disabled {
    cursor: not-allowed;
  }
`
