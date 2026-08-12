import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Choice from '../../components/common/Choice'
import Progress from '../../components/common/Progress'
import Header from '../../components/layout/Header'
import paperBg from '../../assets/images/paper-bg.webp'

const TOTAL_ROUND = 5

const question = {
  text: 'A/B 취향 파악',
  hint: '더 끌리는 사진을 선택하세요',
}

const AbPreference = () => {
  const navigate = useNavigate()
  const [round, setRound] = useState(1)
  const [selected, setSelected] = useState(null)

  const isLastRound = round === TOTAL_ROUND

  const handleSelect = (choice) => {
    setSelected(choice)
  }

  const handleNext = () => {
    // TODO: 선택한 사진 저장
    if (!isLastRound) {
      setRound(round + 1)
      setSelected(null)
      return
    }
    navigate('/onboarding/moodboard')
  }

  const handlePrev = () => {
    setRound(round - 1)
    setSelected(null)
  }

  return (
    <PageBackground>
      <Header to="/onboarding/basic-question" />

      <OnboardingWrapper>

        <Body>
          <Progress current={round} total={TOTAL_ROUND} />

          <Content>
            <QuestionArea>
              <QuestionText>{question.text}</QuestionText>
              <QuestionHint>{question.hint}</QuestionHint>
            </QuestionArea>

            <PhotoPair>
              <Choice
                label="A"
                selected={selected === 'A'}
                onClick={() => handleSelect('A')}
              />
              <Choice
                label="B"
                selected={selected === 'B'}
                onClick={() => handleSelect('B')}
              />
            </PhotoPair>
          </Content>
        </Body>

        <Footer>
          <Button onClick={handleNext} disabled={!selected}>
            {isLastRound ? '완료' : '다음'}
          </Button>
          <Button $variant="ghost" onClick={handlePrev} disabled={round === 1}>
            이전으로
          </Button>
        </Footer>

      </OnboardingWrapper>
    </PageBackground>
  )
}

export default AbPreference

const PageBackground = styled.div`
  min-height: 100vh;
  /* 402px = 피그마 프레임 폭. cover로 늘리면 종이 결이 확대돼 얼룩처럼 보인다. */
  background: url(${paperBg}) top center / 402px auto repeat var(--Background-Base);

  /* 헤더의 단색 배경이 종이 질감을 가리지 않도록 한다. */
  & > header {
    background: transparent;
  }
`

const OnboardingWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  /* 헤더(116px)를 뺀 나머지를 채워 푸터를 아래로 밀어낸다. */
  min-height: calc(100vh - 116px);
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
