import styled from 'styled-components'

const PhotoUploadStatus = ({ progress, className }) => {
  if (!progress) return null

  return (
    <Status className={className} role="status" aria-live="polite">
      {progress.phase === 'attach' ? '핀에 사진 등록 중' : '사진 업로드 중'}…{' '}
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
