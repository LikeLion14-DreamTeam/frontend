const SESSION_TOKEN_KEY = 'orte_session_token'

/**
 * 세션 토큰(JWT) 저장소.
 *
 * 로그인 담당자가 로그인 성공 시 `setSessionToken(data.session_token)`,
 * 로그아웃 시 `clearSessionToken()` 을 호출한다.
 * 요청 헤더에 토큰을 붙이는 건 `client.js` 의 인터셉터가 알아서 한다.
 */
export const getSessionToken = () => {
  return sessionStorage.getItem(SESSION_TOKEN_KEY)
}

export const setSessionToken = (token) => {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token)
}

export const clearSessionToken = () => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
}
