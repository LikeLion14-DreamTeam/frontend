import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import PermissionStatusCard from '../../components/common/PermissionStatusCard'
import { permissionStatusCardItems } from '../../components/common/PermissionStatusCard.constants'
import Header from '../../components/layout/Header'
import { updateMyAccount } from '../../features/auth/authApi'
import { getAuthenticatedEntryPath } from '../../features/auth/authRoutes'
import useAuthStore from '../../features/auth/useAuthStore'
import {
  DEVICE_PERMISSION_STATUS,
  detectMobileOS,
  getCurrentPermissionStatus,
  getNfcIntroStatus,
  rememberLocationGranted,
  requestDevicePermission,
} from '../../features/permissions/devicePermissions'
import { recordPermissionEvent } from '../../features/permissions/permissionApi'
import privacyLockIcon from '../../assets/icons/privacy-lock.svg'

const REQUEST_PERMISSION_TYPES = ['camera', 'location']

/**
 * 위치는 없으면 서비스가 성립하지 않는다. 핀·지도·여정이 모두 좌표 위에 선다.
 * 그래서 허용 전에는 다음 화면으로 보내지 않고, 건너뛰기도 막는다.
 */
const REQUIRED_PERMISSION_TYPE = 'location'

/** 실패 사유에 따라 무엇을 해야 하는지 다르게 안내한다. */
const getRequiredPermissionMessage = (status) => {
  if (status === DEVICE_PERMISSION_STATUS.DENIED) {
    return '위치 권한을 허용해야 시작할 수 있어요. 브라우저 설정에서 이 사이트의 위치 접근을 허용한 뒤 다시 시도해 주세요.'
  }

  // 권한은 막히지 않았는데 값을 못 받은 경우다. 기기·OS 설정 쪽을 짚어준다.
  return '위치를 확인하지 못했어요. 기기의 위치 서비스가 켜져 있는지 확인한 뒤 다시 시도해 주세요. (Mac 은 시스템 설정 → 개인정보 보호 및 보안 → 위치 서비스에서 브라우저를 켜야 합니다)'
}

const getBadgeLabel = (permissionType, status) => {
  if (status === DEVICE_PERMISSION_STATUS.CHECKING) {
    return '확인 중'
  }

  if (status === DEVICE_PERMISSION_STATUS.GRANTED) {
    return permissionType === 'nfc' ? '안내됨' : '허용됨'
  }

  if (status === DEVICE_PERMISSION_STATUS.DENIED) {
    return '거부됨'
  }

  if (status === DEVICE_PERMISSION_STATUS.UNSUPPORTED) {
    return '미지원'
  }

  return undefined
}

const Permission = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [mobileOS] = useState(detectMobileOS)
  const [permissionStatuses, setPermissionStatuses] = useState(() => ({
    nfc: getNfcIntroStatus(mobileOS),
    camera: DEVICE_PERMISSION_STATUS.IDLE,
    location: DEVICE_PERMISSION_STATUS.IDLE,
  }))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const visiblePermissionItems = permissionStatusCardItems.filter(
    ({ key }) => key !== 'nfc' || mobileOS !== 'ios',
  )

  useEffect(() => {
    let ignore = false

    const loadCurrentPermissionStatuses = async () => {
      const permissionEntries = await Promise.all(
        REQUEST_PERMISSION_TYPES.map(async (permissionType) => [
          permissionType,
          await getCurrentPermissionStatus(permissionType),
        ]),
      )

      if (!ignore) {
        setPermissionStatuses((currentStatuses) => ({
          ...currentStatuses,
          ...Object.fromEntries(permissionEntries),
        }))
      }
    }

    loadCurrentPermissionStatuses()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const nfcStatus = getNfcIntroStatus(mobileOS)

    if (!mobileOS || !nfcStatus) {
      return
    }

    // NFC는 OS 권한 요청 대상이 아니므로 Android 안내 노출만 기록한다.
    void recordPermissionEvent({
      permission_type: 'nfc',
      status: nfcStatus,
      os: mobileOS,
    }).catch(() => {})
  }, [mobileOS])

  const completePermissionIntro = async () => {
    const updatedAccount = await updateMyAccount({
      onboarding_completed: user?.onboarding_completed ?? false,
      permission_intro_shown: true,
    })
    const updatedUser = { ...(user ?? {}), ...updatedAccount }

    setUser(updatedUser)

    return updatedUser
  }

  const handleStart = async () => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const nextStatuses = { ...permissionStatuses }

      for (const permissionType of REQUEST_PERMISSION_TYPES) {
        setPermissionStatuses((currentStatuses) => ({
          ...currentStatuses,
          [permissionType]: DEVICE_PERMISSION_STATUS.CHECKING,
        }))

        const status = await requestDevicePermission(permissionType)

        nextStatuses[permissionType] = status
        setPermissionStatuses((currentStatuses) => ({
          ...currentStatuses,
          [permissionType]: status,
        }))
      }

      if (mobileOS) {
        await Promise.all(
          REQUEST_PERMISSION_TYPES.map((permissionType) =>
            recordPermissionEvent({
              permission_type: permissionType,
              status: nextStatuses[permissionType],
              os: mobileOS,
            }),
          ),
        )
      }

      // 위치를 못 받았으면 여기서 멈춘다. 안내만 띄우고 다시 시도하게 둔다.
      const requiredStatus = nextStatuses[REQUIRED_PERMISSION_TYPE]

      if (requiredStatus !== DEVICE_PERMISSION_STATUS.GRANTED) {
        setErrorMessage(getRequiredPermissionMessage(requiredStatus))
        return
      }

      // Safari 는 나중에 권한 상태를 알려주지 않으므로 여기서 기기에 남겨둔다.
      rememberLocationGranted()

      const updatedUser = await completePermissionIntro()
      const unavailablePermissionKeys = visiblePermissionItems
        .map(({ key }) => key)
        .filter(
          (permissionType) =>
            nextStatuses[permissionType] === DEVICE_PERMISSION_STATUS.DENIED ||
            nextStatuses[permissionType] ===
              DEVICE_PERMISSION_STATUS.UNSUPPORTED,
        )

      const hasUnavailablePermission = unavailablePermissionKeys.length > 0

      if (hasUnavailablePermission) {
        navigate('/permission/denied-guide', {
          replace: true,
          state: {
            permissionStatuses: nextStatuses,
            visiblePermissionKeys: unavailablePermissionKeys,
          },
        })
        return
      }

      navigate(getAuthenticatedEntryPath(updatedUser), { replace: true })
    } catch (error) {
      setErrorMessage(
        error.message ??
          '권한 결과를 저장하지 못했습니다. 다시 시도해 주세요.',
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
            <Title>
              기록을 시작하려면 {visiblePermissionItems.length}가지가 필요해요
            </Title>
            <Description>
              여행 기록을 시작하려면 아래 권한이 필요합니다.
            </Description>
          </Head>

          <PermissionList>
            {visiblePermissionItems.map(({ key, ...item }) => {
              const status = permissionStatuses[key]
              const disabled =
                status === DEVICE_PERMISSION_STATUS.DENIED ||
                status === DEVICE_PERMISSION_STATUS.UNSUPPORTED

              return (
                <PermissionStatusCard
                  key={key}
                  {...item}
                  badgeLabel={getBadgeLabel(key, status)}
                  disabled={disabled}
                />
              )
            })}
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
            onClick={() =>
              navigate('/permission/denied-guide', {
                state: {
                  visiblePermissionKeys: visiblePermissionItems.map(
                    ({ key }) => key,
                  ),
                },
              })
            }
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
              onClick={handleStart}
            >
              {isSubmitting ? '권한 확인 중...' : '권한 허용하고 시작하기'}
            </StartButton>
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

