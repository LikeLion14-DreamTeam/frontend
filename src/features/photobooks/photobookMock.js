import archiveCover from '../../assets/photobooks/archive-cover-2.png'
import breakfastPhoto from '../../assets/images/onboarding-selection/ab-5-a.webp'
import barcelonaCover from '../../assets/images/onboarding-selection/ab-4-a.webp'
import streetPhoto from '../../assets/images/onboarding-selection/mood-2-01.webp'
import tokyoCover from '../../assets/images/onboarding-selection/mood-2-08.webp'
import { ApiError } from '../../api/errors'

const MOCK_PHOTOBOOKS = [
  {
    photobook_id: 30,
    segment_id: 12,
    name: '파리 · 암스테르담',
    start_at: '2024-09-12T00:00:00.000000Z',
    end_at: '2024-09-27T10:00:00.000000Z',
    cities: ['파리', '암스테르담'],
    photo_count: 72,
    cover_photo_url: archiveCover,
  },
  {
    photobook_id: 29,
    segment_id: 11,
    name: '도쿄 3일',
    start_at: '2024-05-03T00:00:00.000000Z',
    end_at: '2024-05-11T10:00:00.000000Z',
    cities: ['도쿄', '요코하마'],
    photo_count: 138,
    cover_photo_url: tokyoCover,
  },
  {
    photobook_id: 28,
    segment_id: 10,
    name: '바르셀로나의 늦가을',
    start_at: '2023-11-08T00:00:00.000000Z',
    end_at: '2023-11-19T10:00:00.000000Z',
    cities: ['바르셀로나'],
    photo_count: 94,
    cover_photo_url: barcelonaCover,
  },
]

const photo = (photoId, filePath, order) => ({
  photo_id: photoId,
  order,
  file_path: filePath,
})

const voiceMemo = (durationSec = 38) => ({
  audio_url: '',
  duration_sec: durationSec,
})

const MOCK_PHOTOBOOK_DETAILS = {
  30: {
    total_days: 16,
    pin_count: 5,
    voice_memo_count: 3,
    cities: [
      {
        city: '파리',
        start_at: '2024-09-12T09:10:00.000000Z',
        end_at: '2024-09-18T17:20:00.000000Z',
        pin_count: 3,
        pins: [
          {
            pin_id: 101,
            order: 1,
            place_name: '에펠탑',
            tagged_at: '2024-09-12T09:10:00.000000Z',
            latitude: 48.8584,
            longitude: 2.2945,
            text_note: '도시의 첫 장면을 오래 바라보았다.',
            photos: [
              photo(1001, archiveCover, 1),
              photo(1002, breakfastPhoto, 2),
              photo(1003, streetPhoto, 3),
              photo(1004, barcelonaCover, 4),
            ],
            voice_memo: voiceMemo(),
          },
          {
            pin_id: 102,
            order: 2,
            place_name: '루브르 박물관',
            tagged_at: '2024-09-14T13:30:00.000000Z',
            latitude: 48.8606,
            longitude: 2.3376,
            text_note: '',
            photos: [
              photo(1005, streetPhoto, 1),
              photo(1006, breakfastPhoto, 2),
            ],
            voice_memo: null,
          },
          {
            pin_id: 103,
            order: 3,
            place_name: '몽마르트 언덕',
            tagged_at: '2024-09-18T17:20:00.000000Z',
            latitude: 48.8867,
            longitude: 2.3431,
            text_note:
              '계단 끝에서 도시가 한 번에 펼쳐졌다. 숨 고르느라 오래 서 있었음.',
            photos: [
              photo(1007, barcelonaCover, 1),
              photo(1008, tokyoCover, 2),
              photo(1009, breakfastPhoto, 3),
            ],
            voice_memo: voiceMemo(),
          },
        ],
      },
      {
        city: '암스테르담',
        start_at: '2024-09-22T10:00:00.000000Z',
        end_at: '2024-09-27T10:00:00.000000Z',
        pin_count: 2,
        pins: [
          {
            pin_id: 104,
            order: 4,
            place_name: '담 광장',
            tagged_at: '2024-09-22T10:00:00.000000Z',
            latitude: 52.3731,
            longitude: 4.8922,
            text_note: '운하를 따라 천천히 걸었다.',
            photos: [
              photo(1010, streetPhoto, 1),
              photo(1011, tokyoCover, 2),
              photo(1012, archiveCover, 3),
              photo(1013, breakfastPhoto, 4),
            ],
            voice_memo: voiceMemo(),
          },
          {
            pin_id: 105,
            order: 5,
            place_name: '레이크스 미술관',
            tagged_at: '2024-09-27T10:00:00.000000Z',
            latitude: 52.36,
            longitude: 4.8852,
            text_note: '',
            photos: [
              photo(1014, tokyoCover, 1),
              photo(1015, barcelonaCover, 2),
            ],
            voice_memo: null,
          },
        ],
      },
    ],
  },
  29: {
    total_days: 9,
    pin_count: 2,
    voice_memo_count: 1,
    cities: [
      {
        city: '도쿄',
        start_at: '2024-05-03T08:00:00.000000Z',
        end_at: '2024-05-07T09:20:00.000000Z',
        pin_count: 1,
        pins: [
          {
            pin_id: 201,
            order: 1,
            place_name: '시부야 스카이',
            tagged_at: '2024-05-03T08:00:00.000000Z',
            latitude: 35.6595,
            longitude: 139.7004,
            text_note: '도쿄의 빛이 한눈에 들어왔다.',
            photos: [
              photo(2001, tokyoCover, 1),
              photo(2002, streetPhoto, 2),
              photo(2003, breakfastPhoto, 3),
            ],
            voice_memo: voiceMemo(24),
          },
        ],
      },
      {
        city: '요코하마',
        start_at: '2024-05-11T10:00:00.000000Z',
        end_at: '2024-05-11T10:00:00.000000Z',
        pin_count: 1,
        pins: [
          {
            pin_id: 202,
            order: 2,
            place_name: '미나토미라이',
            tagged_at: '2024-05-11T10:00:00.000000Z',
            latitude: 35.4563,
            longitude: 139.6317,
            text_note: '',
            photos: [
              photo(2004, streetPhoto, 1),
              photo(2005, tokyoCover, 2),
            ],
            voice_memo: null,
          },
        ],
      },
    ],
  },
  28: {
    total_days: 12,
    pin_count: 2,
    voice_memo_count: 0,
    cities: [
      {
        city: '바르셀로나',
        start_at: '2023-11-08T09:00:00.000000Z',
        end_at: '2023-11-19T10:00:00.000000Z',
        pin_count: 2,
        pins: [
          {
            pin_id: 301,
            order: 1,
            place_name: '사그라다 파밀리아',
            tagged_at: '2023-11-08T09:00:00.000000Z',
            latitude: 41.4036,
            longitude: 2.1744,
            text_note: '빛이 스테인드글라스를 통과하던 순간.',
            photos: [
              photo(3001, barcelonaCover, 1),
              photo(3002, breakfastPhoto, 2),
              photo(3003, streetPhoto, 3),
            ],
            voice_memo: null,
          },
          {
            pin_id: 302,
            order: 2,
            place_name: '구엘 공원',
            tagged_at: '2023-11-19T10:00:00.000000Z',
            latitude: 41.4145,
            longitude: 2.1527,
            text_note: '',
            photos: [
              photo(3004, archiveCover, 1),
              photo(3005, barcelonaCover, 2),
            ],
            voice_memo: null,
          },
        ],
      },
    ],
  },
}

const toOffset = (cursor) => {
  const offset = Number(cursor)
  return Number.isInteger(offset) && offset >= 0 ? offset : 0
}

/** API 명세 6.1과 동일한 커서 페이지 응답을 반환한다. */
export const getMockPhotobooks = ({ cursor = null, limit = 20 } = {}) => {
  const offset = toOffset(cursor)
  const pageSize = Math.max(1, Math.trunc(Number(limit)) || 20)
  const nextOffset = offset + pageSize

  return {
    photobooks: MOCK_PHOTOBOOKS.slice(offset, nextOffset).map(
      (photobook) => ({
        ...photobook,
        cities: [...photobook.cities],
      }),
    ),
    next_cursor:
      nextOffset < MOCK_PHOTOBOOKS.length ? String(nextOffset) : null,
  }
}

const cloneDetail = (detail) => ({
  ...detail,
  cities: detail.cities.map((city) => ({
    ...city,
    pins: city.pins.map((pin) => ({
      ...pin,
      photos: pin.photos.map((item) => ({ ...item })),
      voice_memo: pin.voice_memo ? { ...pin.voice_memo } : null,
    })),
  })),
})

/** API 명세 6.2와 동일한 포토북 상세 응답을 반환한다. */
export const getMockPhotobook = (photobookId) => {
  const id = Number(photobookId)
  const summary = MOCK_PHOTOBOOKS.find(
    (photobook) => photobook.photobook_id === id,
  )
  const detail = MOCK_PHOTOBOOK_DETAILS[id]

  if (!summary || !detail) {
    throw new ApiError({
      status: 404,
      code: 'NOT_FOUND',
      message: '포토북을 찾을 수 없습니다.',
    })
  }

  return cloneDetail({ ...summary, ...detail })
}

/** API 명세 6.3과 동일하게 포토북 이름만 수정한다. */
export const updateMockPhotobookName = (photobookId, name) => {
  const id = Number(photobookId)
  const summary = MOCK_PHOTOBOOKS.find(
    (photobook) => photobook.photobook_id === id,
  )

  if (!summary) {
    throw new ApiError({
      status: 404,
      code: 'NOT_FOUND',
      message: '포토북을 찾을 수 없습니다.',
    })
  }

  const nextName = typeof name === 'string' ? name.trim() : ''

  if (!nextName) {
    throw new ApiError({
      status: 400,
      code: 'INVALID_NAME',
      message: '포토북 이름을 입력해 주세요.',
    })
  }

  summary.name = nextName

  return {
    photobook_id: id,
    name: nextName,
  }
}
