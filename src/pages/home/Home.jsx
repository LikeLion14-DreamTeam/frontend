import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Header from '../../components/layout/Header'
import NavBar from '../../components/layout/NavBar'


const Home = () => {
  return (
    <>
      <Header>홈 화면</Header>

      <HomeWrapper>

        <TitleRow>
          <Title>나의 여행 기록</Title>
          <ContinueTripButton as={Link} to="/record/camera">
            여행 계속하기
          </ContinueTripButton>
        </TitleRow>

        <Section>
          <Card>
            <SectionTitle>진행 중인 여정</SectionTitle>
            <JourneyTitle>여정타이틀</JourneyTitle>
            <JourneyMeta>여정정보</JourneyMeta>
            <JourneyFooter>
              <TextLink to="/trip-management">여행 구간 관리</TextLink>
            </JourneyFooter>
          </Card>
        </Section>

        <Section>
          <PassportPlaceholder>여권 들어갈 자리</PassportPlaceholder>
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
  font-size: 22px;
`

const TitleRow = styled.div`
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const ContinueTripButton = styled(Button)`
  width: auto;
  min-width: 92px;
  min-height: 27px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
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

const PassportPlaceholder = styled.div`
  background-color: #555;
  color: white;
  height: 500px;
`