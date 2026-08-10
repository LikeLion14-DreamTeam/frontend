import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Header from '../components/layout/Header'
import NavBar from '../components/layout/NavBar'

const recentPins = [
  { id: 1, place: '장소1', date: '날짜1' },
  { id: 2, place: '장소2', date: '날짜2' },
  { id: 3, place: '장소3', date: '날짜3' },
]

const exploreItems = [
  { title: '기록 탐색', subtitle: '여행 기록', path: '/record' },
  { title: '포토북', subtitle: '아카이브', path: '/archive' },
  { title: '가상 여권', subtitle: '가상 여권', path: '/' },
]

const Home = () => {
  return (
    <>
      <Header>홈 화면</Header>

      <HomeWrapper>

        <Title>나의 여행 기록</Title>

        <Section>
          <Card>
            <SectionTitle>진행 중인 여정</SectionTitle>
            <JourneyTitle>여정타이틀</JourneyTitle>
            <JourneyMeta>여정정보</JourneyMeta>
            <JourneyFooter>
              <TextLink to="/trip">여행 구간 관리</TextLink>
            </JourneyFooter>
          </Card>
        </Section>

        <Section>
          <SectionTitle>최근 기록</SectionTitle>
          <RecentList>
            {recentPins.map((pin) => (
              <Card key={pin.id} $padding="12px">
                <RecentItem>
                  <PinIcon>핀</PinIcon>
                  <RecentText>
                    <RecentTitle>{pin.place}</RecentTitle>
                    <RecentDate>{pin.date}</RecentDate>
                  </RecentText>
                </RecentItem>
              </Card>
            ))}
          </RecentList>
        </Section>

        <Section>
          <SectionTitle>둘러보기</SectionTitle>
          <ExploreGrid>
            {exploreItems.map((item) => (
              <ExploreCard as={Link} to={item.path} key={item.title} $padding="10px">
                <Thumbnail>{item.title}</Thumbnail>
                <ExploreTitle>{item.subtitle}</ExploreTitle>
              </ExploreCard>
            ))}
          </ExploreGrid>
        </Section>

        <Section>
          <Button>수동 여행 기록 시작</Button>
        </Section>

      </HomeWrapper>
      
      <NavBar />
    </>
  )
}

export default Home

const HomeWrapper = styled.main`
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 20px 74px;
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

const TextLink = styled(Link)`
  color: #555;
  font-size: 13px;
`

const JourneyTitle = styled.p`
  margin-top: 18px;
  font-weight: 700;
`

const JourneyMeta = styled.p`
  margin-top: 6px;
  color: #555;
  font-size: 13px;
`

const JourneyFooter = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
`

const RecentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const RecentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const PinIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
`

const RecentText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const RecentTitle = styled.p`
  font-weight: 700;
`

const RecentDate = styled.p`
  color: #555;
  font-size: 13px;
`

const ExploreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`

const ExploreCard = styled(Card)`
  color: #000;
  text-decoration: none;
`

const Thumbnail = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #555;
  font-size: 12px;
  text-align: center;
`

const ExploreTitle = styled.p`
  margin-top: 8px;
  font-size: 13px;
  text-align: center;
`
