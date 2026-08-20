const getPhotoIdentity = (photo) => {
  if (!photo) return null
  if (photo.photo_id !== null && photo.photo_id !== undefined) {
    return `id:${photo.photo_id}`
  }

  const url = photo.url ?? photo.file_path
  return url ? `url:${url}` : null
}

const toRepresentativePhoto = (photo) => ({
  photo_id: photo.photo_id,
  url: photo.url ?? photo.file_path,
})

/**
 * 현재 남아 있는 사진만 추천 결과에 포함하고, 부족한 자리는 남은 사진으로 채운다.
 * 사진이 세 장뿐이면 선택 가능한 조합은 하나이므로 세 장 모두 대표사진이다.
 */
export const composeRepresentativePhotos = (suggestedPhotos, photos) => {
  const availablePhotos = Array.isArray(photos) ? photos : []
  const availablePhotoIds = new Set(
    availablePhotos.map(getPhotoIdentity).filter(Boolean),
  )
  const result = []
  const resultIds = new Set()

  const append = (photo) => {
    const identity = getPhotoIdentity(photo)
    const normalized = toRepresentativePhoto(photo)

    if (
      !identity ||
      !normalized.url ||
      !availablePhotoIds.has(identity) ||
      resultIds.has(identity)
    ) {
      return
    }

    resultIds.add(identity)
    result.push(normalized)
  }

  ;(suggestedPhotos ?? []).forEach(append)
  availablePhotos.filter((photo) => photo.is_pin_cover).forEach(append)
  availablePhotos.forEach(append)

  return result.slice(0, Math.min(3, availablePhotos.length))
}
