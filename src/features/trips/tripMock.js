/**
 * 여행 구간 mock 데이터.
 *
 * 백엔드 완성 전까지 `VITE_USE_MOCK_API=true` 상태에서 `tripApi` 가 이 값을 반환한다.
 * 응답 형태는 API 명세서 4.1 / 4.2 / 4.5 와 동일하게 맞춘다.
 */

/** 4.1 GET /trips */
export const MOCK_TRIPS = {
  trips: [
    {
      segment_id: 12,
      name: '파리 · 베르사유',
      start_at: '2024-11-03T01:24:00.000000Z',
      end_at: '2024-11-10T09:12:00.000000Z',
    },
    {
      segment_id: 11,
      name: '도쿄, 요코하마',
      start_at: '2024-08-01T00:00:00.000000Z',
      end_at: '2024-08-03T15:00:00.000000Z',
    },
  ],
  next_cursor: null,
}

/** 4.2 GET /trips/{segmentId} */
export const MOCK_TRIP_DETAIL = {
  segment_id: 12,
  user_id: 1,
  name: '파리 · 베르사유',
  start_at: '2024-11-03T01:24:00.000000Z',
  end_at: '2024-11-10T09:12:00.000000Z',
  status: true,
  pin_count: 4,
  photo_count: 32,
}

/**
 * 4.5 GET /trips/{segmentId}/pins
 *
 * TODO: 백엔드에 핀별 photo_count 추가 요청해둔 상태. 반영되면 각 핀에 넣고
 * TripManagement 의 핀 목록에서 `사진 N장` 을 표시한다.
 */
export const MOCK_TRIP_PINS = {
  pins: [
    {
      pin_id: 101,
      place_name: '파리 에펠탑 근처',
      latitude: 48.8584,
      longitude: 2.2945,
      tagged_at: '2024-11-03T01:24:00.000000Z',
      included_in_segment: true,
    },
    {
      pin_id: 102,
      place_name: '루브르 박물관 앞',
      latitude: 48.8606,
      longitude: 2.3376,
      tagged_at: '2024-11-04T05:11:00.000000Z',
      included_in_segment: true,
    },
    {
      pin_id: 103,
      place_name: '몽마르트르 언덕',
      latitude: 48.8867,
      longitude: 2.3431,
      tagged_at: '2024-11-05T02:05:00.000000Z',
      included_in_segment: false,
    },
    {
      // 위치 권한을 거부한 상태에서 저장된 핀 (좌표 없음)
      pin_id: 104,
      place_name: '',
      latitude: null,
      longitude: null,
      tagged_at: '2024-11-06T07:40:00.000000Z',
      included_in_segment: true,
    },
    {
      pin_id: 105,
      place_name: '베르사유 궁전 정원',
      latitude: 48.8049,
      longitude: 2.1204,
      tagged_at: '2024-11-08T00:30:00.000000Z',
      included_in_segment: true,
    },
  ],
  next_cursor: null,
}
