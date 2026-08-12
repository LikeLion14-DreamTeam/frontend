import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import preferenceBg from '../../assets/images/onboarding-preference-bg.png'
import preferencePhotos from '../../assets/images/onboarding-preference-photos.png'

const PreferenceStart = () => {
  const navigate = useNavigate()

  return (
    <Page>
      <Frame>
        <Body>
          <Head>
            <Title>이제 당신의 취향을 알아볼게요</Title>
            <Description>
              <span>짧은 질문을 통해 사진 취향을 설정해요</span>
              <span>답변은 사진 추천과 여행 기록 정리에 반영돼요</span>
            </Description>
          </Head>
        </Body>

        <PhotoStage aria-hidden="true">
          <PhotoImage src={preferencePhotos} alt="" />
        </PhotoStage>

        <Footer>
          <StartButton
            type="button"
            onClick={() => navigate('/onboarding/basic-question')}
          >
            시작하기
          </StartButton>
          <PrevButton
            type="button"
            $variant="ghost"
            onClick={() => navigate('/permission')}
          >
            이전으로
          </PrevButton>
        </Footer>
      </Frame>
    </Page>
  )
}

export default PreferenceStart

const Page = styled.div`
  min-height: 100vh;
  background: var(--Background-Base);
`

const Frame = styled.main`
  position: relative;
  width: 100%;
  max-width: 402px;
  min-height: 875px;
  margin: 0 auto;
  overflow: hidden;
  background:
    url(${preferenceBg}) center top / cover no-repeat,
    var(--Background-Base);
`

const Body = styled.section`
  position: absolute;
  top: 137px;
  left: 50%;
  width: calc(100% - 48px);
  transform: translateX(-50%);
`

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h1`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
  word-break: keep-all;
`

const Description = styled.p`
  display: flex;
  flex-direction: column;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  word-break: keep-all;
`

const PhotoStage = styled.div`
  position: absolute;
  top: 275px;
  left: -1px;
  width: calc(100% + 1px);
  height: 395px;
  overflow: hidden;
  pointer-events: none;
`

const PhotoImage = styled.img`
  position: absolute;
  top: -44.96%;
  left: 0;
  width: 100%;
  height: 181.15%;
  display: block;
  object-fit: fill;
`

const Footer = styled.section`
  position: absolute;
  left: 50%;
  bottom: 35px;
  width: calc(100% - 48px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transform: translateX(-50%);
`

const StartButton = styled(Button)`
  flex: 0 0 52px;
  font: var(--text-ui-button);
`

const PrevButton = styled(Button)`
  flex: 0 0 52px;
  font: var(--text-ui-button);
`
