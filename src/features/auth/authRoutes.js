export const getAuthenticatedEntryPath = (user) => {
  if (!user || user.permission_intro_shown === false) {
    return '/permission'
  }

  if (user.onboarding_completed === false) {
    return '/onboarding/preference-start'
  }

  return '/'
}

/** 로그인 전에 열었던 NFC 촬영 URL을 온보딩 완료 사용자에게 복원한다. */
export const getPostLoginPath = (user, from) => {
  const requiredEntryPath = getAuthenticatedEntryPath(user)

  if (requiredEntryPath !== '/' || !from?.pathname) {
    return requiredEntryPath
  }

  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
}
