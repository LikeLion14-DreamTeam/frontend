import apiClient from '../../api/client'
import { fetchAllPages } from '../../api/pagination'
import { getMockPhotobook, getMockPhotobooks } from './photobookMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'
const PHOTOBOOKS_ENDPOINT = '/photobooks'

/**
 * API 명세 6.1: 포토북 목록을 마지막 커서 페이지까지 조회한다.
 * 인증 헤더와 비래핑 응답 처리는 공통 apiClient가 담당한다.
 */
export const getPhotobooks = async ({ limit = 20 } = {}) =>
  fetchAllPages(
    (cursor) =>
      USE_MOCK
        ? getMockPhotobooks({ cursor, limit })
        : apiClient.get(PHOTOBOOKS_ENDPOINT, {
            params: { cursor, limit },
          }),
    'photobooks',
  )

/** API 명세 6.2: 포토북 상세와 도시별 핀 기록을 조회한다. */
export const getPhotobook = async (photobookId) => {
  if (USE_MOCK) {
    return getMockPhotobook(photobookId)
  }

  return apiClient.get(
    `${PHOTOBOOKS_ENDPOINT}/${encodeURIComponent(photobookId)}`,
  )
}
