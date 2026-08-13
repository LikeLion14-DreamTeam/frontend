import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import PermissionStatusCard from '../../components/common/PermissionStatusCard'
import { permissionStatusCardItems } from '../../components/common/PermissionStatusCard.constants'
import Header from '../../components/layout/Header'
import { updateMyAccount } from '../../features/auth/authApi'
import { getAuthenticatedEntryPath } from '../../features/auth/authRoutes'
import useAuthStore from '../../features/auth/useAuthStore'
import { DEVICE_PERMISSION_STATUS } from '../../features/permissions/devicePermissions'

const getDeniedGuideBadgeLabel = (permissionType, status) => {
  if (status === DEVICE_PERMISSION_STATUS.GRANTED) {
    return permissionType === 'nfc' ? '안내됨' : '허용됨'
  }

  if (status === DEVICE_PERMISSION_STATUS.UNSUPPORTED) {
    return '미지원'
  }

  return '꺼짐'
}

const Permission = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const visiblePermissionKeys =
    location.state?.visiblePermissionKeys ??
    permissionStatusCardItems.map(({ key }) => key)
  const permissionStatuses = location.state?.permissionStatuses

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
            {permissionStatusCardItems
              .filter(({ key }) => visiblePermissionKeys.includes(key))
              .map(({ key, ...item }) => {
                const status =
                  permissionStatuses?.[key] ?? DEVICE_PERMISSION_STATUS.DENIED
                const disabled = status !== DEVICE_PERMISSION_STATUS.GRANTED

                return (
                  <PermissionStatusCard
                    key={key}
                    {...item}
                    badgeLabel={getDeniedGuideBadgeLabel(key, status)}
                    disabled={disabled}
                  />
                )
              })}
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

const Footer = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
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
