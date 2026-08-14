import apiClient from '../../api/client'
import { recordMockApiCall } from './onboardingDebug'
import { saveMockSelectionPhoto } from './selectionPhotoMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

/** API 명세 2.2: A/B·무드보드 사진 하나의 선택 상태를 기록한다. */
export const saveSelectionPhoto = async ({ photoId, roundNo, status }) => {
  const selectionPhoto = {
    photo_id: photoId,
    round_no: roundNo,
    status,
  }

  if (USE_MOCK) {
    const savedSelection = saveMockSelectionPhoto(selectionPhoto)
    recordMockApiCall({
      endpoint: '/users/me/selection-photos',
      payload: selectionPhoto,
      response: savedSelection,
    })
    return savedSelection
  }

  return apiClient.post('/users/me/selection-photos', selectionPhoto)
}

/**
 * 라운드의 기존 선택과 새 선택의 차이만 2.2 API로 반영한다.
 * 사진 단위 API이므로 해제(false) 후 선택(true)을 순차 요청한다.
 */
export const syncSelectionPhotos = async ({
  roundNo,
  previousPhotoIds = [],
  selectedPhotoIds,
}) => {
  const previousPhotoIdSet = new Set(previousPhotoIds)
  const selectedPhotoIdSet = new Set(selectedPhotoIds)
  const deselectedPhotoIds = previousPhotoIds.filter(
    (photoId) => !selectedPhotoIdSet.has(photoId),
  )
  const newlySelectedPhotoIds = selectedPhotoIds.filter(
    (photoId) => !previousPhotoIdSet.has(photoId),
  )
  const savedSelections = []

  for (const photoId of deselectedPhotoIds) {
    savedSelections.push(
      await saveSelectionPhoto({ photoId, roundNo, status: false }),
    )
  }

  for (const photoId of newlySelectedPhotoIds) {
    savedSelections.push(
      await saveSelectionPhoto({ photoId, roundNo, status: true }),
    )
  }

  return savedSelections
}
