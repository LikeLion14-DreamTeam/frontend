import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthenticatedEntryPath } from '../auth/authRoutes'
import useAuthStore from '../auth/useAuthStore'
import {
  COMPLETED_STAGE,
  getOnboardingProgress,
} from './onboardingProgressApi'
import { getOnboardingFlowPath, ONBOARDING_STAGE_PATHS } from './onboardingFlow'

/**
 * 온보딩 화면이 서버가 기다리는 자리에서 시작하도록 맞춘다.
 *
 * 서버가 사용자별로 다음에 받을 단계·라운드를 들고 있어서, 화면이 늘 1라운드부터
 * 시작하면 어긋난다(2.1 이 `현재 진행 중인 라운드가 아닙니다` 로 거절한다).
 * 들어올 때 2.6 을 읽어 시작 라운드를 정하고, 단계가 다르면 그 화면으로 보낸다.
 *
 * 재학습은 예외다. 완주한 사용자가 2.1 에 1라운드를 보내는 순간 서버가 기록을
 * 지우고 처음으로 되돌리므로, 조회 결과가 `COMPLETED` 여도 그대로 1라운드에서 시작한다.
 *
 * 라운드 상태를 여기서 들고 있는다. 화면이 따로 `useState` 로 잡으면 첫 렌더의
 * 값에 고정돼, 나중에 도착한 조회 결과가 반영되지 않는다.
 *
 * @param stage 이 화면이 담당하는 2.6 단계 값
 * @param isRelearning 재학습 흐름인지
 * @returns `{ isReady, round, setRound }` — 준비 전에는 화면을 그리지 않는다
 */
const useOnboardingStart = ({ stage, isRelearning }) => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [isReady, setIsReady] = useState(false)
  const [round, setRound] = useState(1)

  useEffect(() => {
    if (isRelearning) {
      setIsReady(true)
      return undefined
    }

    let ignore = false

    const load = async () => {
      try {
        const progress = await getOnboardingProgress()
        if (ignore) return

        if (progress.current_stage === COMPLETED_STAGE) {
          navigate(getAuthenticatedEntryPath(user), { replace: true })
          return
        }

        const stagePath = ONBOARDING_STAGE_PATHS[progress.current_stage]

        if (progress.current_stage !== stage && stagePath) {
          navigate(getOnboardingFlowPath(stagePath, false), { replace: true })
          return
        }

        setRound(progress.current_round)
        setIsReady(true)
      } catch {
        // 조회에 실패해도 온보딩을 막지는 않는다. 1라운드부터 시작한다.
        if (!ignore) setIsReady(true)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [isRelearning, navigate, stage, user])

  return { isReady, round, setRound }
}

export default useOnboardingStart
