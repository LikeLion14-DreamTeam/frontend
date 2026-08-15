import apiClient from '../../api/client'
import { ApiError } from '../../api/errors'
import {
  getMockPhotoCount,
  getMockVoiceMemoCount,
  mockTripStore,
} from './tripMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

/**
 * 여행 구간 API (명세서 4번)
 *
 * 전부 여행 종료 이후(TRAVEL_SEGMENT 가 존재하는) 상태에서만 동작한다.
 * 진행 중인 여정은 대상 세그먼트 자체가 없어 호출할 수 없다.
 */

const mockNotFound = () =>
  new ApiError({
    status: 404,
    code: 'NOT_FOUND',
    message: '여행 구간을 찾을 수 없습니다.',
  })

/** mock 전용. 수록된 핀을 기준으로 구간 요약을 계산한다. */
const buildMockTripSummary = (segmentId) => {
  const trip = mockTripStore.trips[segmentId]
  if (!trip) throw mockNotFound()

  const includedPins = (mockTripStore.pins[segmentId] ?? []).filter(
    (pin) => pin.included_in_segment,
  )

  return {
    ...trip,
    pin_count: includedPins.length,
    photo_count: includedPins.reduce(
      (total, pin) => total + getMockPhotoCount(pin.pin_id),
      0,
    ),
    voice_memo_count: includedPins.reduce(
      (total, pin) => total + getMockVoiceMemoCount(pin.pin_id),
      0,
    ),
  }
}

/** 4.1 여행 구간 목록 조회 */
export const getTrips = async ({ cursor = null, limit = 20 } = {}) => {
  if (USE_MOCK) {
    return {
      trips: Object.values(mockTripStore.trips).map(
        ({ segment_id, name, start_at, end_at }) => ({
          segment_id,
          name,
          start_at,
          end_at,
        }),
      ),
      next_cursor: null,
    }
  }

  return apiClient.get('/trips', { params: { cursor, limit } })
}

/** 4.2 여행 구간 상세(요약) 조회 */
export const getTrip = async (segmentId) => {
  if (USE_MOCK) {
    return buildMockTripSummary(segmentId)
  }

  return apiClient.get(`/trips/${segmentId}`)
}

/**
 * 4.3 여행 구간 수정 (이름, 포함 핀 제외/재포함)
 *
 * `pinInclusions` 는 `[{ pin_id, included_in_segment }]` 형태로, 제외(false)와
 * 재포함(true) 양쪽 다 보낼 수 있다.
 *
 * TODO: 기능명세 4.2 의 기간(시작일·종료일) 수정은 이 API 로 보낼 수 없다.
 * Body 에 start_at / end_at 이 없어 백엔드에 추가 요청이 필요하다.
 */
export const updateTrip = async (segmentId, { name, pinInclusions }) => {
  if (USE_MOCK) {
    const trip = mockTripStore.trips[segmentId]
    if (!trip) throw mockNotFound()

    trip.name = name

    const pins = mockTripStore.pins[segmentId] ?? []
    pinInclusions.forEach(({ pin_id, included_in_segment }) => {
      const target = pins.find((pin) => pin.pin_id === pin_id)
      if (target) target.included_in_segment = included_in_segment
    })

    return buildMockTripSummary(segmentId)
  }

  return apiClient.patch(`/trips/${segmentId}`, {
    name,
    pin_exclusions: pinInclusions,
  })
}

/**
 * 4.4 여행 구간 삭제
 *
 * 구간에 속한 핀·사진·음성메모와 포토북까지 함께 삭제된다(DB cascade).
 * 되돌릴 수 없으므로 호출 전에 반드시 사용자 확인을 받는다.
 * 204 No Content 라 반환값이 없다.
 */
export const deleteTrip = async (segmentId) => {
  if (USE_MOCK) {
    if (!mockTripStore.trips[segmentId]) throw mockNotFound()

    delete mockTripStore.trips[segmentId]
    delete mockTripStore.pins[segmentId]

    return null
  }

  return apiClient.delete(`/trips/${segmentId}`)
}

/** 4.5 구간 내 핀 목록 조회. 제외된 핀도 included_in_segment: false 로 함께 온다. */
export const getTripPins = async (
  segmentId,
  { cursor = null, limit = 20 } = {},
) => {
  if (USE_MOCK) {
    if (!mockTripStore.trips[segmentId]) throw mockNotFound()

    return {
      pins: mockTripStore.pins[segmentId] ?? [],
      next_cursor: null,
    }
  }

  return apiClient.get(`/trips/${segmentId}/pins`, {
    params: { cursor, limit },
  })
}
