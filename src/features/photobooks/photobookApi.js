import apiClient from '../../api/client'
import { ApiError } from '../../api/errors'
import { fetchAllPages } from '../../api/pagination'
import {
  getDemoPhotobook,
  getDemoPhotobookList,
  isDemoPhotobookId,
  refreshDemoPhotobookCover,
  updateDemoPhotobookName,
} from '../demo/demoJourneyData'
import {
  getMockPhotobook,
  getMockPhotobooks,
  refreshMockPhotobookCover,
  updateMockPhotobookName,
} from './photobookMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'
const PHOTOBOOKS_ENDPOINT = '/photobooks'

const demoNotFound = () =>
  new ApiError({
    status: 404,
    code: 'NOT_FOUND',
    message: '포토북을 찾을 수 없습니다.',
  })

const prependDemoItems = (items, demoItems, key) => {
  const demoKeys = new Set(demoItems.map((item) => String(item[key])))

  return [
    ...demoItems,
    ...(items ?? []).filter((item) => !demoKeys.has(String(item?.[key]))),
  ]
}

/**
 * API 명세 6.1: 포토북 목록을 마지막 커서 페이지까지 조회한다.
 * 인증 헤더와 비래핑 응답 처리는 공통 apiClient가 담당한다.
 */
export const getPhotobooks = async ({ limit = 20 } = {}) => {
  const response = await fetchAllPages(
    (cursor) =>
      USE_MOCK
        ? getMockPhotobooks({ cursor, limit })
        : apiClient.get(PHOTOBOOKS_ENDPOINT, {
            params: { cursor, limit },
          }),
    'photobooks',
  )

  return {
    ...response,
    photobooks: prependDemoItems(
      response.photobooks,
      getDemoPhotobookList(),
      'photobook_id',
    ),
  }
}

/** API 명세 6.2: 포토북 상세와 도시별 핀 기록을 조회한다. */
export const getPhotobook = async (photobookId) => {
  const demoPhotobook = getDemoPhotobook(photobookId)
  if (demoPhotobook) return demoPhotobook
  if (isDemoPhotobookId(photobookId)) throw demoNotFound()

  if (USE_MOCK) {
    return getMockPhotobook(photobookId)
  }

  return apiClient.get(
    `${PHOTOBOOKS_ENDPOINT}/${encodeURIComponent(photobookId)}`,
  )
}

/** API 명세 6.3: 연결된 여정과 무관하게 포토북 이름만 수정한다. */
export const updatePhotobookName = async (photobookId, name) => {
  if (isDemoPhotobookId(photobookId)) {
    const updated = updateDemoPhotobookName(photobookId, name)
    if (!updated) throw demoNotFound()
    return updated
  }

  if (USE_MOCK) {
    return updateMockPhotobookName(photobookId, name)
  }

  return apiClient.patch(
    `${PHOTOBOOKS_ENDPOINT}/${encodeURIComponent(photobookId)}`,
    { name },
  )
}

/** API 명세 6.4: 최신 취향 프로파일 기준으로 커버를 다시 선정한다. */
export const refreshPhotobookCover = async (photobookId) => {
  if (isDemoPhotobookId(photobookId)) {
    const updated = refreshDemoPhotobookCover(photobookId)
    if (!updated) throw demoNotFound()
    return updated
  }

  if (USE_MOCK) {
    return refreshMockPhotobookCover(photobookId)
  }

  return apiClient.post(
    `${PHOTOBOOKS_ENDPOINT}/${encodeURIComponent(photobookId)}/cover/refresh`,
  )
}
