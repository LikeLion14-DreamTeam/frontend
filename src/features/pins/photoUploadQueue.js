export const PHOTO_UPLOAD_BATCH_SIZE = 15
export const MAX_PIN_PHOTOS = 50

export const getRemainingPhotoCapacity = (currentCount = 0) =>
  Math.max(MAX_PIN_PHOTOS - currentCount, 0)

export const splitPhotosByCapacity = (photos, currentCount = 0) => {
  const remaining = getRemainingPhotoCapacity(currentCount)

  return {
    accepted: photos.slice(0, remaining),
    overflow: photos.slice(remaining),
  }
}

/** 서버의 요청당 제한에 맞춰 최대 15장씩 순차 처리한다. */
export const runPhotoBatches = async (
  photos,
  worker,
  { onProgress, phase = 'upload', completedOffset = 0, total } = {},
) => {
  const progressTotal = total ?? photos.length + completedOffset
  const totalBatches = Math.ceil(photos.length / PHOTO_UPLOAD_BATCH_SIZE)
  const results = []

  for (let offset = 0; offset < photos.length; offset += PHOTO_UPLOAD_BATCH_SIZE) {
    const batch = photos.slice(offset, offset + PHOTO_UPLOAD_BATCH_SIZE)
    const batchIndex = Math.floor(offset / PHOTO_UPLOAD_BATCH_SIZE) + 1

    onProgress?.({
      phase,
      completed: completedOffset + offset,
      total: progressTotal,
      batchIndex,
      totalBatches,
    })

    results.push(await worker(batch))

    onProgress?.({
      phase,
      completed: completedOffset + offset + batch.length,
      total: progressTotal,
      batchIndex,
      totalBatches,
    })
  }

  return results
}

export const assertWithinPinPhotoLimit = (photos) => {
  if (photos.length <= MAX_PIN_PHOTOS) return

  throw new Error(`한 핀에는 사진을 최대 ${MAX_PIN_PHOTOS}장까지 추가할 수 있어요.`)
}
