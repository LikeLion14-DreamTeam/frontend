import React from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../../components/common/Card'
import GoogleMap from '../../components/common/GoogleMap'

// 지도 확인용 임시 좌표. 실제 핀 데이터가 붙으면 API 응답으로 교체한다.
const tripArchives = {
  1: {
    title: '파리 - 프라하',
    period: '2024년 9월 3일 - 9월 18일',
    duration: '16일',
    tags: ['파리', '프라하', '체스키크룸로프'],
    points: [
      { name: '개선문', lat: 48.8738, lng: 2.295 },
      { name: '루브르', lat: 48.8606, lng: 2.3376 },
      { name: '카를교', lat: 50.0865, lng: 14.4114 },
    ],
  },
  2: {
    title: '도쿄 - 교토',
    period: '2024년 3월 4일 - 3월 14일',
    duration: '11일',
    tags: ['도쿄', '교토', '오사카'],
    points: [
      { name: '시부야', lat: 35.6595, lng: 139.7004 },
      { name: '기요미즈데라', lat: 34.9949, lng: 135.785 },
      { name: '도톤보리', lat: 34.6687, lng: 135.5013 },
    ],
  },
}

const fallbackArchive = tripArchives[2]

const TripArchive = () => {
  const { tripID } = useParams()
  const archive = tripArchives[tripID] || fallbackArchive

  return (
    <>
      <PageHeader>
        <BackLink to="/archive" aria-label="아카이브 화면으로 돌아가기">
          &lt;
        </BackLink>
        <HeaderTitle>포토북 상세 화면</HeaderTitle>
      </PageHeader>

      <TripArchiveWrapper>
        <IntroCard>
          <IntroHeader>
            <TripTitle>{archive.title}</TripTitle>
            <ManageLink to="/trip-management">여행 구간 관리</ManageLink>
          </IntroHeader>
          <TripMetaRow>
            <TripMeta>{archive.period}</TripMeta>
            <DurationBadge>{archive.duration}</DurationBadge>
          </TripMetaRow>
          <TagList aria-label="여행 도시 목록">
            {archive.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </TagList>
        </IntroCard>

        <MapSection>
          <GoogleMap markers={archive.points} height="470px" />
        </MapSection>

        <JourneyCard>
          <SectionTitle>이번 여정</SectionTitle>
          <SkeletonLine $width="66%" />
          <SkeletonLine $width="28%" />
        </JourneyCard>


        <PhotobookPlaceholder>포토북 Placeholder</PhotobookPlaceholder>
        
        <PhotobookMetaCard>
          <MetaWrapper>
            <MetaTitle>저장된 핀</MetaTitle>
            <MetaInfo>12곳</MetaInfo>
          </MetaWrapper>
          <MetaWrapper>
            <MetaTitle>포토북 사진</MetaTitle>
            <MetaInfo>38장</MetaInfo>
          </MetaWrapper>
          <MetaWrapper>
            <MetaTitle>방문 도시</MetaTitle>
            <MetaInfo>3개</MetaInfo>
          </MetaWrapper>
        </PhotobookMetaCard>

        <LinkText to="/archive">포토북 목록으로 돌아가기</LinkText>

      </TripArchiveWrapper>
    </>
  )
}

export default TripArchive

const PageHeader = styled.header`
  width: 100%;
  height: 50px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
`

const BackLink = styled(Link)`
  width: 40px;
  height: 100%;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 12px;
  text-decoration: none;
  font-size: 22px;
  line-height: 1;
`

const HeaderTitle = styled.h1`
  color: #111827;
  font-size: 13px;
  font-weight: 700;
`

const TripArchiveWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 72px 24px 34px;
  font-family: var(--font-sans);
`

const IntroCard = styled.section`
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 14px 14px 12px;
  background: #fbfcfd;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const IntroHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const TripTitle = styled.h2`
  color: #111827;
  font-size: 18px;
  font-weight: 700;
`

const ManageLink = styled(Link)`
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 11px;
  text-decoration: underline;
`

const TripMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const TripMeta = styled.p`
  color: #4b5563;
  font-size: 12px;
`

const DurationBadge = styled.span`
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #d9dde3;
  border-radius: 999px;
  padding: 0 12px;
  color: #111827;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
`

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Tag = styled.span`
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #d9dde3;
  border-radius: 4px;
  padding: 0 10px;
  color: #111827;
  background: #fff;
  font-size: 12px;
`

const MapSection = styled.section`
  margin-top: 22px;
`

const JourneyCard = styled.section`
  min-height: 78px;
  margin-top: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 14px;
  background: #fbfcfd;
`

const SectionTitle = styled.h3`
  margin-bottom: 12px;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
`

const SkeletonLine = styled.span`
  width: ${({ $width }) => $width};
  height: 8px;
  display: block;
  border-radius: 999px;
  background: #e5e7eb;

  & + & {
    margin-top: 8px;
  }
`

const PhotobookPlaceholder = styled.div`
  width: 100%;
  height: 520px;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111827;
  color: #fff;
  font-size: 13px;
`

const PhotobookMetaCard = styled(Card)`
  margin-top: 16px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const MetaWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const MetaTitle = styled.p`
  font-size: 12px;
`

const MetaInfo = styled.p`
  font-weight: bold;
`

const LinkText = styled(Link)`
  display: inline-block;
  margin-top: 24px;
  font-size: 12px;
  color: #555;
`
