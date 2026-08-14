import apiClient from '../../api/client'
import { recordMockApiCall } from './onboardingDebug'
import {
  getMockTasteProfileAxes,
  updateMockTasteProfileAxis,
} from './tasteProfileMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'
const TASTE_PROFILE_AXES_ENDPOINT = '/users/me/taste-profile/axes'

/** API 명세 2.4: 인증된 사용자의 취향 축 목록을 조회한다. */
export const getTasteProfileAxes = async () => {
  if (USE_MOCK) {
    const tasteProfileAxes = getMockTasteProfileAxes()
    recordMockApiCall({
      method: 'GET',
      endpoint: TASTE_PROFILE_AXES_ENDPOINT,
      response: tasteProfileAxes,
    })
    return tasteProfileAxes
  }

  return apiClient.get(TASTE_PROFILE_AXES_ENDPOINT)
}

/** API 명세 2.5: 취향 축 하나의 값을 수정한다. */
export const updateTasteProfileAxis = async ({ axisCode, value }) => {
  const endpoint = `${TASTE_PROFILE_AXES_ENDPOINT}/${encodeURIComponent(axisCode)}`
  const axisUpdate = { value }

  if (USE_MOCK) {
    const updatedAxis = updateMockTasteProfileAxis({ axisCode, value })
    recordMockApiCall({
      method: 'PUT',
      endpoint,
      payload: axisUpdate,
      response: updatedAxis,
    })
    return updatedAxis
  }

  return apiClient.put(endpoint, axisUpdate)
}
