/**
 * API 에러 형식 통일.
 *
 * 담당자마다 에러 처리가 달라지지 않도록, 모든 실패는 이 `ApiError` 로 통일해 던진다.
 * 화면에서는 `error.message` / `error.code` / `error.status` 만 보면 된다.
 *
 *   try {
 *     await getTrips()
 *   } catch (error) {
 *     alert(error.message)
 *   }
 *
 * `code` 는 명세서의 공통 에러 코드를 그대로 쓴다.
 * UNAUTHENTICATED, PERMISSION_DENIED, NOT_FOUND, VALIDATION_ERROR,
 * CONFLICT, RATE_LIMITED, INTERNAL_ERROR
 * 서버에 닿지 못한 경우는 NETWORK_ERROR 로 채운다.
 */
export class ApiError extends Error {
  constructor({
    status = 0,
    code = 'UNKNOWN_ERROR',
    message = '알 수 없는 오류가 발생했습니다.',
  }) {
    super(message)

    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const createApiError = (error) => {
  if (error instanceof ApiError) {
    return error
  }

  // 대부분의 API는 `{ error: { code, message } }` 형식이지만, 대표사진
  // 새로고침의 409은 `{ code, message }`를 최상위에 내려준다.
  const responseBody = error.response?.data
  const serverError = responseBody?.error ?? responseBody

  return new ApiError({
    status: error.response?.status ?? 0,
    code: serverError?.code ?? 'NETWORK_ERROR',
    message: serverError?.message ?? '서버와 통신하지 못했습니다.',
  })
}
