import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import PermissionStatusCard from '../../components/common/PermissionStatusCard'
import { permissionStatusCardItems } from '../../components/common/PermissionStatusCard.constants'
import Header from '../../components/layout/Header'
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
  const location = useLocation()
  const visiblePermissionKeys =
    location.state?.visiblePermissionKeys ??
    permissionStatusCardItems.map(({ key }) => key)
  const permissionStatuses = location.state?.permissionStatuses

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
        </Body>
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

