import { useEffect, useState } from 'react'
import styled from 'styled-components'

const PhotoUploadStatus = ({ progress, className }) => {
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDotCount((current) => (current % 3) + 1)
    }, 500)

    return () => window.clearInterval(timer)
  }, [])

  if (!progress) return null

  const label = progress.phase === 'attach' ? '핀에 사진 등록 중' : '사진 업로드 중'

  return (
    <Status className={className} role="status" aria-live="polite">
      {label}
      <LoadingDots aria-hidden="true">{'.'.repeat(dotCount)}</LoadingDots>{' '}
      {progress.completed}/{progress.total}장 (
      {progress.batchIndex}/{progress.totalBatches})
    </Status>
  )
}

export default PhotoUploadStatus

const Status = styled.p`
  margin: 0;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  text-align: center;
  word-break: keep-all;
`

const LoadingDots = styled.span`
  display: inline-block;
  width: 3ch;
  text-align: left;
`
