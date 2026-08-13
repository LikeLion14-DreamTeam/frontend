import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Option from '../../components/common/Option'
import Progress from '../../components/common/Progress'
import Header from '../../components/layout/Header'

// TODO: 2~5번 질문 문구·선택지는 아직 디자인에 없어 임시값이다. 나오면 교체할 것.
const questions = [
  {
    text: '사진을 찍을 때 가장 자주 담는 대상은 무엇인가요?',
    hint: '여러 개 골라도 괜찮아요',
    options: [
      '풍경과 도시 전경',
      '사람과 표정',
      '음식과 카페',
      '건축과 디테일',
      '길 위의 우연한 순간',
    ],
  },
  {
    text: '질문 2 (문구 미정)',
    hint: '여러 개 골라도 괜찮아요',
    options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4', '선택지 5'],
  },
  {
    text: '질문 3 (문구 미정)',
    hint: '여러 개 골라도 괜찮아요',
    options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4', '선택지 5'],
  },
  {
    text: '질문 4 (문구 미정)',
    hint: '여러 개 골라도 괜찮아요',
    options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4', '선택지 5'],
  },
  {
    text: '질문 5 (문구 미정)',
    hint: '여러 개 골라도 괜찮아요',
    options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4', '선택지 5'],
  },
]

const TOTAL_ROUND = questions.length

const BasicQuestion = () => {
  const navigate = useNavigate()
  const [round, setRound] = useState(1)
  const [selected, setSelected] = useState([])

  const question = questions[round - 1]
  const isLastRound = round === TOTAL_ROUND

  const handleSelect = (option) => {
    if (selected.includes(option)) {
      setSelected(selected.filter((item) => item !== option))
      return
    }
    setSelected([...selected, option])
  }

  const handleNext = () => {
    // TODO: 응답 저장
    if (!isLastRound) {
      setRound(round + 1)
      setSelected([])
      return
    }
    navigate('/onboarding/ab-preference')
  }

  const handlePrev = () => {
    setRound(round - 1)
    setSelected([])
  }

  return (
    <>
      <Header to="/permission" />

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
                selected={selected.includes(option)}
                onClick={() => handleSelect(option)}
              >
                {option}
              </Option>
            ))}
          </OptionList>
        </Body>

        <Footer>
          <Button onClick={handleNext}>
            {isLastRound ? '완료' : '다음'}
          </Button>
          <Button $variant="ghost" onClick={handlePrev} disabled={round === 1}>
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
