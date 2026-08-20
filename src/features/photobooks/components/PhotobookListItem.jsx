import styled, { keyframes } from 'styled-components'
import refreshIcon from '../../../assets/map/refresh.svg'
import PhotobookCover from './PhotobookCover'

const buildStats = ({ pinCount, photoCount, voiceCount }) =>
  [
    Number.isFinite(pinCount) ? `${pinCount} PIN` : null,
    Number.isFinite(photoCount) ? `${photoCount} PHOTO` : null,
    Number.isFinite(voiceCount) ? `${voiceCount} VOICE` : null,
  ]
    .filter(Boolean)
    .join(' · ')

const PhotobookListItem = ({
  className,
  title,
  period,
  coverUrl,
  pinCount,
  photoCount,
  voiceCount,
  onOpen,
  onRefresh,
  isRefreshing = false,
  refreshDisabled = false,
  openLabel = '포토북 열기',
}) => {
  const stats = buildStats({ pinCount, photoCount, voiceCount })

  return (
    <Item className={className}>
      <PhotobookCover
        coverUrl={coverUrl}
        alt={title ? `${title} 포토북 커버` : '포토북 커버'}
        isLoading={isRefreshing}
      />

      <Info>
        <Heading>
          <Title>{title}</Title>
          <Period>{period}</Period>
        </Heading>

        <Divider />
        <Stats>{stats}</Stats>

        <OpenButton type="button" onClick={onOpen}>
          {openLabel} <span aria-hidden="true">→</span>
        </OpenButton>
      </Info>

      <RefreshButton
        type="button"
        aria-label={`${title || '포토북'} 커버 새로고침`}
        onClick={onRefresh}
        disabled={refreshDisabled || isRefreshing || !onRefresh}
        $loading={isRefreshing}
      >
        <img src={refreshIcon} alt="" />
      </RefreshButton>
    </Item>
  )
}

export default PhotobookListItem

const Item = styled.article`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 17px;
`

const Info = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 13px;
`

const Heading = styled.div`
  min-width: 0;
  padding-right: 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h3`
  min-width: 0;
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Period = styled.p`
  min-height: 20px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const Divider = styled.span`
  width: 100%;
  height: 1px;
  display: block;
  background: rgb(222 211 198 / 80%);
`

const Stats = styled.p`
  min-height: 20px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const OpenButton = styled.button`
  align-self: flex-end;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-button);
  white-space: nowrap;
  cursor: pointer;
`

const rotate = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const RefreshButton = styled.button`
  position: absolute;
  right: 0;
  top: 10px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--Surface-Base);
  cursor: pointer;

  img {
    width: 15px;
    height: 15px;
    display: block;
    object-fit: contain;
    animation: ${({ $loading }) => ($loading ? rotate : 'none')} 0.8s linear
      infinite;
  }

  &:disabled {
    cursor: default;
    opacity: ${({ $loading }) => ($loading ? 1 : 0.55)};
  }
`
