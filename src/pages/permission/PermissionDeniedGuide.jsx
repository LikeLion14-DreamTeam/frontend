import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import PermissionStatusCard from '../../components/common/PermissionStatusCard'
import { permissionStatusCardItems } from '../../components/common/PermissionStatusCard.constants'
import Header from '../../components/layout/Header'

const Permission = () => {
  const navigate = useNavigate()

  return (
    <>
      <Header to="/permission" />

      <PermissionWrapper>
        <Body>
          <Head>
            <Title>지금은 기록을 만들 수 없어요</Title>
            <Description>
              일부 기능을 사용하려면 다음 권한이 필요합니다.
            </Description>
          </Head>

          <PermissionList>
            {permissionStatusCardItems.map(({ key, ...item }) => (
              <PermissionStatusCard key={key} {...item} disabled />
            ))}
          </PermissionList>

          <PermissionDeniedActionCard>
            <PermissionDeniedActionTitle>
              권한 없이도 할 수 있는 것
            </PermissionDeniedActionTitle>
            <PermissionDeniedAction>지난 여정과 포토북 열람</PermissionDeniedAction>
            <PermissionDeniedAction>저장된 핀의 사진·메모 보기</PermissionDeniedAction>
          </PermissionDeniedActionCard>
        </Body>

        <Footer>
          <ActionArea>
            <StartButton
              type="button"
              onClick={() =>
                navigate('/onboarding/preference-start', { replace: true })
              }
            >
              시작하기
            </StartButton>
            <LaterButton
              type="button"
              $variant="ghost"
              onClick={() =>
                navigate('/onboarding/preference-start', { replace: true })
              }
            >
              이대로 둘러보기
            </LaterButton>
          </ActionArea>
        </Footer>
      </PermissionWrapper>
    </>
  )
}

export default Permission

const PermissionWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: calc(
    var(--app-viewport-height) - 116px + var(--design-safe-top)
  );
  margin: 0 auto;
  padding: 26px 24px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 44px;
`

const Body = styled.section`
  display: flex;
  flex-direction: column;
  gap: 33px;
`

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h2`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  word-break: keep-all;
`

const Description = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
`

const PermissionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PermissionDeniedActionCard = styled(Card).attrs({ as: 'aside' })`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 13px 20px;
  border: 1px solid var(--Border-Default);
  border-radius: 12px;
  background: var(--Surface-Base);
  overflow: hidden;
`

const PermissionDeniedActionTitle = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  word-break: keep-all;
`

const PermissionDeniedAction = styled.p`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: keep-all;

  &::before {
    content: '';
    width: 4px;
    height: 4px;
    flex: 0 0 4px;
    border-radius: 50%;
    background: var(--Secondary-Taupe);
  }
`

const PrivacyCard = styled.aside`
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 20px;
  border-radius: 12px;
  background: rgb(181 118 59 / 9%);
`

const PrivacyIcon = styled.img`
  width: 13.5px;
  height: 18.5px;
  flex: 0 0 auto;
  display: block;
`

const PrivacyText = styled.p`
  min-width: 0;
  flex: 1;
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const Footer = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`

const GuideButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--State-Disabled-Text);
  font: var(--text-ui-caption);
  text-decoration: underline;
  cursor: pointer;
`

const ActionArea = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`

const StartButton = styled(Button)`
  font: var(--text-ui-button);
`

const LaterButton = styled(Button)`
  font: var(--text-ui-button);
`
