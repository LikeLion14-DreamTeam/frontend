import React, { useState } from 'react'
import styled from 'styled-components'
import ImagePlaceholder from '../../components/common/ImagePlaceholder'
import Header from '../../components/layout/Header'

const TOTAL_ROUND = 5

const AbPreference = () => {
  const [round, setRound] = useState(1)

  const handleSelect = () => {
    // TODO: 선택한 사진 저장
    if (round < TOTAL_ROUND) {
      setRound(round + 1)
      return
    }
    // TODO: 무드보드 취향 온보딩 화면으로 이동
  }

  const handlePrev = () => {
    setRound(round - 1)
  }

  return (
    <>
      <Header>A/B 취향 온보딩 화면</Header>

      <OnboardingWrapper>

        <ProgressArea>
          <Title>A/B 취향 파악</Title>
          <RoundCount>{round} / {TOTAL_ROUND}</RoundCount>
        </ProgressArea>

        <Description>더 끌리는 사진을 선택하세요</Description>

        <PhotoPair>
          <PhotoChoice as="button" onClick={handleSelect}>Image</PhotoChoice>
          <PhotoChoice as="button" onClick={handleSelect}>Image</PhotoChoice>
        </PhotoPair>

        <PrevButton onClick={handlePrev} disabled={round === 1}>
          &lt; 이전 사진
        </PrevButton>

        <Caption>선택하면 다음 사진 쌍으로 넘어갑니다</Caption>

      </OnboardingWrapper>
    </>
  )
}

export default AbPreference

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

const RoundCount = styled.span`
  font-size: 12px;
`

const Description = styled.p`
  font-size: 12px;
`

const PhotoPair = styled.div`
  width: 100%;
  display: flex;
  gap: 12px;
`

const PhotoChoice = styled(ImagePlaceholder)`
  flex: 1;
  height: 320px;
  font-family: inherit;
  cursor: pointer;
`

const PrevButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: #000;
  font-size: 12px;
  cursor: pointer;

  &:disabled {
    color: #9ca3af;
    cursor: default;
  }
`

const Caption = styled.p`
  font-size: 11px;
`
