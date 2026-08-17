import styled from 'styled-components'
import chevronIcon from '../../assets/map/popover-chevron.svg'
import closeIcon from '../../assets/map/popover-close.svg'
import tailIcon from '../../assets/map/popover-tail.svg'

/**
 * 대표사진 장수별 배치.
 *
 * 칸은 모두 남는 폭을 똑같이 나눠 가지므로 높이와 간격만 다르다.
 * 안쪽 폭 284 기준으로 3장이면 92, 2장이면 138 이 된다.
 */
const PHOTO_ROW = {
  1: { height: 129, gap: 8 },
  2: { height: 102, gap: 8 },
  3: { height: 92, gap: 4 },
}

const MAX_PHOTOS = 3

/**
 * 지도에서 고른 핀 위에 뜨는 말풍선.
 *
 * 자리 잡는 일은 하지 않는다. 좌표에 붙이는 건 `MapOverlay` 가 맡는다.
 *
 * @param photos 대표사진 `[{ photo_id, url }]`. 최대 3장까지 보여준다
 * @param message 채울 내용이 아직 없을 때 대신 보여줄 한 줄
 */
const PinPopover = ({
  title,
  taggedAt,
  photoCount,
  hasVoiceMemo,
  photos = [],
  message = '',
  onClose,
  onDetail,
}) => {
  const shown = photos.slice(0, MAX_PHOTOS)
  const row = PHOTO_ROW[shown.length]

  return (
    <Bubble>
      <Header>
        {message ? (
          <Message role="status">{message}</Message>
        ) : (
          <HeaderText>
            <Address>{title}</Address>
            <MetaRow>
              <Meta>{taggedAt}</Meta>
              <Meta>
                사진 {photoCount}
                {hasVoiceMemo && ' · 음성 1'}
              </Meta>
            </MetaRow>
          </HeaderText>
        )}

        <CloseButton type="button" aria-label="닫기" onClick={onClose}>
          <img src={closeIcon} alt="" />
        </CloseButton>
      </Header>

      {!message && row && (
        <>
          <PhotoRow $gap={row.gap}>
            {shown.map((photo) => (
              <Photo key={photo.photo_id} $height={row.height}>
                {photo.url && <PhotoImage src={photo.url} alt="" />}
              </Photo>
            ))}
          </PhotoRow>

          <Divider />

          <DetailButton type="button" onClick={onDetail}>
            이 핀 기록 자세히 보기
            <img src={chevronIcon} alt="" />
          </DetailButton>
        </>
      )}

      <Tail src={tailIcon} alt="" />
    </Bubble>
  )
}

export default PinPopover

/* 꼬리가 아래로 삐져나오도록 `overflow` 를 열어 둔다. */
const Bubble = styled.div`
  position: relative;
  width: 316px;
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 13px;
  border-radius: 16px;
  background: var(--Surface-Base);
  filter: drop-shadow(0 10px 12px rgb(36 26 18 / 32%));
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

/* 시안의 글 칸 폭. 남는 자리는 비워 두고 줄을 짧게 유지한다. */
const HeaderText = styled.div`
  width: 166px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const Address = styled.h2`
  color: var(--Text-Primary);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  word-break: keep-all;
`

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Meta = styled.span`
  color: var(--Text-Secondary);
  font-family: var(--font-sans);
  font-size: 10px;
  white-space: nowrap;
`

const Message = styled.p`
  width: 166px;
  color: var(--Text-Secondary);
  font-family: var(--font-sans);
  font-size: 12px;
  word-break: keep-all;
`

/* 닫기 그림은 10.5px 이라 손가락으로 누르기엔 작다. 누르는 자리만 넓히고
   여백을 음수로 상쇄해 그림 위치는 시안대로 둔다. */
const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  margin: -11px -11px -11px 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 10.5px;
    height: 10.5px;
    display: block;
  }
`

const PhotoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ $gap }) => `${$gap}px`};
`

const Photo = styled.div`
  height: ${({ $height }) => `${$height}px`};
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  background: var(--Map-Land);
`

const PhotoImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const Divider = styled.div`
  height: 0.75px;
  background: var(--Border-Default);
`

const DetailButton = styled.button`
  padding: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  img {
    width: 6.4px;
    height: 11.4px;
    display: block;
  }
`

const Tail = styled.img`
  position: absolute;
  top: 100%;
  left: 50%;
  width: 18px;
  height: 11px;
  display: block;
  transform: translateX(-50%);
`
