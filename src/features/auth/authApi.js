import apiClient from '../../api/client'
import {
  MOCK_CURRENT_USER_RESPONSE,
  MOCK_GOOGLE_LOGIN_RESPONSE,
} from './authMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

export const loginWithGoogle = async (googleIdToken) => {
  if (USE_MOCK) {
    return {
      ...MOCK_GOOGLE_LOGIN_RESPONSE,
      user: { ...MOCK_GOOGLE_LOGIN_RESPONSE.user },
    }
  }

  return apiClient.post('/auth/google', {
    google_id_token: googleIdToken,
  })
}

export const logout = async (sessionToken) => {
  if (USE_MOCK) {
    return
  }

  // 로컬 세션을 즉시 지워도 서버 요청에는 기존 토큰이 실리도록 명시한다.
  await apiClient.post('/auth/logout', undefined, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  })
}

export const getMyAccount = async () => {
  if (USE_MOCK) {
    return { ...MOCK_CURRENT_USER_RESPONSE }
  }

  return apiClient.get('/users/me')
}
