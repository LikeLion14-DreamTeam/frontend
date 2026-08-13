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
}
