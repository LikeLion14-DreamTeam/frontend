import { uploadPhoto } from '../../api/uploads'
import { addPinPhotos } from './pinApi'

/**
 * 사진 파일을 올려 파일 ID 를 받는다. 핀이 없어도 할 수 있다.
 *
 * 핀보다 먼저 해야 한다. 핀을 만든 뒤에 올리다 실패하면 사진 없는 핀이
 * 그대로 남는다. 먼저 올려 두면 여기서 실패했을 때 아직 만든 것이 없다.
 */
export const uploadCapturedPhotos = (photos, { latitude, longitude }) =>
  Promise.all(
    photos.map(async (photo) => ({
      file_id: await uploadPhoto(photo.file),
      captured_at: photo.capturedAt,
      latitude,
      longitude,
    })),
  )

/** 올려 둔 파일 ID 를 핀에 촬영 순서대로 첨부한다(5.5). */
export const attachUploadedPhotos = (pinId, uploadedPhotos) =>
  addPinPhotos(pinId, uploadedPhotos)
