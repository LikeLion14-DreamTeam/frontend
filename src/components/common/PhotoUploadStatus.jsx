import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import SnapSheet from './SnapSheet'
import sheetWidth from './sheetWidth'

const PhotoUploadStatus = ({ progress, className }) => {
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDotCount((current) => (current % 3) + 1)
    }, 500)

    return () => window.clearInterval(timer)
  }, [])

  if (!progress) return null

  const label = '사진 업로드 중'
  const sheetTitle = `${label}${'.'.repeat(dotCount)}`
  const completed = Math.min(progress.completed ?? 0, progress.total ?? 0)
  const total = progress.total ?? 0
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return createPortal(
    <UploadSheet
      ariaLabel="사진 업로드 현황"
      className={className}
      centered
      collapsedOffset={148}
      contentLabel="사진 업로드 진행 상태"
      height={204}
      title={sheetTitle}
    >
      <Status role="status" aria-live="polite" aria-atomic="true">
        <StatusRow>
          <Spinner aria-hidden="true" />
          <StatusLabel>
            {label}
          </StatusLabel>
          <StatusCount>{completed}/{total}장</StatusCount>
        </StatusRow>
        <ProgressTrack
          role="progressbar"
          aria-label="사진 업로드 진행률"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completed}
          aria-valuetext={`${completed} / ${total}장, ${percent}%`}
        >
          <ProgressFill $percent={percent} />
        </ProgressTrack>
        <BatchStatus>
          사진을 안전하게 올리는 중이에요
          {progress.totalBatches > 1 &&
            ` · ${progress.batchIndex}/${progress.totalBatches}번째 묶음`}
        </BatchStatus>
      </Status>
    </UploadSheet>,
    document.body,
  )
}

export default PhotoUploadStatus

const UploadSheet = styled(SnapSheet)`
  position: fixed;
  z-index: 100;
  right: auto;
  left: 50%;
  ${sheetWidth}
`

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const Status = styled.div`
  padding: 9px 24px 0;
`

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Spinner = styled.span`
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  border: 2px solid rgb(181 118 59 / 20%);
  border-top-color: var(--Primary-Cognac);
  border-radius: 50%;
  animation: ${spin} 800ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const StatusLabel = styled.p`
  min-width: 0;
  flex: 1;
  color: var(--Text-Primary);
  font: var(--text-ui-body-m);
  font-weight: 600;
  word-break: keep-all;
`

const StatusCount = styled.p`
  flex: 0 0 auto;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
`

const ProgressTrack = styled.div`
  height: 8px;
  margin-top: 15px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--Background-Paper);
`

const ProgressFill = styled.span`
  width: ${({ $percent }) => `${$percent}%`};
  height: 100%;
  display: block;
  border-radius: inherit;
  background: var(--Primary-Cognac);
  transition: width 200ms ease;
`

const BatchStatus = styled.p`
  margin-top: 8px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: keep-all;
`
