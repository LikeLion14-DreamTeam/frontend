/**
 * 여행 구간 mock 데이터.
 *
 * 백엔드 완성 전까지 `VITE_USE_MOCK_API=true` 상태에서 `tripApi` 가 이 값을 읽고 쓴다.
 * 단순한 고정 응답이 아니라 메모리에 상태를 들고 있어서, 이름 수정·핀 제외·삭제가
 * 실제로 반영된다. 새로고침하면 초기값으로 돌아간다.
 *
 * 응답 형태는 API 명세서 4.1 / 4.2 / 4.5 와 동일하게 맞춘다.
 */

import { mockPinStore } from '../pins/pinMock'

const createInitialState = () => ({
  /**
   * 3.4 로 사용자가 직접 지정한 진행 중인 여행 이름. 지정 전에는 null 이고,
   * 3.1 은 이 값이 있으면 도시명을 이어 붙인 자동 이름 대신 이걸 돌려준다.
   */
  currentTripName: null,

  trips: {
    12: {
      segment_id: 12,
      user_id: 1,
      name: '파리, 베르사유',
      start_at: '2024-11-03T01:24:00.000000Z',
      end_at: '2024-11-10T09:12:00.000000Z',
      status: true,
      // 4.1 은 나라별로 도시를 묶어 준다.
      countries: [{ country_name: '프랑스', cities: ['파리', '베르사유'] }],
    },
    11: {
      segment_id: 11,
      user_id: 1,
      name: '도쿄, 요코하마',
      start_at: '2024-08-01T00:00:00.000000Z',
      end_at: '2024-08-03T15:00:00.000000Z',
      status: true,
      countries: [{ country_name: '일본', cities: ['도쿄', '요코하마'] }],
    },
    // 여러 나라를 도는 여정. 국가 도장이 한 면(8개)을 넘겨야 여권 넘김을
    // 확인할 수 있어 넣어둔 테스트용 구간이다.
    10: {
      segment_id: 10,
      user_id: 1,
      name: '유럽 일주',
      start_at: '2024-05-02T08:00:00.000000Z',
      end_at: '2024-05-15T14:20:00.000000Z',
      status: true,
      countries: [
        { country_name: '이탈리아', cities: ['로마'] },
        { country_name: '스페인', cities: ['바르셀로나'] },
        { country_name: '포르투갈', cities: ['리스본'] },
        { country_name: '스위스', cities: ['취리히'] },
        { country_name: '체코', cities: ['프라하'] },
        { country_name: '오스트리아', cities: ['빈'] },
        { country_name: '네덜란드', cities: ['암스테르담'] },
      ],
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

    10: [
      {
        pin_id: 301,
        place_name: '콜로세움',
        latitude: 41.8902,
        longitude: 12.4922,
        tagged_at: '2024-05-02T08:00:00.000000Z',
        included_in_segment: true,
      },
      {
        pin_id: 302,
        place_name: '사그라다 파밀리아',
        latitude: 41.4036,
        longitude: 2.1744,
        tagged_at: '2024-05-04T10:30:00.000000Z',
        included_in_segment: true,
      },
      {
        pin_id: 303,
        place_name: '벨렝 탑',
        latitude: 38.6916,
        longitude: -9.216,
        tagged_at: '2024-05-06T13:05:00.000000Z',
        included_in_segment: true,
      },
      {
        pin_id: 304,
        place_name: '취리히 호수',
        latitude: 47.3564,
        longitude: 8.5417,
        tagged_at: '2024-05-09T07:45:00.000000Z',
        included_in_segment: true,
      },
      {
        pin_id: 305,
        place_name: '카를교',
        latitude: 50.0865,
        longitude: 14.4114,
        tagged_at: '2024-05-11T16:10:00.000000Z',
        included_in_segment: true,
      },
      {
        pin_id: 306,
        place_name: '쇤브룬 궁전',
        latitude: 48.1849,
        longitude: 16.3122,
        tagged_at: '2024-05-13T09:25:00.000000Z',
        included_in_segment: true,
      },
      {
        pin_id: 307,
        place_name: '암스테르담 운하',
        latitude: 52.3676,
        longitude: 4.9041,
        tagged_at: '2024-05-15T14:20:00.000000Z',
        included_in_segment: true,
      },
    ],
  },
})

/**
 * 구간 요약(4.2)의 사진·음성 개수는 핀 mock 의 실제 데이터에서 센다.
 *
 * 따로 표를 두면 5.4 사진 목록과 숫자가 어긋나고, 5.7 로 사진을 지워도 구간
 * 요약이 그대로여서 목업만으로 확인이 안 된다.
 */

/**
 * mock 내부 집계 전용 데이터. 핀별 도시·국가.
 *
 * 실제로는 핀을 만들 때(8.2) 프론트가 좌표를 역지오코딩해 보낸 값을 서버가
 * 들고 있다가 3.1 의 `cities` 와 3.3 의 국가 도장으로 집계한다. mock 에서는
 * 그 저장소를 대신하며, 어떤 API 응답에도 이 값을 그대로 넣지 않는다.
 *
 * 국가는 ISO 3166-1 alpha-2. 구글 역지오코딩 country 의 `short_name` 이라
 * 응답 언어와 무관하게 같은 값이 온다. 도시명은 `language=ko` 기준이다.
 * 좌표가 없는 핀(104)은 역지오코딩을 못 해 도시·국가가 비어 있다.
 */
const LOCATION_BY_PIN = {
  101: { city: '파리', country_code: 'FR', country_name: '프랑스' },
  102: { city: '파리', country_code: 'FR', country_name: '프랑스' },
  103: { city: '파리', country_code: 'FR', country_name: '프랑스' },
  104: null,
  105: { city: '베르사유', country_code: 'FR', country_name: '프랑스' },
  106: { city: '서울', country_code: 'KR', country_name: '대한민국' },
  107: { city: '부산', country_code: 'KR', country_name: '대한민국' },
  108: { city: '대구', country_code: 'KR', country_name: '대한민국' },
  109: { city: '전주', country_code: 'KR', country_name: '대한민국' },
  110: { city: '여수', country_code: 'KR', country_name: '대한민국' },
  111: { city: '강릉', country_code: 'KR', country_name: '대한민국' },
  201: { city: '도쿄', country_code: 'JP', country_name: '일본' },
  202: { city: '요코하마', country_code: 'JP', country_name: '일본' },
  301: { city: '로마', country_code: 'IT', country_name: '이탈리아' },
  302: { city: '바르셀로나', country_code: 'ES', country_name: '스페인' },
  303: { city: '리스본', country_code: 'PT', country_name: '포르투갈' },
  304: { city: '취리히', country_code: 'CH', country_name: '스위스' },
  305: { city: '프라하', country_code: 'CZ', country_name: '체코' },
  306: { city: '빈', country_code: 'AT', country_name: '오스트리아' },
  307: { city: '암스테르담', country_code: 'NL', country_name: '네덜란드' },
}

export const getMockPinLocation = (pinId) => LOCATION_BY_PIN[pinId] ?? null

/** 세션 동안 유지되는 mock 상태. tripApi 의 mock 분기가 직접 읽고 쓴다. */
export const mockTripStore = createInitialState()

export const getMockPhotoCount = (pinId) =>
  mockPinStore.photos[pinId]?.length ?? 0

export const getMockVoiceMemoCount = (pinId) =>
  mockPinStore.voiceMemos[pinId] ? 1 : 0

/** 테스트나 초기화가 필요할 때 사용한다. */
export const resetMockTripStore = () => {
  Object.assign(mockTripStore, createInitialState())
}
