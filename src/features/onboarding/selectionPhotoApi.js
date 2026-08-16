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
 * 한 라운드의 후보 사진 전체를 2.2 로 기록한다. 고른 것은 true, 나머지는 false.
 *
 * 고른 것만 보내도 서버가 받아주지만, 화면에 보여준 후보 전체를 그대로 남긴다.
 * 그래야 "A/B 2장 중 1장", "무드보드 9장 중 3장" 이라는 화면의 사실이 저장된
 * 데이터와 일치하고, 선택을 바꿔도 이전 선택이 해제된 채로 남는다.
 *
 * 사진 단위 API 라 순차로 보낸다. 같은 라운드를 여러 번 호출해도 문제없다.
 */
export const saveSelectionRound = async ({
  roundNo,
  candidatePhotoIds,
  selectedPhotoIds,
}) => {
  const selectedPhotoIdSet = new Set(selectedPhotoIds)
  const savedSelections = []

  for (const photoId of candidatePhotoIds) {
    if (selectedPhotoIdSet.has(photoId)) continue

    savedSelections.push(
      await saveSelectionPhoto({ photoId, roundNo, status: false }),
    )
  }

  for (const photoId of selectedPhotoIds) {
    savedSelections.push(
      await saveSelectionPhoto({ photoId, roundNo, status: true }),
    )
  }

  return savedSelections
}
