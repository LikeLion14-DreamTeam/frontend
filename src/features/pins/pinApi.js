import apiClient from '../../api/client'
import { ApiError } from '../../api/errors'
import { mockPinStore } from './pinMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

/** 핀 API (명세서 5번) */

const mockNotFound = () =>
  new ApiError({
    status: 404,
    code: 'NOT_FOUND',
    message: '핀을 찾을 수 없습니다.',
  })

/** mock 전용. 대표사진은 is_pin_cover 로 표시된 사진에서 뽑는다. */
const buildMockPinDetail = (pinId) => {
  const pin = mockPinStore.pins[pinId]
  if (!pin) throw mockNotFound()

  const voiceMemo = mockPinStore.voiceMemos[pinId]

  return {
    ...pin,
    voice_memo: voiceMemo
      ? {
          voice_memo_id: voiceMemo.voice_memo_id,
          duration_sec: voiceMemo.duration_sec,
        }
      : null,
    representative_photos: (mockPinStore.photos[pinId] ?? [])
      .filter((photo) => photo.is_pin_cover)
      .map((photo) => ({ photo_id: photo.photo_id, url: photo.file_path })),
  }
}

/**
 * 5.1 핀 상세 조회
 *
 * `address` 는 좌표를 역지오코딩해 저장한 값이라 수정할 수 없고,
 * `place_name` 은 사용자가 입력한 값이라 미입력 시 빈 문자열이다.
 */
export const getPin = async (pinId) => {
  if (USE_MOCK) {
    return buildMockPinDetail(pinId)
  }

  return apiClient.get(`/pins/${pinId}`)
}
