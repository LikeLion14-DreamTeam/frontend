import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Tile from '../../components/common/Tile'
import backIcon from '../../assets/icons/Back.svg'

const photoGroups = Array.from({ length: 4 }, (_, groupIndex) => ({
  id: `group-${groupIndex + 1}`,
  time: '오후 1: 32',
  count: 3,
  tiles: Array.from(
    { length: 4 },
    (_, tileIndex) => `photo-${groupIndex + 1}-${tileIndex + 1}`,
  ),
}))

const PhotoCarousel = ({ group }) => {
  return (
    <PhotoStrip
      role="region"
      aria-roledescription="carousel"
      aria-label={`${group.time} 사진 ${group.count}장`}
    >
      {group.tiles.map((photoId, index) => (
        <PhotoTile
          key={photoId}
          interactive={false}
          role="img"
          aria-label={`${group.time} 사진 ${index + 1}`}
          aria-posinset={index + 1}
          aria-setsize={group.tiles.length}
        />
      ))}
    </PhotoStrip>
  )
}

const AllPhotos = () => {
  const navigate = useNavigate()

  return (
    <Page>
      <Toolbar>
        <BackButton
          type="button"
          aria-label="핀 상세로 돌아가기"
          onClick={() => navigate(-1)}
        >
          <img src={backIcon} alt="" />
        </BackButton>

        <AddNearbyButton
          type="button"
          aria-disabled="true"
          aria-label="주변 사진 추가 (준비 중)"
        >
          주변 사진 추가
        </AddNearbyButton>
      </Toolbar>

      <Heading>
        <Title>이 장소의 사진</Title>
        <Meta>경복궁 광화문 앞 · 2025.06.14 · 12장</Meta>
      </Heading>

      <PhotoGroups>
        {photoGroups.map((group) => (
          <PhotoGroup key={group.id}>
            <GroupHeading>
              <Time>{group.time}</Time>
              <Rule />
              <Count>{group.count}장</Count>
            </GroupHeading>

            <PhotoCarousel group={group} />
          </PhotoGroup>
        ))}
      </PhotoGroups>
    </Page>
  )
}

export default AllPhotos

const Page = styled.main`
  width: 100%;
  max-width: 402px;
  height: var(--app-viewport-height);
  margin: 0 auto;
  padding: 58px 0 40px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--Background-Base);
  color: var(--Text-Primary);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

const Toolbar = styled.header`
  position: relative;
  width: 354px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`

const BackButton = styled.button`
  position: absolute;
  top: 0;
  left: -14px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 9px;
    height: 16px;
    display: block;
  }
`

const AddNearbyButton = styled.button`
  height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-button);
  cursor: default;
`

const Heading = styled.div`
  width: 354px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Title = styled.h1`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
`

const Meta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  white-space: nowrap;
`

const PhotoGroups = styled.div`
  width: 354px;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 30px;
`

const PhotoGroup = styled.section`
  width: 354px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const GroupHeading = styled.div`
  width: 354px;
  height: 18px;
  display: flex;
  align-items: center;
  gap: 11px;
`

const Time = styled.h2`
  width: 70px;
  flex: 0 0 auto;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const Rule = styled.span`
  height: 1px;
  flex: 1;
  background: var(--Border-Default);
`

const Count = styled.span`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-label);
  white-space: nowrap;
`

const PhotoStrip = styled.div`
  width: calc(100vw - 24px);
  max-width: 378px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  touch-action: pan-x;

  &::-webkit-scrollbar {
    display: none;
  }

`

const PhotoTile = styled(Tile)`
  width: 111.333px;
  height: 124px;
  flex: 0 0 auto;
  scroll-snap-align: start;
  scroll-snap-stop: always;
`
