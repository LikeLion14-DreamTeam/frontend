import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Option from '../../components/common/Option'
import Progress from '../../components/common/Progress'
import Header from '../../components/layout/Header'
import { saveBasicQuestionResponse } from '../../features/onboarding/basicQuestionApi'
import {
  getOnboardingFlowPath,
  isRelearningFlow,
} from '../../features/onboarding/onboardingFlow'

const questions = [
  {
    text: '여행 사진, 어떤 톤이 더 좋아요?',
    hint: '더 끌리는 하나를 골라주세요',
    options: ['환하고 밝은 느낌', '어둡고 무드있는 느낌'],
  },
  {
    text: '색감은 어느 쪽이 끌리나요?',
    hint: '더 끌리는 하나를 골라주세요',
    options: ['선명하고 생생한 색', '차분하고 톤 다운된 색'],
  },
  {
    text: '사진의 분위기는요?',
    hint: '더 끌리는 하나를 골라주세요',
    options: ['따뜻한 느낌', '차가운 느낌'],
  },
  {
    text: '화면 구성은 어떤 게 좋아요?',
    hint: '더 끌리는 하나를 골라주세요',
    options: ['여백이 있는 여유로운 구도', '꽉 차고 밀도 있는 구도'],
  },
  {
    text: '여행에서 더 남기고 싶은 건요?',
    hint: '더 끌리는 하나를 골라주세요',
    options: ['그 순간 함께 한 사람들', '그 순간의 풍경'],
  },
]

const TOTAL_ROUND = questions.length

const BasicQuestion = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const isRelearning = isRelearningFlow(location.search)
  const [round, setRound] = useState(1)
  const [answers, setAnswers] = useState(() =>
    Array(TOTAL_ROUND).fill(null),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const question = questions[round - 1]
  const selected = answers[round - 1]
  const isLastRound = round === TOTAL_ROUND

  const handleSelect = (option) => {
    if (isSubmitting) return

    setAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers]
      nextAnswers[round - 1] = option
      return nextAnswers
    })
    setErrorMessage('')
  }

  const handleNext = async () => {
    if (!selected || isSubmitting) return

    if (!isLastRound) {
      setRound((currentRound) => currentRound + 1)
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await Promise.all(
        answers.map((response, index) =>
          saveBasicQuestionResponse({
            roundNo: index + 1,
            response,
            replaceExisting: isRelearning,
          }),
        ),
      )
      navigate(
        getOnboardingFlowPath('/onboarding/ab-preference', isRelearning),
      )
    } catch (error) {
      setErrorMessage(
        error.message ??
          '응답을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
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
      <Header to={isRelearning ? '/mypage' : '/permission'} />

      <OnboardingWrapper>

        <Body>
          <Progress current={round} total={TOTAL_ROUND} />

          <QuestionArea>
            <QuestionText>{question.text}</QuestionText>
            <QuestionHint>{question.hint}</QuestionHint>
          </QuestionArea>

          <OptionList>
            {question.options.map((option) => (
              <Option
                key={option}
                selected={selected === option}
                onClick={() => handleSelect(option)}
                disabled={isSubmitting}
              >
                {option}
              </Option>
            ))}
          </OptionList>
        </Body>

        <Footer>
          {errorMessage && (
            <ErrorMessage role="alert">{errorMessage}</ErrorMessage>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={!selected || isSubmitting}
          >
            {isSubmitting ? '저장 중...' : isLastRound ? '완료' : '다음'}
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

export default BasicQuestion

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

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
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
