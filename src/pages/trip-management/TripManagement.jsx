import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Header from '../../components/layout/Header'
import NavBar from '../../components/layout/NavBar'

const currentSegment = {
  city: '서울',
  period: '2025.06.14 ~',
  pins: 4,
  photos: 21,
}

const pastSegments = [
  {
    id: 1,
    city: '파리 · 암스테르담',
    meta: '2024.09.12 ~ 09.27 · 핀 12개',
  },
  {
    id: 2,
    city: '도쿄 · 교토',
    meta: '2024.03.04 ~ 03.14 · 핀 9개',
  },
  {
    id: 3,
    city: '바르셀로나',
    meta: '2023.11.01 ~ 11.10 · 핀 7개',
  },
]

const TripManagement = () => {
  return (
    <>
      <Header to="/" />

      <TripManagementWrapper>
        <Head>
          <Title>여행 구간</Title>
          <Description>
            핀의 위치와 날짜로 자동으로 묶었어요. 다르게 나누고 싶으면 직접 수정할 수 있어요.
          </Description>
        </Head>

        <ActiveSegment>
          <SegmentRow>
            <SegmentThumbnail $size={56} aria-hidden="true" />
            <SegmentText>
              <ActiveTag>기록 중</ActiveTag>
              <ActiveTitle>{currentSegment.city}</ActiveTitle>
              <SegmentMeta>
                {currentSegment.period} · 핀 {currentSegment.pins}개 · 사진 {currentSegment.photos}장
              </SegmentMeta>
            </SegmentText>
          </SegmentRow>

          <SecondaryButton as={Link} to="/trip-management/edit">
            이 구간 마치고 포토북 만들기
          </SecondaryButton>
        </ActiveSegment>

        <PastTitle>지난 구간 3개</PastTitle>
        <PastSegments>
          {pastSegments.map((segment) => (
            <PastSegmentLink key={segment.id} to="/trip-management/edit">
              <SegmentThumbnail $size={52} aria-hidden="true" />
              <SegmentText>
                <PastSegmentTitle>{segment.city}</PastSegmentTitle>
                <PastSegmentMeta>{segment.meta}</PastSegmentMeta>
              </SegmentText>
              <Chevron aria-hidden="true" />
            </PastSegmentLink>
          ))}
        </PastSegments>

        <AddButton as={Link} to="/trip-management/edit">
          <Plus aria-hidden="true">+</Plus>
          구간 직접 만들기
        </AddButton>
      </TripManagementWrapper>

      <NavBar />
    </>
  )
}

export default TripManagement

const TripManagementWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: calc(100vh - 116px);
  margin: 0 auto;
  padding: 0 24px 92px;
  background: var(--Background-Base);
  color: var(--Text-Primary);
`

const Head = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h2`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: 0;
`

const Description = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  word-break: keep-all;
`

const ActiveSegment = styled.section`
  width: 100%;
  margin-top: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1.5px solid var(--Primary-Cognac);
  border-radius: 16px;
  background: rgb(181 118 59 / 9%);
`

const SegmentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`

const SegmentThumbnail = styled.div`
  position: relative;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  flex: 0 0 ${({ $size }) => $size}px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--Map-Land);

  &::before {
    content: '';
    position: absolute;
    left: 6px;
    bottom: 5px;
    width: 0;
    height: 0;
    border-left: ${({ $size }) => Math.round($size * 0.28)}px solid transparent;
    border-right: ${({ $size }) => Math.round($size * 0.28)}px solid transparent;
    border-bottom: ${({ $size }) => Math.round($size * 0.55)}px solid #d8cdbd;
  }

  &::after {
    content: '';
    position: absolute;
    top: ${({ $size }) => Math.round($size * 0.18)}px;
    right: ${({ $size }) => Math.round($size * 0.2)}px;
    width: ${({ $size }) => Math.round($size * 0.15)}px;
    height: ${({ $size }) => Math.round($size * 0.15)}px;
    border-radius: 999px;
    background: #dec48e;
  }
`

const SegmentText = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`

const ActiveTag = styled.span`
  padding: 2px 7px;
  border-radius: 5px;
  background: var(--Primary-Cognac);
  color: var(--Text-Inverse);
  font: 400 10px/18px var(--font-sans);
`

const ActiveTitle = styled.h3`
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
`

const SegmentMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const SecondaryButton = styled(Link)`
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(181 118 59 / 55%);
  border-radius: 21px;
  color: var(--Primary-Cognac);
  background: transparent;
  font: var(--text-ui-button);
  text-decoration: none;
`

const PastTitle = styled.p`
  margin-top: 20px;
  color: var(--Text-Secondary);
  font: var(--text-ui-label);
`

const PastSegments = styled.section`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const PastSegmentLink = styled(Link)`
  width: 100%;
  min-height: 80px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--Border-Default);
  border-radius: 14px;
  background: var(--Surface-Base);
  color: inherit;
  text-decoration: none;
`

const PastSegmentTitle = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const PastSegmentMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const Chevron = styled.span`
  width: 8px;
  height: 14px;
  flex: 0 0 8px;
  border-top: 1.5px solid var(--Secondary-Taupe);
  border-right: 1.5px solid var(--Secondary-Taupe);
  transform: rotate(45deg);
`

const AddButton = styled(Link)`
  width: 100%;
  min-height: 48px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed var(--Border-Default);
  border-radius: 24px;
  color: var(--Text-Secondary);
  background: transparent;
  font: var(--text-ui-button);
  text-decoration: none;
`

const Plus = styled.span`
  font-size: 24px;
  line-height: 1;
`
