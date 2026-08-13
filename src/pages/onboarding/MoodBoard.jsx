import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Progress from '../../components/common/Progress'
import Tile from '../../components/common/Tile'
import Header from '../../components/layout/Header'

const TOTAL_ROUND = 2
const SELECT_LIMIT = 3

const photos = Array.from({ length: 9 }, (_, index) => index)

const MoodBoard = () => {
  const navigate = useNavigate()
  const [round, setRound] = useState(1)
  const [selected, setSelected] = useState([])

  const isLastRound = round === TOTAL_ROUND
  const isFilled = selected.length === SELECT_LIMIT

  const handleSelect = (photo) => {
    if (selected.includes(photo)) {
      setSelected(selected.filter((item) => item !== photo))
      return
    }
    if (isFilled) return

    setSelected([...selected, photo])
  }

  const handleNext = () => {
    // TODO: 선택한 사진 저장
    setSelected([])

    if (!isLastRound) {
      setRound(round + 1)
      return
    }
    navigate('/', { replace: true })
  }

  const handlePrev = () => {
    setRound(round - 1)
    setSelected([])
  }

  return (
    <>
      <Header to="/onboarding/ab-preference" />

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
              {selected.length} / {SELECT_LIMIT} 선택됨
            </Counter>
          </CounterRow>

          <PhotoGrid>
            {photos.map((photo) => (
              <Tile
                key={photo}
                selected={selected.includes(photo)}
                onClick={() => handleSelect(photo)}
              />
            ))}
          </PhotoGrid>
        </Body>

        <Footer>
          <Button onClick={handleNext} disabled={!isFilled}>
            {!isFilled
              ? `사진 ${SELECT_LIMIT}장을 모두 골라주세요`
              : isLastRound
                ? '완료'
                : '다음'}
          </Button>
          <Button $variant="ghost" onClick={handlePrev} disabled={round === 1}>
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
