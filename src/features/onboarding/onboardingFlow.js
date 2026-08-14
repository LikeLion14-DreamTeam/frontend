const RELEARNING_MODE = 'relearning'

/** 재학습 흐름임을 새로고침 가능한 URL 쿼리로 전달한다. */
export const getOnboardingFlowPath = (pathname, isRelearning) => {
  if (!isRelearning) return pathname

  return `${pathname}?mode=${RELEARNING_MODE}`
}

export const isRelearningFlow = (search) =>
  new URLSearchParams(search).get('mode') === RELEARNING_MODE
