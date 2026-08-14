import { ApiError } from '../../api/errors'

const mockSelectionPhotos = new Map()

const createValidationError = () =>
  new ApiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: '사진, 라운드, 선택 상태를 다시 확인해 주세요.',
  })

/** API 명세 2.2와 동일한 형태로 사진별 선택 상태를 메모리에 저장한다. */
export const saveMockSelectionPhoto = ({ photo_id, round_no, status }) => {
  if (
    !Number.isInteger(photo_id) ||
    photo_id < 1 ||
    !Number.isInteger(round_no) ||
    round_no < 1 ||
    round_no > 7 ||
    typeof status !== 'boolean'
  ) {
    throw createValidationError()
  }

  const selectionPhoto = {
    photo_id,
    user_id: 1,
    round_no,
    status,
    selected_at: new Date().toISOString(),
  }

  mockSelectionPhotos.set(`${round_no}:${photo_id}`, selectionPhoto)

  return { ...selectionPhoto }
}

