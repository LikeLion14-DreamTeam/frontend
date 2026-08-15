import styled from 'styled-components'
import NavBar from '../../components/layout/NavBar'
import journeyCardImage from '../../assets/home/journey-card.png'
import passportOpenImage from '../../assets/home/passport-open.png'

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

        {/* TODO: 스탬프(assets/stamps)를 펼친 면 위에 얹는다. */}
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
  margin: 23px -4px 0;
`

const JourneyBand = styled.p`
  height: 77px;
  margin: 15px 6px 0;
  padding: 10px 0 0 17px;
  border-radius: 16px;
  background: linear-gradient(
    167.07deg,
    rgb(69 50 36) 0%,
    rgb(49 35 26) 39.007%,
    rgb(34 24 16) 70.922%
  );
  box-shadow: 0 8px 20px 0 rgb(36 26 18 / 30%);
  color: var(--Accent-Gold);
  font: 600 9px/normal var(--font-serif);
  letter-spacing: 1.8px;
`

/* 띠 위로 50px 올라타 위쪽 27px 만 JOURNEY IN PROGRESS 로 남는다. */
const JourneyCard = styled.div`
  position: relative;
  height: 203px;
  margin-top: -50px;
  border-radius: 13px;
  /* 카드 이미지가 사각형이 아니라 filter 로 그림자를 준다. */
  filter: drop-shadow(0 4px 7px rgb(48 38 28 / 11%));
`

const JourneyImage = styled.img`
  position: absolute;
  top: -9.55%;
  left: -1.47%;
  width: 103.23%;
  height: 123.12%;
  max-width: none;
`

const JourneyBody = styled.div`
  position: relative;
  height: 100%;
  padding: 27px 40px 16px 27px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: flex-start;
`

const JourneyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-start;
`

const CityName = styled.p`
  color: var(--Text-Primary);
  font: 600 35px/40px var(--font-serif);
  letter-spacing: 1.05px;
`

const JourneyDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-start;
`

const CountryName = styled.p`
  color: var(--Text-Secondary);
  font: 400 12px/18px var(--font-sans);
`

const JourneyMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const MetaLine = styled.p`
  color: var(--Text-Secondary);
  font: 400 12px/18px var(--font-sans);
`

const JourneyActions = styled.div`
  width: 295px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
`

const EndJourneyButton = styled.button`
  width: 91px;
  height: 33px;
  border: 0;
  background: none;
  color: var(--State-Disabled-Text);
  font: var(--text-ui-nav);
  cursor: pointer;
`

const ContinueJourneyButton = styled.button`
  width: 105px;
  height: 33px;
  border: 0;
  border-radius: 6px;
  background: var(--Primary-Cognac);
  box-shadow: var(--Effect-Chip);
  color: var(--Text-Inverse);
  font: var(--text-ui-nav);
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

const PassportHead = styled.div`
  width: 354px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

const PassportSpread = styled.div`
  position: relative;
  width: 376px;
  max-width: 100%;
  height: 261px;
  overflow: hidden;
`

const PassportImage = styled.img`
  position: absolute;
  top: -3.11%;
  left: -4.32%;
  width: 108.65%;
  height: 104.28%;
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
