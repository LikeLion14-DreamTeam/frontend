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

/**
 * 5.2 핀 정보 수정
 *
 * 장소명(사용자 입력)과 텍스트 기록만 수정할 수 있다.
 * 좌표·주소·음성메모는 생성 이후 수정 불가다.
 * 텍스트 기록을 빈 문자열로 저장하면 기록을 지운 것으로 처리한다.
 */
export const updatePin = async (pinId, { placeName, textNote }) => {
  if (USE_MOCK) {
    const pin = mockPinStore.pins[pinId]
    if (!pin) throw mockNotFound()

    pin.place_name = placeName
    pin.text_note = textNote

    return {
      pin_id: pin.pin_id,
      place_name: pin.place_name,
      text_note: pin.text_note,
    }
  }

  return apiClient.patch(`/pins/${pinId}`, {
    place_name: placeName,
    text_note: textNote,
  })
}

/**
 * 5.4 핀 사진 목록 조회
 *
 * 명세 0-1 에 따라 태깅 세션 개념이 없으므로, 한 핀의 사진이 곧 하나의 촬영 묶음이다.
 * `is_pin_cover` 가 대표사진 표시다.
 */
export const getPinPhotos = async (
  pinId,
  { cursor = null, limit = 50 } = {},
) => {
  if (USE_MOCK) {
    if (!mockPinStore.pins[pinId]) throw mockNotFound()

    return {
      photos: mockPinStore.photos[pinId] ?? [],
      next_cursor: null,
    }
  }

  return apiClient.get(`/pins/${pinId}/photos`, { params: { cursor, limit } })
}

/**
 * 5.3 핀 삭제
 *
 * 아직 여정으로 배정되지 않은(segment_id = null, 진행 중) 핀만 삭제할 수 있다.
 * 이미 종료된 여행에 속한 핀은 4.3 의 제외(included_in_segment=false)를 사용한다.
 * segment_id 가 채워진 핀에 호출하면 409 CONFLICT (USE_TRIP_EXCLUSION) 이 온다.
 */
export const deletePin = async (pinId) => {
  if (USE_MOCK) {
    const pin = mockPinStore.pins[pinId]
    if (!pin) throw mockNotFound()

    if (pin.segment_id !== null) {
      throw new ApiError({
        status: 409,
        code: 'USE_TRIP_EXCLUSION',
        message:
          '이미 종료된 여행의 핀은 삭제할 수 없습니다. 여행 구간 편집에서 제외해주세요.',
      })
    }

    delete mockPinStore.pins[pinId]
    delete mockPinStore.photos[pinId]
    delete mockPinStore.voiceMemos[pinId]

    return null
  }

  return apiClient.delete(`/pins/${pinId}`)
}
