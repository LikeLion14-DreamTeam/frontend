import styled from 'styled-components'
import closeIcon from '../../assets/icons/capture-close.svg'

/**
 * 사진을 크게 보는 오버레이. 촬영 화면과 전체 사진 보기가 같은 모습을 쓴다.
 *
 * 화면마다 다른 동작(삭제 등)은 `children` 으로 아래쪽에 넣는다.
 *
 * @param photos `{ id, url }` 배열
 * @param index 지금 보고 있는 사진의 자리
 * @param onIndexChange 좌우 버튼으로 자리를 옮길 때
 * @param onClose 닫을 때
 */
const PhotoPreviewOverlay = ({
  photos,
  index,
  onIndexChange,
  onClose,
  children,
}) => {
  const photo = photos[index]

  if (!photo) return null

  return (
    <PreviewLayer role="dialog" aria-label="사진 크게 보기">
      <PreviewClose type="button" aria-label="닫기" onClick={onClose}>
        <img src={closeIcon} alt="" aria-hidden="true" />
      </PreviewClose>

      <PreviewStage>
        <PreviewPhoto src={photo.url} alt="" crossOrigin="anonymous" />

        {index > 0 && (
          <PreviewNav
            $side="left"
            type="button"
            aria-label="이전 사진"
            onClick={() => onIndexChange(index - 1)}
          >
            <Chevron $direction="left" aria-hidden="true" />
          </PreviewNav>
        )}

        {index < photos.length - 1 && (
          <PreviewNav
            $side="right"
            type="button"
            aria-label="다음 사진"
            onClick={() => onIndexChange(index + 1)}
          >
            <Chevron $direction="right" aria-hidden="true" />
          </PreviewNav>
        )}
      </PreviewStage>

      <PreviewIndex>
        <IndexCurrent>{index + 1}</IndexCurrent>
        <IndexSlash>/</IndexSlash>
        <IndexTotal>{photos.length}</IndexTotal>
      </PreviewIndex>

      {children && <PreviewActions>{children}</PreviewActions>}
    </PreviewLayer>
  )
}

export default PhotoPreviewOverlay

/*
 * 화면 전체를 덮어야 해서 `fixed` 로 둔다. `absolute` 로 두면 기준이 되는
 * 조상이 화면마다 달라, 스크롤되는 화면에서는 사진 아래가 덮이지 않는다.
 */
const PreviewLayer = styled.div`
  position: fixed;
  z-index: 20;
  /* 페이지들과 같은 폭으로 가운데 세운다. */
  inset: 0 auto 0 50%;
  width: min(100%, 450px);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--Text-Primary);
  transform: translateX(-50%);
`

const PreviewClose = styled.button`
  position: absolute;
  top: 0;
  right: 20px;
  z-index: 1;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;

  img {
    width: 40px;
    height: 40px;
    display: block;
  }
`

const PreviewStage = styled.div`
  position: relative;
  width: 100%;
  margin-top: 59px;
`

const PreviewPhoto = styled.img`
  width: 100%;
  aspect-ratio: 3 / 4;
  display: block;
  object-fit: cover;
  background: #d5d5d5;
`

/* 시안에 없는 요소다. 좌우로 넘길 수단이 필요해 칩과 같은 톤으로 얹었다.
   첫 장에서는 왼쪽, 마지막 장에서는 오른쪽 버튼을 아예 그리지 않는다. */
const PreviewNav = styled.button`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 12px;' : 'right: 12px;')}
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgb(36 28 22 / 60%);
  transform: translateY(-50%);
  cursor: pointer;

  &:active {
    background: rgb(36 28 22 / 80%);
  }
`

const Chevron = styled.span`
  width: 10px;
  height: 10px;
  border-top: 2px solid rgb(242 233 220 / 92%);
  border-right: 2px solid rgb(242 233 220 / 92%);
  /* 오른쪽은 45도, 왼쪽은 반대로 돌린다. 살짝 밀어 시각적 중심을 맞춘다. */
  ${({ $direction }) =>
    $direction === 'left'
      ? 'transform: translateX(2px) rotate(-135deg);'
      : 'transform: translateX(-2px) rotate(45deg);'}
`

const PreviewIndex = styled.p`
  margin-top: 25px;
  display: flex;
  align-items: baseline;
  gap: 7px;
`

const IndexCurrent = styled.span`
  color: #f2e9dc;
  font: var(--text-ui-body-l);
`

const IndexSlash = styled.span`
  color: rgb(242 233 220 / 35%);
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
`

const IndexTotal = styled.span`
  color: rgb(242 233 220 / 60%);
  font: var(--text-ui-body-l);
`

const PreviewActions = styled.div`
  margin-top: 25px;
  display: flex;
  align-items: center;
`
