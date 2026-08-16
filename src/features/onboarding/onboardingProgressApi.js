import apiClient from '../../api/client'
import { getMockBasicQuestionResponses } from './basicQuestionMock'
import { recordMockApiCall } from './onboardingDebug'
import { getMockSelectionPhotos } from './selectionPhotoMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

/**
 * 온보딩 단계. 서버가 다음에 받기를 기대하는 자리를 가리킨다.
 *
 * `BASIC_QUESTION` 과 `AB_SELECTION` 은 2.6 명세에 나온 값이다.
 * TODO: 무드보드 단계와 완료 상태의 값은 명세에 없어 확인이 필요하다.
 */
export const BASIC_QUESTION_STAGE = 'BASIC_QUESTION'
export const AB_SELECTION_STAGE = 'AB_SELECTION'
export const MOODBOARD_STAGE = 'MOODBOARD'

/** 기본 질문 5라운드, A/B 5라운드(1~5), 무드보드 2라운드(6~7) */
const BASIC_QUESTION_ROUNDS = 5
const AB_ROUNDS = [1, 2, 3, 4, 5]
const MOODBOARD_ROUNDS = [6, 7]

/** mock 전용. 지금까지 저장된 값에서 다음에 받을 자리를 계산한다. */
const buildMockProgress = () => {
  const basicQuestionResponses = getMockBasicQuestionResponses()
  const selectionPhotos = getMockSelectionPhotos()

  // 한 라운드에 사진이 여러 장이라 라운드 단위로 묶어서 센다.
  const answeredSelectionRounds = new Set(
    selectionPhotos
      .filter((selection) => selection.status)
      .map((selection) => selection.round_no),
  )

  const nextAbRound = AB_ROUNDS.find(
    (roundNo) => !answeredSelectionRounds.has(roundNo),
  )
  const nextMoodboardRound = MOODBOARD_ROUNDS.find(
    (roundNo) => !answeredSelectionRounds.has(roundNo),
  )

  let currentStage = BASIC_QUESTION_STAGE
  let currentRound = basicQuestionResponses.length + 1

  if (basicQuestionResponses.length >= BASIC_QUESTION_ROUNDS) {
    if (nextAbRound) {
      currentStage = AB_SELECTION_STAGE
      currentRound = nextAbRound
    } else {
      currentStage = MOODBOARD_STAGE
      currentRound = nextMoodboardRound ?? MOODBOARD_ROUNDS.at(-1)
    }
  }

  const isCompleted =
    basicQuestionResponses.length >= BASIC_QUESTION_ROUNDS &&
    !nextAbRound &&
    !nextMoodboardRound

  return {
    current_stage: currentStage,
    current_round: currentRound,
    is_retrain: false,
    completed_at: isCompleted ? new Date().toISOString() : null,
    basic_question_responses: basicQuestionResponses,
    selection_photos: selectionPhotos,
  }
}

/**
 * API 명세 2.6: 온보딩 진행 상태 조회
 *
 * 서버가 사용자별로 "다음에 받을 라운드"를 들고 있어서, 화면이 항상 1라운드부터
 * 시작하면 어긋난다(2.1 이 `현재 진행 중인 라운드가 아닙니다` 로 거절한다).
 * 온보딩 화면에 들어올 때 이 값을 읽어 시작 지점을 맞춘다.
 *
 * 진행 기록이 없는 사용자가 처음 부르면 서버가 기본값으로 만들어 돌려준다.
 */
export const getOnboardingProgress = async () => {
  if (USE_MOCK) {
    const progress = buildMockProgress()

    recordMockApiCall({
      endpoint: '/users/me/onboarding/progress',
      payload: null,
      response: progress,
    })

    return progress
  }

  return apiClient.get('/users/me/onboarding/progress')
}
