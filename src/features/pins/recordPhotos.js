import { uploadPhoto } from '../../api/uploads'
import { addPinPhotos } from './pinApi'

/** 촬영한 Blob을 업로드한 뒤 생성된 핀에 촬영 순서대로 첨부한다. */
export const addCapturedPhotos = async (
  pinId,
  photos,
  { latitude, longitude },
) => {
  const uploadedPhotos = await Promise.all(
    photos.map(async (photo) => ({
      file_id: await uploadPhoto(photo.file),
      captured_at: photo.capturedAt,
      latitude,
      longitude,
    })),
  )

  return {
    uploadedPhotos,
    result: await addPinPhotos(pinId, uploadedPhotos),
  }
}

/** 업로드는 끝났지만 핀 첨부가 실패했을 때 파일 ID를 재사용한다. */
export const attachUploadedPhotos = (pinId, uploadedPhotos) =>
  addPinPhotos(pinId, uploadedPhotos)
