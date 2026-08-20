import apiClient from '../../api/client'
import { saveMockBasicQuestionResponse } from './basicQuestionMock'
import { recordMockApiCall } from './onboardingDebug'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

/** API 명세 2.1: 인증된 사용자의 라운드별 기본 질문 응답을 저장한다. */
export const saveBasicQuestionResponse = async ({
  roundNo,
  response,
  replaceExisting = false,
}) => {
  const basicQuestionResponse = {
    round_no: roundNo,
    response,
  }

  if (USE_MOCK) {
    const savedResponse = saveMockBasicQuestionResponse(
      basicQuestionResponse,
      { replaceExisting },
    )
    recordMockApiCall({
      endpoint: '/users/me/basic-question-responses',
      payload: basicQuestionResponse,
      response: savedResponse,
    })
    return savedResponse
  }

  return apiClient.post(
    '/users/me/basic-question-responses',
    basicQuestionResponse,
  )
}
