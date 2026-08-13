import apiClient from '../../api/client'
import { MOCK_GOOGLE_LOGIN_RESPONSE } from './authMock'

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
