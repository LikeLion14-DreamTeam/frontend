import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../../components/common/Card'
import Header from '../../components/layout/Header'

const question = {
  step: 3,
  totalStep: 7,
  categories: ['chip1', 'chip2', 'chip3'],
  text: '사진을 찍을 때 가장 자주 담는 대상은 무엇인가요?',
  options: ['인물 중심', '풍경·자연', '도시·건축', '음식·정물', '순간·감성'],
}

const BasicQuestion = () => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  const handleNext = () => {
    // TODO: 응답 저장
    navigate('/onboarding/ab-preference')
  }

  return (
    <>
      <Header>기본 질문 온보딩 화면</Header>

      <OnboardingWrapper>

        <ProgressArea>
          <Title>취향 설정</Title>
          <StepCount>{question.step} / {question.totalStep}</StepCount>
        </ProgressArea>

        <QuestionCard $padding="12px">
          <CategoryArea>
            <CategoryLabel />
            <CategoryList>
              {question.categories.map((category) => (
                <Chip key={category}>{category}</Chip>
              ))}
            </CategoryList>
          </CategoryArea>
          <QuestionText>{question.text}</QuestionText>
        </QuestionCard>

        <OptionList>
          {question.options.map((option) => (
            <Option
              key={option}
              $selected={selected === option}
              onClick={() => setSelected(option)}
            >
              {option}
            </Option>
          ))}
        </OptionList>

        <NextButton onClick={handleNext}>다음</NextButton>

      </OnboardingWrapper>
    </>
  )
}

export default BasicQuestion

const OnboardingWrapper = styled.main`
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
`

const ProgressArea = styled.section`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
`

const StepCount = styled.span`
  font-size: 12px;
`

const QuestionCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9fafb;
`

const CategoryArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const CategoryLabel = styled.div`
  width: 44px;
  height: 10px;
  border-radius: 4px;
  background: #e5e7eb;
`

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

const Chip = styled.button`
  min-width: 40px;
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f3f4f6;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`

const QuestionText = styled.p`
  font-size: 12px;
`

const OptionList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Option = styled.button`
  width: 100%;
  padding: 6px 12px;
  border: 1px solid ${({ $selected }) => ($selected ? '#1f2937' : '#e5e7eb')};
  border-radius: 999px;
  background: #f3f4f6;
  color: #1f2937;
  font-size: 14px;
  font-weight: ${({ $selected }) => ($selected ? 600 : 500)};
  text-align: center;
  cursor: pointer;
`

const NextButton = styled.button`
  min-width: 60px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #1f2937;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`
