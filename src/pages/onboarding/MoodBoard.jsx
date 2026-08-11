import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ImagePlaceholder from '../../components/common/ImagePlaceholder'
import Header from '../../components/layout/Header'

const TOTAL_ROUND = 2
const SELECT_LIMIT = 3

const rounds = Array.from({ length: TOTAL_ROUND }, (_, index) => index + 1)
const photos = Array.from({ length: 9 }, (_, index) => index)

const MoodBoard = () => {
  const navigate = useNavigate()
  const [round, setRound] = useState(1)
  const [selected, setSelected] = useState([])

  const isLastRound = round === TOTAL_ROUND

  const handleSelect = (photo) => {
    if (selected.includes(photo)) {
      setSelected(selected.filter((item) => item !== photo))
      return
    }
    if (selected.length === SELECT_LIMIT) return
    setSelected([...selected, photo])
  }

  const handleNext = () => {
    // TODO: 선택한 사진 저장
    if (!isLastRound) {
      setRound(round + 1)
      setSelected([])
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <>
      <Header>무드보드 취향 온보딩 화면</Header>

      <OnboardingWrapper>

        <TitleArea>
          <Title>나만의 사진 감각 찾기</Title>
          <Description>마음에 드는 사진 {SELECT_LIMIT}장을 선택해 주세요</Description>
        </TitleArea>

        <RoundList>
          {rounds.map((item) => (
            <RoundChip key={item} $active={item === round}>{item}</RoundChip>
          ))}
        </RoundList>

        <PhotoGrid>
          {photos.map((photo) => (
            <Photo
              key={photo}
              as="button"
              $selected={selected.includes(photo)}
              onClick={() => handleSelect(photo)}
            >
              Image
            </Photo>
          ))}
        </PhotoGrid>

        <NextButton onClick={handleNext}>
          {isLastRound ? '선택완료' : '다음 라운드로'}
        </NextButton>

      </OnboardingWrapper>
    </>
  )
}

export default MoodBoard

const OnboardingWrapper = styled.main`
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const TitleArea = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
`

const Description = styled.p`
  font-size: 12px;
`

const RoundList = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
`

const RoundChip = styled.span`
  min-width: 40px;
  padding: 6px 12px;
  border: 1px solid ${({ $active }) => ($active ? '#1f2937' : '#e5e7eb')};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#1f2937' : '#f3f4f6')};
  color: ${({ $active }) => ($active ? '#fff' : '#1f2937')};
  font-size: 14px;
  font-weight: 500;
  text-align: center;
`

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 6px;
  row-gap: 12px;
`

const Photo = styled(ImagePlaceholder)`
  height: 116px;
  border-style: ${({ $selected }) => ($selected ? 'solid' : 'dashed')};
  border-color: ${({ $selected }) => ($selected ? '#1f2937' : '#d1d5db')};
  font-family: inherit;
  cursor: pointer;
`

const NextButton = styled.button`
  width: 100%;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #1f2937;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`
