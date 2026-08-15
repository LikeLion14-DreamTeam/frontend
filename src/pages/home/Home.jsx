import styled from 'styled-components'
import NavBar from '../../components/layout/NavBar'
import journeyCardImage from '../../assets/home/journey-card.png'
import passportOpenImage from '../../assets/home/passport-open.png'

/**
 * 진행 중인 여정 블록의 시안 값(폭 362px 기준)을 컨테이너 단위로 바꾼다.
 * 띠·카드·글자·버튼이 화면 폭을 따라 같은 비율로 커지고 줄어든다.
 */
const journeyScale = (px) => `${((px / 362) * 100).toFixed(4)}cqw`

/**
 * 3 홈 화면
 *
 * TODO: 아직 시안 값을 그대로 넣어둔 상태다. 진행 중인 여정은 3.1 GET /trips/current,
 * 여권 요약은 마이페이지 통계 API 로 채운다.
 * TODO: 여권은 펼쳐진 상태만 구현했다. 덮인 상태(passport-closed.png)에서 펼쳐지는
 * 애니메이션과 스탬프(assets/stamps) 배치는 다음 작업이다.
 */
const Home = () => {
  return (
    <Page>
      <Brand>
        <BrandRow>
          <BrandName>Orte</BrandName>
          <BrandTag>TRAVEL ARCHIVE</BrandTag>
        </BrandRow>
        <Hairline aria-hidden="true" />
      </Brand>

      <SectionLabel>
        <LabelTick aria-hidden="true" />
        진행 중인 여정
      </SectionLabel>

      <JourneyBlock>
        <JourneyBand>JOURNEY IN PROGRESS</JourneyBand>

        <JourneyCard>
          <JourneyImage src={journeyCardImage} alt="" aria-hidden="true" />

          <JourneyBody>
            <JourneyInfo>
              <CityName>PARIS</CityName>
              <JourneyDetails>
                <CountryName>FRANCE</CountryName>
                <JourneyMeta>
                  <MetaLine>2024.09.12 — 진행중</MetaLine>
                  <MetaLine>12 PIN ·138 PHOTO · 6 VOICE</MetaLine>
                </JourneyMeta>
              </JourneyDetails>
            </JourneyInfo>

            <JourneyActions>
              <EndJourneyButton type="button">여정 종료하기</EndJourneyButton>
              <ContinueJourneyButton type="button">
                여정 계속하기
              </ContinueJourneyButton>
            </JourneyActions>
          </JourneyBody>
        </JourneyCard>
      </JourneyBlock>

      <PassportBlock>
        <PassportHead>
          <SectionLabel>
            <LabelTick aria-hidden="true" />
            나의 여행 여권
          </SectionLabel>

          <ResultCard>
            <ResultTitle>기록은 계속 쌓이고 있어요</ResultTitle>
            <ResultDescription>
              지금까지 12개의 도시, 7개의 나라를 다녀왔어요.
            </ResultDescription>
          </ResultCard>
        </PassportHead>

        {/* TODO: 스탬프(assets/stamps)를 이 안에 얹는다. PassportSpread 가
            컨테이너라 journeyScale 처럼 시안 폭 376 기준 cqw 헬퍼를 만들어
            쓰면 면 크기를 따라간다. 시안 안쪽 여백은 위 40 · 좌 19 · 우 20 ·
            아래 52, 좌우 면 사이 간격은 17 이다. */}
        <PassportSpread>
          <PassportImage src={passportOpenImage} alt="" aria-hidden="true" />
        </PassportSpread>

        <PageDots aria-hidden="true">
          <Dot $active />
          <Dot />
          <Dot />
        </PageDots>
      </PassportBlock>

      <NavBar />
    </Page>
  )
}

export default Home

const Page = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: var(--app-viewport-height);
  margin: 0 auto;
  /* 시안의 y=58 은 이미 안전영역 아래라 그만큼 뺀다. */
  padding: calc(58px - var(--design-safe-top)) 24px 87px;
  overflow-x: hidden;
  background: #f5eee4;
`

const Brand = styled.header`
  width: 100%;
  display: flex;
  flex-direction: column;
`

const BrandRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  margin: 5px 0;
  justify-content: space-between;
`

const BrandName = styled.h1`
  color: var(--Text-Primary);
  font: 600 27px/34px var(--font-serif);
  letter-spacing: 0.54px;
`

const BrandTag = styled.p`
  color: var(--Accent-Gold);
  font: 400 9px/16px var(--font-sans);
  letter-spacing: 1.35px;
  text-align: right;
`

const Hairline = styled.div`
  width: 100%;
  height: 1px;
  background: rgb(222 211 198 / 85%);
`

const SectionLabel = styled.h2`
  display: flex;
  align-items: center;
  margin-top: 23px;
  gap: 8px;
  color: var(--Text-Secondary);
  font: 500 16px/19px var(--font-sans);
`

const LabelTick = styled.span`
  width: 2px;
  height: 15px;
  flex: 0 0 2px;
  background: #e4bc7f;
`

/* 시안에서 카드(좌 20)가 띠(좌 26)보다 넓어 본문 패딩 밖으로 4px 넘어간다. */
const JourneyBlock = styled.section`
  position: relative;
  margin: 15px -4px 0;
  /* 안쪽 cqw 값의 기준점 */
  container-type: inline-size;
`

/* 띠는 카드 뒤에 깔린다. 시안 350 × 77 비율을 폭이 달라져도 유지한다. */
const JourneyBand = styled.p`
  position: absolute;
  top: 0;
  right: ${journeyScale(6)};
  left: ${journeyScale(6)};
  aspect-ratio: 350 / 77;
  padding: ${journeyScale(10)} 0 0 ${journeyScale(17)};
  border-radius: ${journeyScale(16)};
  background: linear-gradient(
    167.07deg,
    rgb(69 50 36) 0%,
    rgb(49 35 26) 39.007%,
    rgb(34 24 16) 70.922%
  );
  box-shadow: 0 ${journeyScale(8)} ${journeyScale(20)} 0 rgb(36 26 18 / 30%);
  color: var(--Accent-Gold);
  font: 600 ${journeyScale(9)}/normal var(--font-serif);
  letter-spacing: ${journeyScale(1.8)};
`

/* 시안 362 × 203. 위쪽 27px 만큼 띠가 드러나고 나머지는 카드가 덮는다. */
const JourneyCard = styled.div`
  position: relative;
  aspect-ratio: 362 / 203;
  margin-top: ${journeyScale(27)};
  /* 카드 안쪽 값도 카드 폭을 따라가게 한다. */
  container-type: inline-size;
  border-radius: ${journeyScale(13)};
  /* 카드 이미지가 사각형이 아니라 filter 로 그림자를 준다. */
  filter: drop-shadow(
    0 ${journeyScale(4)} ${journeyScale(7)} rgb(48 38 28 / 11%)
  );
`

const JourneyImage = styled.img`
  position: absolute;
  top: -9.55%;
  left: -1.47%;
  width: 103.23%;
  height: 123.12%;
  max-width: none;
  /* 화면이 402 보다 넓어져도 늘어나지 않고 잘리게 한다. */
  object-fit: cover;
`

const JourneyBody = styled.div`
  position: relative;
  height: 100%;
  padding: ${journeyScale(27)} ${journeyScale(40)} ${journeyScale(16)}
    ${journeyScale(27)};
  display: flex;
  flex-direction: column;
  gap: ${journeyScale(18)};
  align-items: flex-start;
`

const JourneyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${journeyScale(3)};
  align-items: flex-start;
`

const CityName = styled.p`
  color: var(--Text-Primary);
  font: 600 ${journeyScale(35)}/${journeyScale(40)} var(--font-serif);
  letter-spacing: ${journeyScale(1.05)};
`

const JourneyDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${journeyScale(5)};
  align-items: flex-start;
`

const CountryName = styled.p`
  color: var(--Text-Secondary);
  font: 400 ${journeyScale(12)}/${journeyScale(18)} var(--font-sans);
`

const JourneyMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${journeyScale(3)};
`

const MetaLine = styled.p`
  color: var(--Text-Secondary);
  font: 400 ${journeyScale(12)}/${journeyScale(18)} var(--font-sans);
`

const JourneyActions = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${journeyScale(5)};
`

const EndJourneyButton = styled.button`
  width: ${journeyScale(91)};
  height: ${journeyScale(33)};
  border: 0;
  background: none;
  color: var(--State-Disabled-Text);
  font: 500 ${journeyScale(11)}/${journeyScale(16)} var(--font-sans);
  cursor: pointer;
`

const ContinueJourneyButton = styled.button`
  width: ${journeyScale(105)};
  height: ${journeyScale(33)};
  border: 0;
  border-radius: ${journeyScale(6)};
  background: var(--Primary-Cognac);
  box-shadow: var(--Effect-Chip);
  color: var(--Text-Inverse);
  font: 500 ${journeyScale(11)}/${journeyScale(16)} var(--font-sans);
  cursor: pointer;
`

/* 여권 면은 본문 폭(354)보다 넓은 376 이라 양쪽으로 11px 씩 넘어간다. */
const PassportBlock = styled.section`
  margin: 21px -11px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`

/* 여권 면이 본문보다 11px 씩 넓어, 머리말은 그만큼 도로 좁혀 본문에 맞춘다. */
const PassportHead = styled.div`
  width: calc(100% - 22px);
  display: flex;
  flex-direction: column;
  gap: 15px;
`

const ResultCard = styled.div`
  width: 100%;
  padding: 15px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
  border-radius: 14px;
  background: rgb(181 118 59 / 9%);
`

const ResultTitle = styled.p`
  color: var(--Text-Primary);
  font: 500 14px/normal var(--font-sans);
`

const ResultDescription = styled.p`
  color: rgb(129 116 104 / 90%);
  font: 400 11px/normal var(--font-sans);
`

/* 시안 376 × 261. 스탬프는 이 안에 passportScale 로 얹는다. */
const PassportSpread = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 376 / 261;
  overflow: hidden;
  container-type: inline-size;
`

const PassportImage = styled.img`
  position: absolute;
  top: -3.11%;
  left: -4.32%;
  width: 108.65%;
  height: 104.28%;
  object-fit: cover;
  max-width: none;
`

const PageDots = styled.div`
  height: 7px;
  display: flex;
  align-items: center;
  gap: 6px;
`

const Dot = styled.span`
  width: ${({ $active }) => ($active ? '7px' : '5px')};
  height: ${({ $active }) => ($active ? '7px' : '5px')};
  border-radius: 50%;
  background: ${({ $active }) =>
    $active ? 'var(--Primary-Cognac)' : 'rgb(181 161 140 / 45%)'};
`
