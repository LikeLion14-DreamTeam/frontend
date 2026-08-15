import exifr from 'exifr'
import { uploadPhoto } from '../../api/uploads'
import { addPinPhotos } from './pinApi'

/** 5.5 가 돌려주는 거절 사유를 화면 문구로 옮긴다. */
export const REJECT_REASONS = {
  OUT_OF_RADIUS: '1km 밖에서 촬영됨',
  MISSING_COORDINATES: '위치 정보 없음',
}

/**
 * 갤러리 사진의 촬영 좌표·시각을 EXIF 에서 읽는다.
 *
 * 공유·메신저를 거친 사진은 위치 정보가 지워진 경우가 많다. 그런 사진은
 * 좌표 없이 보내고 서버가 MISSING_COORDINATES 로 걸러낸다.
 */
const readPhotoMeta = async (file) => {
  const [gps, exif] = await Promise.all([
    exifr.gps(file).catch(() => null),
    exifr.parse(file, ['DateTimeOriginal']).catch(() => null),
  ])

  const capturedAt = exif?.DateTimeOriginal ?? new Date(file.lastModified)

  return {
    latitude: gps?.latitude ?? null,
    longitude: gps?.longitude ?? null,
    captured_at: capturedAt.toISOString(),
  }
}

/**
 * 고른 사진을 올리고 핀에 등록한다(5.5).
 *
 * 파일마다 사전 서명 URL 을 받아 올리고, EXIF 에서 좌표·시각을 읽어 붙인다.
 * 반경 밖이거나 좌표가 없는 사진은 서버가 그것만 걸러내므로 `{ added, rejected }`
 * 를 그대로 돌려준다.
 */
export const addNearbyPhotos = async (pinId, files) => {
  const uploaded = await Promise.all(
    files.map(async (file) => {
      const [fileId, meta] = await Promise.all([
        uploadPhoto(file),
        readPhotoMeta(file),
      ])

      return { file_id: fileId, ...meta }
    }),
  )

  return addPinPhotos(pinId, uploaded)
}

/** 거절 사유를 중복 없이 한 줄로 잇는다. */
export const describeRejected = (rejected) =>
  [
    ...new Set(rejected.map(({ reason }) => REJECT_REASONS[reason] ?? reason)),
  ].join(', ')
