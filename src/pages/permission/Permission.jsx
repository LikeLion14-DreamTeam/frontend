import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import PermissionStatusCard from '../../components/common/PermissionStatusCard'
import { permissionStatusCardItems } from '../../components/common/PermissionStatusCard.constants'
import Header from '../../components/layout/Header'
import { updateMyAccount } from '../../features/auth/authApi'
import { getAuthenticatedEntryPath } from '../../features/auth/authRoutes'
import useAuthStore from '../../features/auth/useAuthStore'
import privacyLockIcon from '../../assets/icons/privacy-lock.svg'

const Permission = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleContinue = async () => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const updatedAccount = await updateMyAccount({
        onboarding_completed: user?.onboarding_completed ?? false,
        permission_intro_shown: true,
      })
      const updatedUser = { ...(user ?? {}), ...updatedAccount }

      setUser(updatedUser)
      navigate(getAuthenticatedEntryPath(updatedUser), { replace: true })
    } catch (error) {
      setErrorMessage(
        error.message ??
          '권한 안내 확인 상태를 저장하지 못했습니다. 다시 시도해 주세요.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />

      <PermissionWrapper>
        <Body>
          <Head>
            <Title>기록을 시작하려면 3가지가 필요해요</Title>
            <Description>
              여행 기록을 시작하려면 아래 권한이 필요합니다.
            </Description>
          </Head>

          <PermissionList>
            {permissionStatusCardItems.map(({ key, ...item }) => (
              <PermissionStatusCard key={key} {...item} />
            ))}
          </PermissionList>

          <PrivacyCard>
            <PrivacyIcon src={privacyLockIcon} alt="" aria-hidden="true" />
            <PrivacyText>
              태깅하지 않은 사진과 위치는 어디에도 저장되지 않아요
            </PrivacyText>
          </PrivacyCard>
        </Body>

        <Footer>
          <GuideButton
            type="button"
            disabled={isSubmitting}
            onClick={() => navigate('/permission/denied-guide')}
          >
            권한을 허용하지 않으면 어떻게 되나요?
          </GuideButton>

          {errorMessage && (
            <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
          )}

          <ActionArea>
            <StartButton
              type="button"
              disabled={isSubmitting}
              onClick={handleContinue}
            >
              {isSubmitting ? '저장 중...' : '시작하기'}
            </StartButton>
            <LaterButton
              type="button"
              $variant="ghost"
              disabled={isSubmitting}
              onClick={handleContinue}
            >
              나중에 설정하기
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

const ErrorMessage = styled.p`
  color: #b42318;
  font: var(--text-ui-caption);
  text-align: center;
  word-break: keep-all;
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
