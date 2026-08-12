import React from 'react'
import styled from 'styled-components'
import Header from '../../components/layout/Header'
import NavBar from '../../components/layout/NavBar'
import { Link } from 'react-router-dom'

const Archive = () => {
  return (
    <>
      <Header>포토북 아카이빙 화면</Header>

      <ArchiveWrapper>
        <Title>아카이브</Title>

        <Section>
          <SectionTitle>여행별 포토북</SectionTitle>
          <JourneyList>
            {journeyPhotobooks.map((book) => (
              <PhotobookCard as={Link} to={`/archive/trip/${book.id}`} key={book.id}>
                <ImagePlaceholder>Image</ImagePlaceholder>
                <BookInfo>
                  <BookTitle>{book.title}</BookTitle>
                  <BookMeta>{book.period}</BookMeta>
                  <BookMeta>{book.cities}</BookMeta>
                </BookInfo>
              </PhotobookCard>
            ))}
          </JourneyList>
        </Section>

      </ArchiveWrapper>

      <NavBar />
    </>
  )
}

export default Archive

const journeyPhotobooks = [
  {
    id: 1,
    title: '파리 - 암스테르담',
    period: '2024.09.12 - 2024.09.22',
    cities: '파리, 릴, 브뤼셀, 암스테르담',
  },
  {
    id: 2,
    title: '도쿄 - 교토',
    period: '2024.03.04 - 2024.03.14',
    cities: '도쿄, 교토, 사카 광장',
  },
  {
    id: 3,
    title: '바르셀로나',
    period: '2023.11.01 - 2023.11.10',
    cities: '바르셀로나 · 사진 72장',
  },
]


const ArchiveWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 24px 92px;
  background: #fff;
`

const Title = styled.h2`
  margin-bottom: 12px;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
`

const Section = styled.section`
  margin-top: 16px;
`

const SectionTitle = styled.h3`
  margin-bottom: 10px;
  color: #222;
  font-size: 13px;
  font-weight: 600;
`

const JourneyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const PhotobookCard = styled.article`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 12px;
  background: #fff;
  text-decoration: none;
`

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 148px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d8dde3;
  border-radius: 4px;
  background: #fbfcfd;
  color: #c3c8cf;
  font-size: 12px;
`

const BookInfo = styled.div`
  margin-top: 10px;
  border: 1px solid #edf0f3;
  border-radius: 4px;
  padding: 10px;
  background: #fff;
`

const BookTitle = styled.p`
  margin-bottom: 6px;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
`

const BookMeta = styled.p`
  color: #4b5563;
  font-size: 11px;
  line-height: 1.5;
`

