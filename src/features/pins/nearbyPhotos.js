import exifr from 'exifr'
import { uploadPhoto } from '../../api/uploads'
import { addPinPhotos } from './pinApi'
import {
  runPhotoBatches,
  splitPhotosByCapacity,
} from './photoUploadQueue'

/** 5.5 가 돌려주는 거절 사유를 화면 문구로 옮긴다. */
export const REJECT_REASONS = {
  OUT_OF_RADIUS: '1km 밖에서 촬영됨',
  MISSING_COORDINATES: '위치 정보 없음',
  BATCH_SIZE_EXCEEDED: '한 번에 15장 초과',
  BATCH_UPLOAD_FAILED: '업로드 요청 실패',
  FILE_UPLOAD_FAILED: '파일 업로드 실패',
  PIN_PHOTO_LIMIT_EXCEEDED: '핀당 최대 50장 초과',
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
export const addNearbyPhotos = async (
  pinId,
  files,
  { currentPhotoCount = 0, onProgress } = {},
) => {
  const { accepted, overflow } = splitPhotosByCapacity(files, currentPhotoCount)
  const results = await runPhotoBatches(
    accepted,
    async (batch) => {
      const uploads = await Promise.allSettled(
        batch.map(async (file) => {
          const [fileId, meta] = await Promise.all([
            uploadPhoto(file),
            readPhotoMeta(file),
          ])

          return { file_id: fileId, ...meta }
        }),
      )
      const uploaded = uploads
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
      const failedUploads = uploads
        .map((result, index) => ({ result, file: batch[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ file }) => ({
          file_name: file.name,
          reason: 'FILE_UPLOAD_FAILED',
        }))

      if (uploaded.length === 0) {
        return { added: [], rejected: failedUploads }
      }

      try {
        const registered = await addPinPhotos(pinId, uploaded)
        return {
          added: registered.added ?? [],
          rejected: [...failedUploads, ...(registered.rejected ?? [])],
        }
      } catch (error) {
        return {
          added: [],
          rejected: [
            ...failedUploads,
            ...uploaded.map((photo) => ({
              file_id: photo.file_id,
              reason: error.code ?? 'BATCH_UPLOAD_FAILED',
            })),
          ],
        }
      }
    },
    { onProgress, phase: 'upload' },
  )

  return results.reduce(
    (merged, result) => ({
      added: [...merged.added, ...(result.added ?? [])],
      rejected: [...merged.rejected, ...(result.rejected ?? [])],
    }),
    {
      added: [],
      rejected: overflow.map((file) => ({
        file_name: file.name,
        reason: 'PIN_PHOTO_LIMIT_EXCEEDED',
      })),
    },
  )
}

/** 거절 사유를 중복 없이 한 줄로 잇는다. */
export const describeRejected = (rejected) =>
  [
    ...new Set(rejected.map(({ reason }) => REJECT_REASONS[reason] ?? reason)),
  ].join(', ')
