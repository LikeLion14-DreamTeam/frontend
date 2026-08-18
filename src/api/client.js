import axios from 'axios'
import { getSessionToken } from './session'
import { ApiError, createApiError } from './errors'

/**
 * 공용 Axios 인스턴스.
 *
 *   const trips = await apiClient.get('/trips')
 *   // trips 자체가 서버의 실제 데이터. response.data 를 꺼낼 필요 없다.
 *
 * - 세션 토큰은 요청 인터셉터가 자동으로 붙인다.
 * - 성공 응답은 `data` 래핑 없이 필드가 바로 온다. 응답 본문을 그대로 돌려준다.
 * - 실패는 전부 `ApiError` 로 통일해 던진다.
 * - S3 사전 서명 URL 업로드에는 이 인스턴스를 쓰지 않는다.
 *   baseURL 과 Authorization 헤더가 붙으면 안 되므로 순수 axios/fetch 를 쓴다.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getSessionToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    // 204 No Content 는 본문이 없다. 반환값을 쓰지 않는다.
    if (response.status === 204) {
      return null
    }

    const body = response.data

    // 서버가 200으로 실패를 내려주는 경우까지 에러로 통일한다.
    if (body?.success === false) {
      throw new ApiError({
        status: response.status,
        code: body.error?.code,
        message: body.error?.message,
      })
    }

    // 성공 응답은 data 래핑 없이 필드가 바로 온다(팀 확정 사항).
    return body
  },

  (error) => {
    return Promise.reject(createApiError(error))
  },
)

export default apiClient
