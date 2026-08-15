import apiClient from '../../api/client'
import { ApiError } from '../../api/errors'
import { fetchAllPages } from '../../api/pagination'
import { getMockUploadedUrl } from '../../api/uploads'
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

/** mock 전용. 새 핀과 선택적인 음성 메모를 진행 중인 여정에 저장한다. */
const createMockPin = (pinPayload) => {
  const pinId =
    Math.max(0, ...Object.keys(mockPinStore.pins).map(Number)) + 1
  const taggedAt = new Date().toISOString()

  const pin = {
    pin_id: pinId,
    segment_id: null,
    nfc_tag_id: pinPayload.nfc_tag_id ?? null,
    latitude: pinPayload.latitude ?? null,
    longitude: pinPayload.longitude ?? null,
    address: pinPayload.address ?? '',
    city: pinPayload.city ?? '',
    country_name: pinPayload.country_name ?? '',
    place_name: pinPayload.place_name ?? '',
    tagged_at: taggedAt,
    text_note: pinPayload.text_note ?? '',
  }

  let voiceMemo = null

  if (pinPayload.audio_file) {
    const voiceMemoId =
      Math.max(
        0,
        ...Object.values(mockPinStore.voiceMemos)
          .filter(Boolean)
          .map((memo) => memo.voice_memo_id),
      ) + 1

    mockPinStore.voiceMemos[pinId] = {
      voice_memo_id: voiceMemoId,
      audio_file:
        getMockUploadedUrl(pinPayload.audio_file) ?? pinPayload.audio_file,
      duration_sec: 0,
      saved_at: taggedAt,
    }
    voiceMemo = { voice_memo_id: voiceMemoId }
  } else {
    mockPinStore.voiceMemos[pinId] = null
  }

  mockPinStore.pins[pinId] = pin
  mockPinStore.photos[pinId] = []

  return {
    pin_id: pin.pin_id,
    segment_id: pin.segment_id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    address: pin.address,
    place_name: pin.place_name,
    tagged_at: pin.tagged_at,
    text_note: pin.text_note,
    voice_memo: voiceMemo,
  }
}

/**
 * API 명세 8.2: NFC 태깅 또는 수동 촬영 결과를 새 핀으로 저장한다.
 *
 * 여행 구간은 요청에서 지정하지 않으며 서버가 항상 segment_id = null 로 만든다.
 * `audioFile` 은 업로드된 음성 파일의 공개 URL이다. 촬영 사진은 핀 생성 후
 * 5.5 API로 별도 등록한다.
 */
export const createPin = async ({
  nfcTagId,
  latitude,
  longitude,
  address,
  city,
  countryName,
  placeName = '',
  textNote = '',
  audioFile,
}) => {
  const pinPayload = {
    nfc_tag_id: nfcTagId ?? null,
    latitude,
    longitude,
    address,
    city,
    country_name: countryName,
    place_name: placeName,
    text_note: textNote,
    audio_file: audioFile ?? null,
  }

  if (USE_MOCK) {
    return createMockPin(pinPayload)
  }

  return apiClient.post('/pins', pinPayload)
}

/**
 * 진행 중인 여행의 핀 목록.
 *
 * 명세 0-1 에 따르면 진행 중인 여행은 TRAVEL_SEGMENT 가 없고 `segment_id` 가
 * NULL 인 핀들의 묶음이다. 계정당 하나뿐이라 파라미터가 필요 없다.
 *
 * TODO: 대응하는 엔드포인트가 아직 없다(백엔드 문의 중). 4.5 는 segment_id 를
 * 요구해서 쓸 수 없다. 실제 API 로 붙기 전까지 mock 이 아닐 때는 빈 목록을
 * 돌려주고, 응답 형태는 4.5 와 같게 맞춰둔다.
 */
export const getOngoingPins = async () => {
  if (USE_MOCK) {
    return {
      pins: Object.values(mockPinStore.pins)
        .filter((pin) => pin.segment_id === null)
        .map((pin) => ({
          pin_id: pin.pin_id,
          place_name: pin.place_name,
          latitude: pin.latitude,
          longitude: pin.longitude,
          tagged_at: pin.tagged_at,
          included_in_segment: true,
        })),
    }
  }

  return { pins: [] }
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
 * 5.4 핀 사진 목록 조회. 마지막 페이지까지 이어 받는다.
 *
 * 명세 0-1 에 따라 태깅 세션 개념이 없으므로, 한 핀의 사진이 곧 하나의 촬영 묶음이다.
 * `is_pin_cover` 가 대표사진 표시다.
 */
export const getPinPhotos = async (pinId, { limit = 50 } = {}) => {
  if (USE_MOCK) {
    if (!mockPinStore.pins[pinId]) throw mockNotFound()

    return {
      photos: mockPinStore.photos[pinId] ?? [],
      next_cursor: null,
    }
  }

  return fetchAllPages(
    (cursor) =>
      apiClient.get(`/pins/${pinId}/photos`, { params: { cursor, limit } }),
    'photos',
  )
}

/** mock 전용. 두 좌표 사이 거리(m). 5.5 반경 검증에 쓴다. */
const distanceInMeters = (from, to) => {
  const toRadian = (degree) => (degree * Math.PI) / 180
  const earthRadius = 6371000

  const dLat = toRadian(to.lat - from.lat)
  const dLng = toRadian(to.lng - from.lng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadian(from.lat)) *
      Math.cos(toRadian(to.lat)) *
      Math.sin(dLng / 2) ** 2

  return 2 * earthRadius * Math.asin(Math.sqrt(a))
}

const PHOTO_RADIUS_METERS = 1000

/**
 * 5.5 사진 등록
 *
 * 핀 반경 1km 이내에서 촬영된 사진만 등록한다. 반경 밖이거나 좌표가 없는 사진은
 * 그것만 제외하고 나머지는 정상 등록한다(요청 전체를 거부하지 않음). 단, 위치
 * 권한 없이 만든 좌표 없는 핀의 즉시 촬영 사진은 함께 좌표가 없어도 등록한다.
 *
 * API 명세는 종료된 여행의 핀을 409 로 막지만, 팀 논의로 허용하기로 정해
 * 여행 종료 여부는 보지 않는다.
 *
 * `photos` 는 `[{ file_id, captured_at, latitude, longitude }]` 형태이며,
 * file_id 는 `api/uploads` 의 2단계 업로드로 먼저 받아둔다.
 */
export const addPinPhotos = async (pinId, photos) => {
  if (USE_MOCK) {
    const pin = mockPinStore.pins[pinId]
    if (!pin) throw mockNotFound()

    const added = []
    const rejected = []
    const stored = mockPinStore.photos[pinId] ?? []

    photos.forEach((photo) => {
      const isLocationlessCapture =
        pin.latitude == null &&
        pin.longitude == null &&
        photo.latitude == null &&
        photo.longitude == null

      if (photo.latitude == null || photo.longitude == null) {
        if (!isLocationlessCapture) {
          rejected.push({ file_id: photo.file_id, reason: 'MISSING_COORDINATES' })
          return
        }
      }

      const distance = isLocationlessCapture
        ? 0
        : distanceInMeters(
            { lat: pin.latitude, lng: pin.longitude },
            { lat: photo.latitude, lng: photo.longitude },
          )

      if (distance > PHOTO_RADIUS_METERS) {
        rejected.push({ file_id: photo.file_id, reason: 'OUT_OF_RADIUS' })
        return
      }

      const photoId = Math.max(0, ...stored.map((item) => item.photo_id)) + 1

      stored.push({
        photo_id: photoId,
        captured_at: photo.captured_at,
        file_path: getMockUploadedUrl(photo.file_id),
        is_pin_cover: false,
      })

      added.push({ photo_id: photoId, file_id: photo.file_id })
    })

    mockPinStore.photos[pinId] = stored

    return { added, rejected }
  }

  return apiClient.post(`/pins/${pinId}/photos`, { photos })
}

/**
 * 5.8 음성 메모 조회
 *
 * 5.1 은 음성 메모의 존재 여부와 길이만 준다. 재생용 파일 주소(`audio_file`)는
 * 이 API 로만 받을 수 있어, 재생 버튼을 붙이려면 한 번 더 호출해야 한다.
 * 핀당 음성 메모는 하나라 배열이 아니라 `voice_memo` 객체 하나가 온다.
 */
export const getPinVoiceMemos = async (pinId) => {
  if (USE_MOCK) {
    if (!mockPinStore.pins[pinId]) throw mockNotFound()

    const voiceMemo = mockPinStore.voiceMemos[pinId]

    return {
      voice_memo: voiceMemo
        ? {
            voice_memo_id: voiceMemo.voice_memo_id,
            audio_file: voiceMemo.audio_file,
            saved_at: voiceMemo.saved_at,
          }
        : null,
    }
  }

  return apiClient.get(`/pins/${pinId}/voice-memos`)
}

/**
 * 5.7 사진 삭제
 *
 * 삭제된 사진이 대표사진이었다면 남은 사진 중에서 서버가 자동으로 대체 1장을 채워
 * 항상 최대 3장을 유지한다. 204 No Content 라 반환값이 없다.
 */
export const deletePhoto = async (photoId) => {
  if (USE_MOCK) {
    const targetId = Number(photoId)

    const entry = Object.entries(mockPinStore.photos).find(([, list]) =>
      list.some((photo) => photo.photo_id === targetId),
    )

    if (!entry) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: '사진을 찾을 수 없습니다.',
      })
    }

    const [pinId, list] = entry
    const removed = list.find((photo) => photo.photo_id === targetId)
    const remaining = list.filter((photo) => photo.photo_id !== targetId)

    if (removed.is_pin_cover) {
      const replacement = remaining.find((photo) => !photo.is_pin_cover)
      if (replacement) replacement.is_pin_cover = true
    }

    mockPinStore.photos[pinId] = remaining

    return null
  }

  return apiClient.delete(`/photos/${photoId}`)
}

/**
 * 5.6 대표사진 새로고침
 *
 * 핀의 사진을 새로고침 시점의 취향 프로파일 기준으로 재정렬해 상위 10개를 뽑고,
 * 그중 무작위 3개를 대표사진으로 지정한다(기존 3장 해제 후 새 3장에 is_pin_cover=true).
 * 이전 추천 이력은 보존하지 않으며, 이 행위 자체는 취향 학습에 반영되지 않는다.
 *
 * mock 에는 취향 프로파일이 없어 무작위 3장으로만 다시 지정한다.
 */
export const refreshRepresentativePhotos = async (pinId) => {
  if (USE_MOCK) {
    const pin = mockPinStore.pins[pinId]
    if (!pin) throw mockNotFound()

    const photos = mockPinStore.photos[pinId] ?? []
    const picked = [...photos]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, photos.length))
    const pickedIds = new Set(picked.map((photo) => photo.photo_id))

    photos.forEach((photo) => {
      photo.is_pin_cover = pickedIds.has(photo.photo_id)
    })

    return {
      representative_photos: photos
        .filter((photo) => photo.is_pin_cover)
        .map((photo) => ({ photo_id: photo.photo_id, url: photo.file_path })),
    }
  }

  return apiClient.post(`/pins/${pinId}/representative-photos/refresh`)
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
