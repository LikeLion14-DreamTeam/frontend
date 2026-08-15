import archiveCover from '../../assets/photobooks/archive-cover-2.png'
import barcelonaCover from '../../assets/images/onboarding-selection/ab-4-a.webp'
import tokyoCover from '../../assets/images/onboarding-selection/mood-2-08.webp'

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
