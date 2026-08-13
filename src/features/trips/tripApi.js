import apiClient from '../../api/client'
import { MOCK_TRIPS, MOCK_TRIP_DETAIL, MOCK_TRIP_PINS } from './tripMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

/**
 * 여행 구간 API (명세서 4번)
 *
 * 전부 여행 종료 이후(TRAVEL_SEGMENT 가 존재하는) 상태에서만 동작한다.
 * 진행 중인 여정은 대상 세그먼트 자체가 없어 호출할 수 없다.
 */

/** 4.1 여행 구간 목록 조회 */
export const getTrips = async ({ cursor = null, limit = 20 } = {}) => {
  if (USE_MOCK) {
    return MOCK_TRIPS
  }

  return apiClient.get('/trips', { params: { cursor, limit } })
}

/** 4.2 여행 구간 상세(요약) 조회 */
export const getTrip = async (segmentId) => {
  if (USE_MOCK) {
    return MOCK_TRIP_DETAIL
  }

  return apiClient.get(`/trips/${segmentId}`)
}

/** 4.5 구간 내 핀 목록 조회. 제외된 핀도 included_in_segment: false 로 함께 온다. */
export const getTripPins = async (
  segmentId,
  { cursor = null, limit = 20 } = {},
) => {
  if (USE_MOCK) {
    return MOCK_TRIP_PINS
  }

  return apiClient.get(`/trips/${segmentId}/pins`, {
    params: { cursor, limit },
  })
}
