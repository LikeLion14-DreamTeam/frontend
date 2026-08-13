import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import preferencePhotos from '../../assets/images/onboarding-preference-photos.webp'

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
  min-height: var(--app-viewport-height);
`

const Frame = styled.main`
  position: relative;
  width: 100%;
  max-width: 402px;
  height: var(--app-viewport-height);
  margin: 0 auto;
  padding: clamp(14px, calc(15.7vh - var(--design-safe-top)), 79px) 0
    max(20px, env(safe-area-inset-bottom));
  padding-top: clamp(
    14px,
    calc(15.7dvh - var(--design-safe-top)),
    79px
  );
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Body = styled.section`
  width: calc(100% - 48px);
  margin: 0 auto;
  flex: 0 0 auto;
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
  width: calc(100% + 1px);
  height: clamp(220px, 45vh, 395px);
  height: clamp(220px, 45dvh, 395px);
  min-height: 180px;
  margin-top: clamp(12px, 5vh, 44px);
  margin-top: clamp(12px, 5dvh, 44px);
  margin-left: -1px;
  flex: 0 1 auto;
  pointer-events: none;
`

const PhotoImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: fill;
`

const Footer = styled.section`
  width: calc(100% - 48px);
  margin: auto auto 0;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`

const StartButton = styled(Button)`
  flex: 0 0 52px;
  font: var(--text-ui-button);
`

const PrevButton = styled(Button)`
  flex: 0 0 52px;
  font: var(--text-ui-button);
`
