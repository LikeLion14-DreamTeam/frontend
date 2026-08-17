import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import coverSeal from '../../../assets/photobooks/cover-seal.svg'

const IMAGE_RETRY_DELAYS = [900, 1500, 2500]

const PhotobookCover = ({
  className,
  coverUrl,
  alt = '',
  isLoading = false,
}) => {
  const [retryCount, setRetryCount] = useState(0)
  const retryTimerRef = useRef(null)

  useEffect(() => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }

    setRetryCount(0)
  }, [coverUrl])

  useEffect(
    () => () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current)
      }
    },
    [],
  )

  const retryCoverImage = () => {
    if (retryCount >= IMAGE_RETRY_DELAYS.length) return
    if (retryTimerRef.current) return

    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null
      setRetryCount((current) =>
        current >= IMAGE_RETRY_DELAYS.length ? current : current + 1,
      )
    }, IMAGE_RETRY_DELAYS[retryCount])
  }

  return (
    <Cover className={className} $hasImage={Boolean(coverUrl)}>
      {coverUrl ? (
        <CoverImage
          key={`${coverUrl}-${retryCount}`}
          src={coverUrl}
          alt={alt}
          onError={retryCoverImage}
        />
      ) : null}

      <Spine aria-hidden="true" />
      <Seal src={coverSeal} alt="" aria-hidden="true" />

      <Corners aria-hidden="true">
        <Corner $position="top-left" />
        <Corner $position="top-right" />
        <Corner $position="bottom-left" />
        <Corner $position="bottom-right" />
      </Corners>

      {isLoading ? <LoadingLabel>처리 중</LoadingLabel> : null}
    </Cover>
  )
}

export default PhotobookCover

const Cover = styled.div`
  position: relative;
  width: 165px;
  height: 154px;
  flex: 0 0 165px;
  overflow: visible;
  border-radius: 8px;
  background: ${({ $hasImage }) =>
    $hasImage ? 'var(--Background-Paper)' : '#b9b1ad'};
  box-shadow: 0 5px 7px rgb(36 23 14 / 9%);
`

const CoverImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  border-radius: inherit;
  object-fit: cover;
`

const Spine = styled.span`
  position: absolute;
  left: -2px;
  top: 0;
  width: 14px;
  height: 155px;
  border-radius: 3px;
  background: #2d2118;
`

const Seal = styled.img`
  position: absolute;
  left: -2px;
  top: 55px;
  width: 16px;
  height: 44px;
  display: block;
`

const Corners = styled.span`
  position: absolute;
  inset: 13px 10px 12px 15px;
  pointer-events: none;
`

const Corner = styled.span`
  position: absolute;
  width: 14px;
  height: 15px;

  ${({ $position }) => {
    const isTop = $position.startsWith('top')
    const isLeft = $position.endsWith('left')

    return `
      ${isTop ? 'top: 0;' : 'bottom: 0;'}
      ${isLeft ? 'left: 0;' : 'right: 0;'}
      border-${isTop ? 'top' : 'bottom'}: 1px solid rgb(197 161 91 / 80%);
      border-${isLeft ? 'left' : 'right'}: 1px solid rgb(197 161 91 / 80%);
    `
  }}
`

const LoadingLabel = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: rgb(45 33 24 / 45%);
  color: var(--Text-Inverse);
  font: var(--text-ui-caption);
`
