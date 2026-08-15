import apiClient from '../../api/client'
import { ApiError } from '../../api/errors'
import { fetchAllPages } from '../../api/pagination'
import { mockPinStore } from '../pins/pinMock'
import {
  getMockPhotoCount,
  getMockPinLocation,
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

/**
 * mock 전용. 명세 0-1 에 따라 `segment_id` 가 null 인 핀 전체가 곧 진행 중인
 * 여행이다. 태깅 순으로 정렬해 돌려준다.
 */
const getMockOngoingPins = () =>
  Object.values(mockPinStore.pins)
    .filter((pin) => pin.segment_id === null)
    .sort((a, b) => new Date(a.tagged_at) - new Date(b.tagged_at))

/** mock 전용. 3.1 과 3.4 가 같은 형태를 돌려주므로 한 곳에서 만든다. */
const buildMockCurrentTrip = () => {
  const pins = getMockOngoingPins()

  if (pins.length === 0) {
    return {
      has_pins: false,
      pin_count: 0,
      photo_count: 0,
      voice_memo_count: 0,
      name: mockTripStore.currentTripName ?? '',
      started_at: null,
      cities: [],
    }
  }

  // 이름을 직접 지정하지 않았으면 방문 순서대로 이어 붙인 도시명이 기본값이다.
  const citiesInVisitOrder = [
    ...new Set(
      pins.map((pin) => getMockPinLocation(pin.pin_id)?.city).filter(Boolean),
    ),
  ]

  return {
    has_pins: true,
    pin_count: pins.length,
    photo_count: pins.reduce(
      (total, pin) => total + (mockPinStore.photos[pin.pin_id]?.length ?? 0),
      0,
    ),
    voice_memo_count: pins.filter((pin) => mockPinStore.voiceMemos[pin.pin_id])
      .length,
    name: mockTripStore.currentTripName ?? citiesInVisitOrder.join(', '),
    started_at: pins[0].tagged_at,
    cities: [...citiesInVisitOrder].sort((a, b) => a.localeCompare(b, 'ko')),
  }
}

/** 3.1 진행 중인 여행 요약 조회 */
export const getCurrentTrip = async () => {
  if (USE_MOCK) {
    return buildMockCurrentTrip()
  }

  return apiClient.get('/trips/current')
}

/**
 * 3.4 진행 중인 여행 이름 수정
 *
 * 지정한 이름은 3.1 조회 시 자동 생성 이름 대신 우선 반환되고, 3.2 로 여행을
 * 종료할 때 `name` 을 따로 주지 않으면 그대로 최종 이름이 된다.
 * 응답은 3.1 과 같은 형태다.
 */
export const updateCurrentTripName = async (name) => {
  if (USE_MOCK) {
    mockTripStore.currentTripName = name

    return buildMockCurrentTrip()
  }

  return apiClient.patch('/trips/current', { name })
}

/**
 * 3.2 여행 종료(여정 생성)
 *
 * `segment_id` 가 null 인 핀 전체를 모아 새 구간을 만들고 배정한다.
 * `name` 과 `endAt` 은 둘 다 생략할 수 있고, 그때는 서버가 각각 3.4 로 지정한
 * 이름(없으면 도시명 나열)과 마지막 핀 시각으로 채운다.
 */
export const endCurrentTrip = async ({ name, endAt } = {}) => {
  if (USE_MOCK) {
    const pins = getMockOngoingPins()

    if (pins.length === 0) {
      throw new ApiError({
        status: 409,
        code: 'EMPTY_TRIP',
        message: '아직 저장된 핀이 없어 여정을 만들 수 없습니다.',
      })
    }

    const startAt = pins[0].tagged_at
    const resolvedEndAt = endAt ?? pins.at(-1).tagged_at

    // end_at 을 직접 준 경우 그 이후 태깅된 핀은 이 여정에서 자동 제외한다.
    const isIncluded = (pin) =>
      new Date(pin.tagged_at) <= new Date(resolvedEndAt)

    if (!pins.some(isIncluded)) {
      throw new ApiError({
        status: 409,
        code: 'EMPTY_TRIP',
        message: '종료일이 너무 일러 포함되는 핀이 없습니다.',
      })
    }

    const segmentId =
      Math.max(...Object.keys(mockTripStore.trips).map(Number), 0) + 1

    const locations = pins
      .filter(isIncluded)
      .map((pin) => getMockPinLocation(pin.pin_id))
      .filter(Boolean)

    const cities = [...new Set(locations.map((place) => place.city))]

    // 4.1 은 나라별로 도시를 묶어 준다.
    const countries = [
      ...new Map(
        locations.map((place) => [place.country_code, place.country_name]),
      ),
    ].map(([countryCode, countryName]) => ({
      country_name: countryName,
      cities: [
        ...new Set(
          locations
            .filter((place) => place.country_code === countryCode)
            .map((place) => place.city),
        ),
      ],
    }))

    mockTripStore.trips[segmentId] = {
      segment_id: segmentId,
      user_id: 1,
      name: name || mockTripStore.currentTripName || cities.join(', '),
      start_at: startAt,
      end_at: resolvedEndAt,
      status: true,
      countries,
    }

    mockTripStore.pins[segmentId] = pins.map((pin) => ({
      pin_id: pin.pin_id,
      place_name: pin.place_name,
      latitude: pin.latitude,
      longitude: pin.longitude,
      tagged_at: pin.tagged_at,
      included_in_segment: isIncluded(pin),
    }))

    // 핀 쪽 상태도 같이 옮겨야 5.3 삭제 제한과 지도 필터가 맞는다.
    pins.forEach((pin) => {
      pin.segment_id = segmentId
    })

    // 진행 중인 여행이 사라졌으니 3.4 로 지어둔 이름도 비운다.
    mockTripStore.currentTripName = null

    return {
      segment_id: segmentId,
      user_id: 1,
      name: mockTripStore.trips[segmentId].name,
      start_at: startAt,
      end_at: resolvedEndAt,
      status: true,
      pin_count: pins.filter(isIncluded).length,
      photobook_id: 30 + segmentId,
    }
  }

  return apiClient.post('/trips', { name, end_at: endAt })
}

/**
 * 3.3 국가별 방문 도장 목록
 *
 * `country_code` 는 ISO 3166-1 alpha-2 문자열로 가정한다. 명세에는 아직 숫자(82)
 * 로 적혀 있지만 그 값은 전화 국가번호라 도장 파일명으로 쓸 수 없어, 8.2 에
 * 프론트가 보내는 값과 같은 alpha-2 로 맞추기로 했다.
 */
export const getCountryStamps = async () => {
  if (USE_MOCK) {
    // 방문한 나라는 핀의 위치에서 중복 없이 모은다.
    const stamps = [
      ...new Map(
        Object.values(mockPinStore.pins)
          .map((pin) => getMockPinLocation(pin.pin_id))
          .filter(Boolean)
          .map((place) => [
            place.country_code,
            {
              country_code: place.country_code,
              country_name: place.country_name,
            },
          ]),
      ).values(),
    ]

    return { stamps }
  }

  return apiClient.get('/users/me/country-stamps')
}

/** 4.1 여행 구간 목록 조회. 마지막 페이지까지 이어 받는다. */
export const getTrips = async ({ limit = 20 } = {}) => {
  if (USE_MOCK) {
    return {
      trips: Object.values(mockTripStore.trips).map(
        ({ segment_id, name, start_at, end_at, countries }) => ({
          segment_id,
          name,
          start_at,
          end_at,
          countries,
        }),
      ),
      next_cursor: null,
    }
  }

  return fetchAllPages(
    (cursor) => apiClient.get('/trips', { params: { cursor, limit } }),
    'trips',
  )
}

/** 4.2 여행 구간 상세(요약) 조회 */
export const getTrip = async (segmentId) => {
  if (USE_MOCK) {
    return buildMockTripSummary(segmentId)
  }

  return apiClient.get(`/trips/${segmentId}`)
}

/**
 * 4.3 여행 구간 수정 (이름, 기간, 포함 핀 제외/재포함)
 *
 * `pinInclusions` 는 `[{ pin_id, included_in_segment }]` 형태로, 제외(false)와
 * 재포함(true) 양쪽 다 보낼 수 있다.
 */
export const updateTrip = async (
  segmentId,
  { name, startAt, endAt, pinInclusions },
) => {
  if (USE_MOCK) {
    const trip = mockTripStore.trips[segmentId]
    if (!trip) throw mockNotFound()

    trip.name = name
    if (startAt) trip.start_at = startAt
    if (endAt) trip.end_at = endAt

    const pins = mockTripStore.pins[segmentId] ?? []
    pinInclusions.forEach(({ pin_id, included_in_segment }) => {
      const target = pins.find((pin) => pin.pin_id === pin_id)
      if (target) target.included_in_segment = included_in_segment
    })

    return buildMockTripSummary(segmentId)
  }

  return apiClient.patch(`/trips/${segmentId}`, {
    name,
    start_at: startAt,
    end_at: endAt,
    pin_exclusions: pinInclusions,
  })
}

/**
 * 4.5 구간 내 핀 목록 조회. 마지막 페이지까지 이어 받는다.
 * 제외된 핀도 included_in_segment: false 로 함께 온다.
 */
export const getTripPins = async (segmentId, { limit = 20 } = {}) => {
  if (USE_MOCK) {
    if (!mockTripStore.trips[segmentId]) throw mockNotFound()

    return {
      pins: (mockTripStore.pins[segmentId] ?? []).map((pin) => ({
        ...pin,
        photo_count: getMockPhotoCount(pin.pin_id),
      })),
      next_cursor: null,
    }
  }

  return fetchAllPages(
    (cursor) =>
      apiClient.get(`/trips/${segmentId}/pins`, { params: { cursor, limit } }),
    'pins',
  )
}
