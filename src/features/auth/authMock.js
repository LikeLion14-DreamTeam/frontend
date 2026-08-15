export const MOCK_GOOGLE_LOGIN_RESPONSE = {
  session_token: 'mock-session-token',
  user: {
    user_id: 1,
    email: 'traveler@example.com',
    created_at: '2026-08-01T00:00:00.000000Z',
    onboarding_completed: false,
    permission_intro_shown: false,
    account_identifier: 'mock-google-oauth-sub-id',
  },
}

export const MOCK_CURRENT_USER_RESPONSE = {
  ...MOCK_GOOGLE_LOGIN_RESPONSE.user,
  pin_count: 4,
  completed_trip_count: 1,
  visited_city_count: 1,
}

export const updateMockAccount = ({
  onboarding_completed,
  permission_intro_shown,
}) => {
  const updatedAccount = {
    user_id: MOCK_CURRENT_USER_RESPONSE.user_id,
    onboarding_completed,
    permission_intro_shown,
  }

  Object.assign(MOCK_CURRENT_USER_RESPONSE, updatedAccount)
  Object.assign(MOCK_GOOGLE_LOGIN_RESPONSE.user, updatedAccount)

  return { ...updatedAccount }
}
