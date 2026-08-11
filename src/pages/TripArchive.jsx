import React from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'

const tripArchives = {
  1: {
    title: '파리 - 프라하',
    period: '2024.09.12 - 2024.09.22',
    tags: ['파리', '프라하', '체스키크룸로프'],
    summary: '저녁먹어야하는데배가안고픔사건발생',
    sections: [
      {
        id: 1,
        city: '파리',
        records: [
          {
            id: 1,
            text: '메모메모아암ㄴㅇㄻㅇㄴㄻㄴㅇㄹㄹ',
            audioTime: '1:08',
          },
          {
            id: 2,
            text: '메모입니다메모메모메모',
            audioTime: '0:58',
            reversed: true,
          },
        ],
      },
      {
        id: 2,
        city: '프라하',
        records: [
          {
            id: 3,
            text: '해커톤파이팅',
            audioTime: '1:15',
          },
        ],
      },
    ],
  },
  2: {
    title: '도쿄 - 교토',
    period: '2024.03.04 - 2024.03.14',
    tags: ['도쿄', '교토', '오사카'],
    summary: '메모메모메모메모',
    sections: [
      {
        id: 1,
        city: '도쿄',
        records: [
          {
            id: 1,
            text: '시부야사변을일으켰습니다료이키텐카이',
            audioTime: '0:45',
          },
        ],
      },
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
        <HeaderTitle>{archive.headerTitle}</HeaderTitle>
      </PageHeader>

      <TripArchiveWrapper>
        <IntroSection>
          <TripTitle>{archive.title}</TripTitle>
          <TripMeta>{archive.period} · 7일</TripMeta>
          <TagList aria-label="여행 도시 목록">
            {archive.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </TagList>
        </IntroSection>

        <HeroImage>Image</HeroImage>

        <Section>
          <SectionTitle>이번 여정</SectionTitle>
          <SummaryBox>{archive.summary}</SummaryBox>
        </Section>

        {archive.sections.map((section) => (
          <Section key={section.id}>
            <SectionTitle>{section.city}</SectionTitle>
            <RecordList>
              {section.records.map((record) => (
                <RecordItem key={record.id} $reversed={record.reversed}>
                  <RecordImage>Image</RecordImage>
                  <RecordContent>
                    <RecordText>{record.text}</RecordText>
                    <AudioBar aria-label={`${section.city} 음성 기록`}>
                      <PlayIcon>▶</PlayIcon>
                      <ProgressTrack>
                        <Progress />
                      </ProgressTrack>
                      <AudioTime>{record.audioTime}</AudioTime>
                    </AudioBar>
                  </RecordContent>
                </RecordItem>
              ))}
            </RecordList>
          </Section>
        ))}
      </TripArchiveWrapper>
    </>
  )
}

export default TripArchive

const PageHeader = styled.header`
  width: 100%;
  height: 50px;
  border: 1px solid #ddd;
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
  font-size: 15px;
  font-weight: 700;
`

const TripArchiveWrapper = styled.main`
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 20px 34px;
  background: #fff;
`

const IntroSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TripTitle = styled.h2`
  color: #111827;
  font-size: 18px;
  font-weight: 700;
`

const TripMeta = styled.p`
  color: #4b5563;
  font-size: 12px;
`

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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

const HeroImage = styled.div`
  width: 100%;
  height: 178px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d8dde3;
  border-radius: 4px;
  background: #fbfcfd;
  color: #c3c8cf;
  font-size: 12px;
`

const Section = styled.section`
  margin-top: 22px;
`

const SectionTitle = styled.h3`
  margin-bottom: 10px;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
`

const SummaryBox = styled.p`
  min-height: 62px;
  border: 1px solid #edf0f3;
  border-radius: 4px;
  padding: 12px;
  color: #4b5563;
  background: #fbfcfd;
  font-size: 12px;
  line-height: 1.6;
`

const RecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const RecordItem = styled.article`
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 12px;
  align-items: start;

  ${({ $reversed }) =>
    $reversed &&
    `
      grid-template-columns: minmax(0, 1fr) 112px;

      ${RecordImage} {
        order: 2;
      }
    `}
`

const RecordImage = styled.div`
  width: 100%;
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d8dde3;
  border-radius: 4px;
  background: #fbfcfd;
  color: #c3c8cf;
  font-size: 11px;
`

const RecordContent = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const RecordText = styled.p`
  border: 1px solid #edf0f3;
  border-radius: 4px;
  padding: 10px;
  color: #374151;
  background: #fff;
  font-size: 11px;
  line-height: 1.5;
`

const AudioBar = styled.div`
  height: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d9dde3;
  border-radius: 999px;
  padding: 0 10px;
  color: #111827;
  background: #fff;
`

const PlayIcon = styled.span`
  flex: 0 0 auto;
  color: #4b5563;
  font-size: 9px;
  line-height: 1;
`

const ProgressTrack = styled.span`
  height: 4px;
  flex: 1;
  border-radius: 999px;
  background: #e5e7eb;
`

const Progress = styled.span`
  width: 38%;
  height: 100%;
  display: block;
  border-radius: inherit;
  background: #c7ccd3;
`

const AudioTime = styled.span`
  flex: 0 0 auto;
  color: #4b5563;
  font-size: 10px;
`
