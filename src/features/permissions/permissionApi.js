import apiClient from '../../api/client'
import { recordMockPermissionEvent } from './permissionMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

/** API 명세 1.5: 기기 권한 결과 또는 NFC 안내 노출을 기록한다. */
export const recordPermissionEvent = async ({
  permission_type,
  status,
  os,
}) => {
  const permissionEvent = {
    permission_type,
    status,
    os,
  }

  if (USE_MOCK) {
    return recordMockPermissionEvent(permissionEvent)
  }

  return apiClient.post('/events/permissions', permissionEvent)
}
