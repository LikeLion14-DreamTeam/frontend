export const getAuthenticatedEntryPath = (user) => {
  if (!user || user.permission_intro_shown === false) {
    return '/permission'
  }

  if (user.onboarding_completed === false) {
    return '/onboarding/preference-start'
  }

  return '/'
}
