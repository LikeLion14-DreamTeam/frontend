import {
  AB_SELECTION_STAGE,
  BASIC_QUESTION_STAGE,
  MOODBOARD_STAGE,
} from './onboardingProgressApi'

const RELEARNING_MODE = 'relearning'

/** 2.6 의 단계 값과 그 단계를 진행하는 화면을 잇는다. */
export const ONBOARDING_STAGE_PATHS = {
  [BASIC_QUESTION_STAGE]: '/onboarding/basic-question',
  [AB_SELECTION_STAGE]: '/onboarding/ab-preference',
  [MOODBOARD_STAGE]: '/onboarding/moodboard',
}

/** 재학습 흐름임을 새로고침 가능한 URL 쿼리로 전달한다. */
export const getOnboardingFlowPath = (pathname, isRelearning) => {
  if (!isRelearning) return pathname

  return `${pathname}?mode=${RELEARNING_MODE}`
}

export const isRelearningFlow = (search) =>
  new URLSearchParams(search).get('mode') === RELEARNING_MODE
