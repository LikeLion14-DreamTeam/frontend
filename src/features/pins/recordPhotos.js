import { uploadPhoto } from '../../api/uploads'
import { addPinPhotos } from './pinApi'

/**
 * 아직 못 올린 사진을 올려 `{ [사진 id]: 첨부용 사진 }` 으로 모은다.
 *
 * 핀보다 먼저 해야 한다. 핀을 만든 뒤에 올리면 한 장도 못 올렸을 때
 * 사진 없는 핀이 그대로 남는다.
 *
 * 한 장이 실패해도 나머지는 살린다. 40장 중 5장이 실패했다고 40장을 전부
 * 버릴 이유가 없다. 몇 장이 빠졌는지는 돌려준 것을 원래 목록과 견주어
 * 부르는 쪽이 판단한다.
 *
 * 이미 올린 것은 다시 올리지 않는다. 저장에 실패해 다시 눌렀을 때 성공한
 * 사진은 그대로 쓰고 실패한 사진만 다시 시도한다.
 */
export const uploadCapturedPhotos = async (
  photos,
  { latitude, longitude },
  uploadedById = {},
) => {
  const results = await Promise.allSettled(
    photos
      .filter((photo) => !uploadedById[photo.id])
      .map(async (photo) => [
        photo.id,
        {
          file_id: await uploadPhoto(photo.file),
          captured_at: photo.capturedAt,
          latitude,
          longitude,
        },
      ]),
  )

  const uploaded = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)

  return { ...uploadedById, ...Object.fromEntries(uploaded) }
}

/** 올린 사진을 원래 순서대로 줄 세운다. 다시 시도해도 순서가 흐트러지지 않는다. */
export const orderUploadedPhotos = (photos, uploadedById) =>
  photos.map((photo) => uploadedById[photo.id]).filter(Boolean)

/** 올려 둔 파일 ID 를 핀에 촬영 순서대로 첨부한다(5.5). */
export const attachUploadedPhotos = (pinId, uploadedPhotos) =>
  addPinPhotos(pinId, uploadedPhotos)
