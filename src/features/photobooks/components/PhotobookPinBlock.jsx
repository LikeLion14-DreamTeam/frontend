import styled, { css } from 'styled-components'
import detailChevron from '../../../assets/photobooks/detail-chevron.svg'
import shareIcon from '../../../assets/photobooks/share.svg'
import VoiceMemoBar from '../../../components/common/VoiceMemoBar'

const MAX_PIN_THUMBNAIL_PHOTOS = 4

const normalizePhoto = (photo, index, placeName) =>
  typeof photo === 'string'
    ? { id: `${photo}-${index}`, url: photo, alt: `${placeName} 사진 ${index + 1}` }
    : {
        id:
          photo.id ??
          photo.photoId ??
          `${photo.url ?? photo.gradient ?? 'photo'}-${index}`,
        url: photo.url,
        gradient: photo.gradient,
        alt: photo.alt ?? `${placeName} 사진 ${index + 1}`,
      }

const PhotobookPinBlock = ({
  className,
  placeName,
  recordedAt,
  photos = [],
  note,
  voiceMemo,
  onOpenDetail,
  onShare,
  detailLabel = '자세히',
}) => {
  const normalizedPhotos = photos
    .slice(0, MAX_PIN_THUMBNAIL_PHOTOS)
    .map((photo, index) => normalizePhoto(photo, index, placeName))
  const photoCount = Math.max(1, normalizedPhotos.length)
  const hasRecord = Boolean(note || voiceMemo)

  return (
    <Block className={className}>
      <ActionRow>
        <DetailButton type="button" onClick={onOpenDetail}>
          {detailLabel}
          <img src={detailChevron} alt="" />
        </DetailButton>

        <ShareButton
          type="button"
          aria-label={`${placeName || '핀 기록'} 공유`}
          onClick={onShare}
        >
          <img src={shareIcon} alt="" />
        </ShareButton>
      </ActionRow>

      <PhotoSection>
        <PinMeta>
          <PlaceName>{placeName}</PlaceName>
          <RecordedAt>{recordedAt}</RecordedAt>
        </PinMeta>

        <PhotoGrid $count={photoCount}>
          {normalizedPhotos.length ? (
            normalizedPhotos.map((photo, index) =>
              photo.url ? (
                <Photo
                  key={photo.id}
                  $count={photoCount}
                  $index={index}
                  src={photo.url}
                  alt={photo.alt}
                  crossOrigin="anonymous"
                  loading="lazy"
                />
              ) : (
                <PhotoPlaceholder
                  key={photo.id}
                  role="img"
                  aria-label={photo.alt}
                  $count={photoCount}
                  $index={index}
                  $gradient={photo.gradient}
                />
              ),
            )
          ) : (
            <PhotoPlaceholder $count={photoCount} aria-label="사진 없음" />
          )}
        </PhotoGrid>
      </PhotoSection>

      {hasRecord ? (
        <Record $hasBoth={Boolean(note && voiceMemo)}>
          {note ? <Note>{note}</Note> : null}
          {voiceMemo ? (
            <VoiceMemoBar
              duration={voiceMemo.duration}
              /* 주면 `지난 시간 / 전체 길이` 로, 없으면 전체 길이만 나온다. */
              position={voiceMemo.position ?? null}
              isPlaying={voiceMemo.isPlaying}
              progress={voiceMemo.progress}
              onToggle={voiceMemo.onToggle}
              disabled={voiceMemo.disabled}
            />
          ) : null}
        </Record>
      ) : null}
    </Block>
  )
}

export default PhotobookPinBlock

const Block = styled.article`
  width: 100%;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 20px;
  border-radius: 20px;
  background: var(--Background-Base);
  box-shadow: 0 2px 3px rgb(48 38 28 / 6%);
`

const ActionRow = styled.div`
  width: 100%;
  min-height: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`

const DetailButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-nav);
  cursor: pointer;

  img {
    width: 5px;
    height: 10px;
    display: block;
  }
`

const ShareButton = styled.button`
  width: 16px;
  height: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 16px;
    height: 17px;
    display: block;
  }
`

const PhotoSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const PinMeta = styled.div`
  min-width: 0;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  white-space: nowrap;
`

const PlaceName = styled.h3`
  min-width: 0;
  color: var(--Text-Primary);
  font: var(--text-ui-button);
  overflow: hidden;
  text-overflow: ellipsis;
`

const RecordedAt = styled.p`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

const gridLayout = {
  1: css`
    height: 200px;
    grid-template-columns: minmax(0, 1fr);
  `,
  2: css`
    height: 148px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 6px;
  `,
  3: css`
    height: 160px;
    grid-template-columns: minmax(0, 1fr) minmax(0, 41.3%);
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 8px;
  `,
  4: css`
    height: 244px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    column-gap: 6px;
    row-gap: 8px;
  `,
}

const PhotoGrid = styled.div`
  width: 100%;
  display: grid;
  overflow: hidden;
  ${({ $count }) => gridLayout[$count]}
`

const threePhotoPosition = css`
  ${({ $count, $index }) =>
    $count === 3 && $index === 0
      ? css`
          grid-row: 1 / span 2;
        `
      : ''}
`

const Photo = styled.img`
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: block;
  border-radius: 12px;
  object-fit: cover;
  ${threePhotoPosition}
`

const PhotoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: ${({ $gradient }) =>
    $gradient ?? 'linear-gradient(180deg, #f0e2cb 0%, #9da69b 100%)'};
  ${threePhotoPosition}
`

const Record = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ $hasBoth }) => ($hasBoth ? '14px' : '0')};
`

const Note = styled.p`
  width: 100%;
  color: var(--Text-Primary);
  font: var(--text-ui-body-m);
  white-space: pre-wrap;
  word-break: keep-all;
`
