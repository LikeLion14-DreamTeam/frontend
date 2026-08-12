import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Header from '../../components/layout/Header'
import NavBar from '../../components/layout/NavBar'

const tripSummary = {
  selectedPins: 7,
  connectedPhotos: 42,
  period: '2024.11.03 - 11.08',
}

const pinRecords = [
  {
    id: 1,
    place: '파리 에펠탑 근처',
    date: '2024.11.03',
    photos: 8,
  },
  {
    id: 2,
    place: '루브르 박물관 앞',
    date: '2024.11.04',
    photos: 6,
  },
  {
    id: 3,
    place: '몽마르트르 언덕',
    date: '2024.11.05',
    photos: 11,
  },
  {
    id: 4,
    place: '센 강변 산책로',
    date: '2024.11.06',
    photos: 5,
  },
  {
    id: 5,
    place: '베르사유 궁전 정원',
    date: '2024.11.08',
    photos: 7,
  },
]

const TripManagement = () => {
  return (
    <>
      <Header>여행 구간 관리 화면</Header>

      <TripManagementWrapper>
        <Title>여행 구간 관리</Title>

        <Section>
          <Card>
            <SectionTitle>구간 요약</SectionTitle>
            <Card $padding="5px">
              <SummaryGrid>
                <SummaryItem>
                  <SummaryLabel>선택된 핀</SummaryLabel>
                  <SummaryValue>{tripSummary.selectedPins}개</SummaryValue>
                </SummaryItem>
                <SummaryItem>
                  <SummaryLabel>연결된 사진</SummaryLabel>
                  <SummaryValue>{tripSummary.connectedPhotos}장</SummaryValue>
                </SummaryItem>
                <SummaryItem>
                  <SummaryLabel>여행 기간</SummaryLabel>
                  <SummaryValue>{tripSummary.period}</SummaryValue>
                </SummaryItem>
              </SummaryGrid>
            </Card>
          </Card>
        </Section>

        <Section>
          <SectionTitle>포함된 핀 기록</SectionTitle>
          <PinList>
            {pinRecords.map((pin) => (
              <Card key={pin.id} $padding="12px">
                <PinItem>
                  <PinThumbnail>핀</PinThumbnail>
                  <PinText>
                    <PinPlace>{pin.place}</PinPlace>
                    <PinMeta>
                      {pin.date} · 사진 {pin.photos}장
                    </PinMeta>
                  </PinText>
                </PinItem>
              </Card>
            ))}
          </PinList>
        </Section>

        <ActionArea>
          <Button as={Link} to="/trip-management/edit">
            구간 상세·편집
          </Button>
        </ActionArea>
      </TripManagementWrapper>

      <NavBar />
    </>
  )
}

export default TripManagement

const TripManagementWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 24px 82px;
`

const Title = styled.h2`
  margin-bottom: 16px;
  font-size: 22px;
`

const Section = styled.section`
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SectionTitle = styled.h3`
  font-size: 16px;
`

const SummaryGrid = styled.div`
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`

const SummaryItem = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SummaryLabel = styled.span`
  color: #555;
  font-size: 12px;
`

const SummaryValue = styled.strong`
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  word-break: keep-all;
`

const PinList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const PinItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const PinThumbnail = styled.div`
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  border-radius: 50%;
  background: #d7dce2;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
`

const PinText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const PinPlace = styled.p`
  color: #111827;
  font-size: 14px;
  font-weight: 600;
`

const PinMeta = styled.p`
  color: #555;
  font-size: 12px;
`

const ActionArea = styled.div`
  margin-top: 18px;
  width: 120px;
`
