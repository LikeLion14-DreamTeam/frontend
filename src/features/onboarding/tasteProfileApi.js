import apiClient from '../../api/client'
import { recordMockApiCall } from './onboardingDebug'
import {
  getMockTasteProfileAxes,
  markMockTasteProfileLearned,
  updateMockTasteProfileAxis,
} from './tasteProfileMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'
const TASTE_PROFILE_AXES_ENDPOINT = '/users/me/taste-profile/axes'

const getValidIsoString = (value) =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? value
    : null

const getLatestIsoString = (dates) =>
  dates
    .map(getValidIsoString)
    .filter(Boolean)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null

const getTasteProfileLastUpdatedAt = (tasteProfile) =>
  getLatestIsoString([
    tasteProfile?.last_updated_at,
    tasteProfile?.lastUpdatedAt,
    tasteProfile?.learned_at,
    tasteProfile?.learnedAt,
    tasteProfile?.updated_at,
    tasteProfile?.updatedAt,
    tasteProfile?.completed_at,
    tasteProfile?.completedAt,
    ...(Array.isArray(tasteProfile?.axes)
      ? tasteProfile.axes.flatMap((axis) => [
          axis?.last_updated_at,
          axis?.lastUpdatedAt,
          axis?.updated_at,
          axis?.updatedAt,
          axis?.learned_at,
          axis?.learnedAt,
        ])
      : []),
  ])

const normalizeTasteProfileAxesResponse = (tasteProfile) => {
  const axes = Array.isArray(tasteProfile)
    ? tasteProfile
    : Array.isArray(tasteProfile?.axes)
      ? tasteProfile.axes
      : []

  return {
    ...(Array.isArray(tasteProfile) ? {} : tasteProfile),
    axes,
    last_updated_at: getTasteProfileLastUpdatedAt(tasteProfile),
  }
}

/** API 명세 2.4: 인증된 사용자의 취향 축 목록을 조회한다. */
export const getTasteProfileAxes = async () => {
  if (USE_MOCK) {
    const tasteProfileAxes = normalizeTasteProfileAxesResponse(
      getMockTasteProfileAxes(),
    )
    recordMockApiCall({
      method: 'GET',
      endpoint: TASTE_PROFILE_AXES_ENDPOINT,
      response: tasteProfileAxes,
    })
    return tasteProfileAxes
  }

  const tasteProfileAxes = await apiClient.get(TASTE_PROFILE_AXES_ENDPOINT)

  return normalizeTasteProfileAxesResponse(tasteProfileAxes)
}

/** 목 환경에서 온보딩 완료에 따른 학습 시간 갱신을 재현한다. */
export const markTasteProfileLearned = async () => {
  if (!USE_MOCK) return null

  const tasteProfileAxes = normalizeTasteProfileAxesResponse(
    markMockTasteProfileLearned(),
  )

  recordMockApiCall({
    method: 'POST',
    endpoint: `${TASTE_PROFILE_AXES_ENDPOINT}/learned-at`,
    payload: null,
    response: tasteProfileAxes,
  })

  return tasteProfileAxes
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
