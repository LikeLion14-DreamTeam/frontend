const MOCK_API_DEBUG_KEY = '__ORTE_MOCK_API__'

/** 개발용 mock API 호출 내역을 브라우저 콘솔에서 확인할 수 있게 보관한다. */
export const recordMockApiCall = ({
  method = 'POST',
  endpoint,
  payload,
  response,
}) => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return

  const previousDebugState = window[MOCK_API_DEBUG_KEY] ?? { calls: [] }
  const nextCall = {
    method,
    endpoint,
    response: { ...response },
  }

  if (payload !== undefined) {
    nextCall.payload = { ...payload }
  }

  window[MOCK_API_DEBUG_KEY] = {
    calls: [
      ...previousDebugState.calls,
      nextCall,
    ],
  }
}
