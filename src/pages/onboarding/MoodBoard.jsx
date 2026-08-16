import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Progress from '../../components/common/Progress'
import Tile from '../../components/common/Tile'
import Header from '../../components/layout/Header'
import { updateMyAccount } from '../../features/auth/authApi'
import { getAuthenticatedEntryPath } from '../../features/auth/authRoutes'
import useAuthStore from '../../features/auth/useAuthStore'
import { saveSelectionRound } from '../../features/onboarding/selectionPhotoApi'
import {
  MOODBOARD_PHOTO_ROUNDS,
  selectRandomPhotoSets,
} from '../../features/onboarding/selectionPhotoData'
import {
  getOnboardingFlowPath,
  isRelearningFlow,
} from '../../features/onboarding/onboardingFlow'

const TOTAL_ROUND = MOODBOARD_PHOTO_ROUNDS.length
const SELECT_LIMIT = 3

const MoodBoard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const isRelearning = isRelearningFlow(location.search)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [photoRounds] = useState(() =>
    selectRandomPhotoSets(MOODBOARD_PHOTO_ROUNDS),
  )
  const [round, setRound] = useState(1)
  const [answers, setAnswers] = useState(() =>
    Array.from({ length: TOTAL_ROUND }, () => []),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const photoRound = photoRounds[round - 1]
  const selectedPhotoIds = answers[round - 1]
  const isLastRound = round === TOTAL_ROUND
  const isFilled = selectedPhotoIds.length === SELECT_LIMIT

  const handleSelect = (photoId) => {
    if (isSubmitting) return

    setAnswers((currentAnswers) => {
      const currentSelection = currentAnswers[round - 1]
      const isSelected = currentSelection.includes(photoId)

      if (!isSelected && currentSelection.length === SELECT_LIMIT) {
        return currentAnswers
      }

      const nextAnswers = currentAnswers.map((answer) => [...answer])
      nextAnswers[round - 1] = isSelected
        ? currentSelection.filter((item) => item !== photoId)
        : [...currentSelection, photoId]

      return nextAnswers
    })
    setErrorMessage('')
  }

  const handleNext = async () => {
    if (!isFilled || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await saveSelectionRound({
        roundNo: photoRound.roundNo,
        candidatePhotoIds: photoRound.photos.map((photo) => photo.photoId),
        selectedPhotoIds,
      })

      if (!isLastRound) {
        setRound((currentRound) => currentRound + 1)
        return
      }

      if (isRelearning) {
        navigate('/mypage', {
          replace: true,
          state: { relearningCompleted: true },
        })
        return
      }

      const updatedAccount = await updateMyAccount({
        onboarding_completed: true,
        permission_intro_shown: user?.permission_intro_shown ?? false,
      })
      const updatedUser = { ...(user ?? {}), ...updatedAccount }

      setUser(updatedUser)
      navigate(getAuthenticatedEntryPath(updatedUser), { replace: true })
    } catch (error) {
      setErrorMessage(
        error.message ??
          '선택 결과를 저장하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrev = () => {
    setRound((currentRound) => currentRound - 1)
    setErrorMessage('')
  }

  return (
    <>
      <Header
        to={getOnboardingFlowPath(
          '/onboarding/ab-preference',
          isRelearning,
        )}
      />

      <OnboardingWrapper>

        <Body>
          <Progress current={round} total={TOTAL_ROUND} />

          <Head>
            <Title>나만의 사진 감각 찾기</Title>
            <Description>
              마음에 드는 사진 {SELECT_LIMIT}장을 선택해 주세요
            </Description>
          </Head>

          <CounterRow>
            <Counter>
              {selectedPhotoIds.length} / {SELECT_LIMIT} 선택됨
            </Counter>
          </CounterRow>

          <PhotoGrid>
            {photoRound.photos.map((photo) => (
              <Tile
                key={photo.photoId}
                src={photo.src}
                alt={photo.alt}
                selected={selectedPhotoIds.includes(photo.photoId)}
                onClick={() => handleSelect(photo.photoId)}
                disabled={isSubmitting}
              />
            ))}
          </PhotoGrid>
        </Body>

        <Footer>
          {errorMessage && (
            <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={!isFilled || isSubmitting}
          >
            {isSubmitting
              ? '저장 중...'
              : !isFilled
              ? `사진 ${SELECT_LIMIT}장을 모두 골라주세요`
              : isLastRound
                ? '완료'
                : '다음'}
          </Button>
          <Button
            type="button"
            $variant="ghost"
            onClick={handlePrev}
            disabled={round === 1 || isSubmitting}
          >
            이전으로
          </Button>
        </Footer>

      </OnboardingWrapper>
    </>
  )
}

export default MoodBoard

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
  gap: 16px;
`

const Head = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h2`
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
  color: var(--Text-Primary);
`

const Description = styled.p`
  font: var(--text-ui-body-m);
  color: var(--Text-Secondary);
`

const CounterRow = styled.div`
  display: flex;
  justify-content: flex-end;
`

const Counter = styled.span`
  padding: 5px 12px;
  border-radius: 12px;
  background: rgb(197 161 91 / 16%);
  font: var(--text-ui-caption);
  color: var(--Primary-Cognac);
  white-space: nowrap;
`

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 10px;
  row-gap: 16px;
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
