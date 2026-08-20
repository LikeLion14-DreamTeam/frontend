import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Choice from '../../components/common/Choice'
import Progress from '../../components/common/Progress'
import Header from '../../components/layout/Header'
import { saveSelectionRound } from '../../features/onboarding/selectionPhotoApi'
import {
  AB_PHOTO_ROUNDS,
  selectRandomPhotoSets,
} from '../../features/onboarding/selectionPhotoData'
import {
  getOnboardingFlowPath,
  isRelearningFlow,
} from '../../features/onboarding/onboardingFlow'
import { AB_SELECTION_STAGE } from '../../features/onboarding/onboardingProgressApi'
import {
  readRelearningDraft,
  updateRelearningDraft,
} from '../../features/onboarding/relearningDraft'
import useOnboardingStart from '../../features/onboarding/useOnboardingStart'

const TOTAL_ROUND = AB_PHOTO_ROUNDS.length
const PHOTO_SET_STORAGE_KEY = 'ab-preference'
const PREVIOUS_STAGE_LAST_ROUND = 5

const question = {
  text: 'A/B 취향 파악',
  hint: '더 끌리는 사진을 선택하세요',
}

const AbPreference = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const isRelearning = isRelearningFlow(location.search)
  const initialRound = location.state?.initialRound ?? 1
  const restorePreviousStage = location.state?.restorePreviousStage ?? false
  const [photoRounds] = useState(() =>
    selectRandomPhotoSets(AB_PHOTO_ROUNDS, {
      storageKey: PHOTO_SET_STORAGE_KEY,
    }),
  )
  const [answers, setAnswers] = useState(() => {
    const draft = isRelearning ? readRelearningDraft() : {}

    return (
      location.state?.abAnswers ??
      draft.abAnswers ??
      Array(TOTAL_ROUND).fill(null)
    )
  })
  const { isReady, round, setRound, syncAfterSave } = useOnboardingStart({
    stage: AB_SELECTION_STAGE,
    isRelearning,
    initialRound,
    restorePreviousStage,
    onProgressLoaded: (progress) => {
      setAnswers((currentAnswers) => {
        const nextAnswers = [...currentAnswers]

        progress.selection_photos?.forEach((selection) => {
          const answerIndex = selection.round_no - 1

          if (
            selection.status &&
            answerIndex >= 0 &&
            answerIndex < TOTAL_ROUND
          ) {
            nextAnswers[answerIndex] = selection.photo_id
          }
        })

        return nextAnswers
      })
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const photoRound = photoRounds[round - 1]
  const selectedPhotoId = answers[round - 1]
  const isLastRound = round === TOTAL_ROUND

  const handleSelect = (photoId) => {
    if (isSubmitting) return

    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers]
      nextAnswers[round - 1] = photoId

      if (isRelearning) {
        updateRelearningDraft({ abAnswers: nextAnswers })
      }

      return nextAnswers
    })
    setErrorMessage('')
  }

  const handleNext = async () => {
    if (!selectedPhotoId || isSubmitting) return

    // 무드보드에서 되돌아온 A/B 마지막 라운드는 이미 저장돼 있다. 서버 진행
    // 상태도 무드보드이므로 다시 저장하지 않고 다음 단계로 돌아간다.
    if (isLastRound && restorePreviousStage && !isRelearning) {
      navigate(getOnboardingFlowPath('/onboarding/moodboard', isRelearning), {
        state: {
          basicAnswers: location.state?.basicAnswers,
          abAnswers: answers,
        },
      })
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await saveSelectionRound({
        roundNo: photoRound.roundNo,
        candidatePhotoIds: photoRound.photos.map((photo) => photo.photoId),
        selectedPhotoIds: [selectedPhotoId],
      })

      if (!isLastRound) {
        setRound((currentRound) => currentRound + 1)
        return
      }

      // 서버가 아직 이 단계면 그쪽이 알려주는 라운드에 머문다.
      if (await syncAfterSave()) return

      navigate(
        getOnboardingFlowPath('/onboarding/moodboard', isRelearning),
        {
          state: {
            basicAnswers: location.state?.basicAnswers,
            abAnswers: answers,
          },
        },
      )
    } catch (error) {
      setErrorMessage(
        error.message ??
          '선택한 사진을 저장하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrev = () => {
    if (round === 1) {
      navigate(
        getOnboardingFlowPath('/onboarding/basic-question', isRelearning),
        {
          state: {
            initialRound: PREVIOUS_STAGE_LAST_ROUND,
            restorePreviousStage: true,
            basicAnswers:
              location.state?.basicAnswers ?? readRelearningDraft().basicAnswers,
          },
        },
      )
      return
    }

    setRound((currentRound) => currentRound - 1)
    setErrorMessage('')
  }

  if (!isReady) return null

  return (
    <>
      <Header
        to={getOnboardingFlowPath(
          '/onboarding/basic-question',
          isRelearning,
        )}
        state={{
          initialRound: PREVIOUS_STAGE_LAST_ROUND,
          restorePreviousStage: true,
          basicAnswers:
            location.state?.basicAnswers ?? readRelearningDraft().basicAnswers,
        }}
      />

      <OnboardingWrapper>

        <Body>
          <Progress current={round} total={TOTAL_ROUND} />

          <Content>
            <QuestionArea>
              <QuestionText>{question.text}</QuestionText>
              <QuestionHint>{question.hint}</QuestionHint>
            </QuestionArea>

            <PhotoPair>
              {photoRound.photos.map((photo) => (
                <Choice
                  key={photo.photoId}
                  label={photo.label}
                  src={photo.src}
                  alt={photo.alt}
                  selected={selectedPhotoId === photo.photoId}
                  onClick={() => handleSelect(photo.photoId)}
                  disabled={isSubmitting}
                />
              ))}
            </PhotoPair>
          </Content>
        </Body>

        <Footer>
          {errorMessage && (
            <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={!selectedPhotoId || isSubmitting}
          >
            {isSubmitting ? '저장 중...' : isLastRound ? '완료' : '다음'}
          </Button>
          <Button
            type="button"
            $variant="ghost"
            onClick={handlePrev}
            disabled={isSubmitting}
          >
            이전으로
          </Button>
        </Footer>

      </OnboardingWrapper>
    </>
  )
}

export default AbPreference

const OnboardingWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  /* 브라우저가 이미 제외한 58px을 헤더 높이에 중복 반영하지 않는다. */
  min-height: calc(
    var(--app-viewport-height) - 116px + var(--design-safe-top)
  );
  margin: 0 auto;
  padding: 0 24px 34px;
  display: flex;
  flex-direction: column;
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
`

const QuestionArea = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const QuestionText = styled.h2`
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
  color: var(--Text-Primary);
`

const QuestionHint = styled.p`
  font: var(--text-ui-body-m);
  color: var(--Text-Secondary);
`

const PhotoPair = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`

const Footer = styled.footer`
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const ErrorMessage = styled.p`
  color: #b42318;
  font: var(--text-ui-caption);
  text-align: center;
  word-break: keep-all;
`
