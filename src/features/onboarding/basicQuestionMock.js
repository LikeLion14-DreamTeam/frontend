import { ApiError } from '../../api/errors'

const mockBasicQuestionResponses = new Map()

const createValidationError = () =>
  new ApiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: '문항과 응답을 다시 확인해 주세요.',
  })

/** API 명세 2.1과 동일한 형태로 기본 질문 응답을 메모리에 저장한다. */
export const saveMockBasicQuestionResponse = (
  { round_no, response },
  { replaceExisting = false } = {},
) => {
  if (
    !Number.isInteger(round_no) ||
    round_no < 1 ||
    typeof response !== 'string' ||
    response.trim() === ''
  ) {
    throw createValidationError()
  }

  // 동일 라운드가 연속으로 제출되면 먼저 저장된 응답을 유지한다.
  const savedResponse = mockBasicQuestionResponses.get(round_no)
  if (savedResponse && !replaceExisting) {
    return { ...savedResponse }
  }

  const basicQuestionResponse = {
    response_id:
      savedResponse?.response_id ?? 500 + mockBasicQuestionResponses.size + 1,
    user_id: 1,
    round_no,
    response,
    answered_at: new Date().toISOString(),
  }

  mockBasicQuestionResponses.set(round_no, basicQuestionResponse)

  return { ...basicQuestionResponse }
}
