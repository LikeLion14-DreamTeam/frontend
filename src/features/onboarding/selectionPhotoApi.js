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
 * 고른 것만 보내면 안 된다. 서버는 그 라운드의 후보가 전부 저장되고(A/B 2장,
 * 무드보드 9장) 그중 true 개수가 맞을 때(각각 1장, 3장) 다음 라운드로 넘어간다.
 * 일부만 보내면 행 수가 안 차서 진행이 그 자리에 멈춘다.
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
