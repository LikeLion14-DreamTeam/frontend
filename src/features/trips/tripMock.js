/**
 * 여행 구간 mock 데이터.
 *
 * 백엔드 완성 전까지 `VITE_USE_MOCK_API=true` 상태에서 `tripApi` 가 이 값을 읽고 쓴다.
 * 단순한 고정 응답이 아니라 메모리에 상태를 들고 있어서, 이름 수정·핀 제외·삭제가
 * 실제로 반영된다. 새로고침하면 초기값으로 돌아간다.
 *
 * 응답 형태는 API 명세서 4.1 / 4.2 / 4.5 와 동일하게 맞춘다.
 */

const createInitialState = () => ({
  trips: {
    12: {
      segment_id: 12,
      user_id: 1,
      name: '파리 · 베르사유',
      start_at: '2024-11-03T01:24:00.000000Z',
      end_at: '2024-11-10T09:12:00.000000Z',
      status: true,
    },
    11: {
      segment_id: 11,
      user_id: 1,
      name: '도쿄, 요코하마',
      start_at: '2024-08-01T00:00:00.000000Z',
      end_at: '2024-08-03T15:00:00.000000Z',
      status: true,
    },
  },

  pins: {
    12: [
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

    11: [
      {
        pin_id: 201,
        place_name: '시부야 스카이',
        latitude: 35.6595,
        longitude: 139.7004,
        tagged_at: '2024-08-01T00:00:00.000000Z',
        included_in_segment: true,
      },
      {
        pin_id: 202,
        place_name: '요코하마 미나토미라이',
        latitude: 35.4563,
        longitude: 139.6317,
        tagged_at: '2024-08-03T09:20:00.000000Z',
        included_in_segment: true,
      },
    ],
  },
})

/**
 * mock 내부 집계 전용 데이터.
 *
 * 실제 API 응답에는 핀별 사진 수가 없다(백엔드 문의 중). 여기서는 구간 요약의
 * photo_count 를 계산하려고 따로 들고 있으며, 응답 객체에는 넣지 않는다.
 * 화면에서 이 값을 읽으면 안 된다.
 */
const PHOTO_COUNT_BY_PIN = {
  101: 8,
  102: 6,
  103: 11,
  104: 3,
  105: 4,
  201: 12,
  202: 9,
}

const VOICE_MEMO_PIN_IDS = new Set([101, 104, 201])

/** 세션 동안 유지되는 mock 상태. tripApi 의 mock 분기가 직접 읽고 쓴다. */
export const mockTripStore = createInitialState()

export const getMockPhotoCount = (pinId) => PHOTO_COUNT_BY_PIN[pinId] ?? 0

export const getMockVoiceMemoCount = (pinId) =>
  VOICE_MEMO_PIN_IDS.has(pinId) ? 1 : 0

/** 테스트나 초기화가 필요할 때 사용한다. */
export const resetMockTripStore = () => {
  Object.assign(mockTripStore, createInitialState())
}
