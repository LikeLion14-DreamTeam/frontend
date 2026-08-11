import React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

const cityArchives = {
  1: {
    name: '파리',
    dateGroups: [
      {
        id: 1,
        date: '날짜',
        items: [
          { id: 1, placement: 'topLeft' },
          { id: 2, placement: 'rightFloat' },
          { id: 3, placement: 'centerOverlap' },
        ],
      },
      {
        id: 2,
        date: '날짜',
        items: [
          { id: 4, placement: 'bottomLeft' },
          { id: 5, placement: 'bottomRight' },
        ],
      },
    ],
  },
  2: {
    name: '암스테르담',
    dateGroups: [
      {
        id: 1,
        date: '날짜',
        items: [
          { id: 1, placement: 'topLeft' },
          { id: 2, placement: 'rightFloat' },
          { id: 3, placement: 'centerOverlap' },
        ],
      },
      {
        id: 2,
        date: '날짜',
        items: [
          { id: 4, placement: 'bottomLeft' },
          { id: 5, placement: 'bottomRight' },
        ],
      },
    ],
  },
  3: {
    name: '도쿄',
    dateGroups: [
      {
        id: 1,
        date: '날짜',
        items: [
          { id: 1, placement: 'topLeft' },
          { id: 2, placement: 'rightFloat' },
          { id: 3, placement: 'centerOverlap' },
        ],
      },
      {
        id: 2,
        date: '날짜',
        items: [
          { id: 4, placement: 'bottomLeft' },
          { id: 5, placement: 'bottomRight' },
        ],
      },
    ],
  },
}

const fallbackArchive = cityArchives[1]

const CityArchive = () => {
  const { cityID } = useParams()
  const archive = cityArchives[cityID] || fallbackArchive

  return (
    <CityArchiveWrapper>
      <CityTitle>{archive.name}</CityTitle>

      {archive.dateGroups.map((group) => (
        <DateSection key={group.id} $variant={group.id === 1 ? 'first' : 'second'}>
          <DateLabel>{group.date}</DateLabel>
          <CollageArea $variant={group.id === 1 ? 'first' : 'second'}>
            {group.items.map((item) => (
              <PhotoRecord key={item.id} $placement={item.placement}>
                <ImageBox>Image</ImageBox>
                <TextPanel>
                  <PanelTitle>텍스트 기록</PanelTitle>
                  <PlayButton type="button" aria-label="음성 기록 재생">
                    ▶
                  </PlayButton>
                </TextPanel>
                <DetailButton type="button">자세히</DetailButton>
              </PhotoRecord>
            ))}
          </CollageArea>
        </DateSection>
      ))}
    </CityArchiveWrapper>
  )
}

export default CityArchive

const CityArchiveWrapper = styled.main`
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 60px 20px 24px;
  overflow-x: hidden;
  background: #fff;
`

const CityTitle = styled.h1`
  color: #000;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
`

const DateSection = styled.section`
  margin-top: ${({ $variant }) => ($variant === 'first' ? '18px' : '0')};
`

const DateLabel = styled.h2`
  color: #000;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
`

const CollageArea = styled.div`
  height: ${({ $variant }) => ($variant === 'first' ? '540px' : '430px')};
  position: relative;
`

const PhotoRecord = styled.article`
  width: 184px;
  position: absolute;

  ${({ $placement }) => getPlacementStyle($placement)}
`

const ImageBox = styled.div`
  width: 184px;
  height: 196px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d8dde3;
  border-radius: 4px;
  background: #fbfcfd;
  color: #b7bec8;
  font-size: 12px;
`

const TextPanel = styled.div`
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #e5e7eb;
`

const PanelTitle = styled.strong`
  color: #000;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
`

const PlayButton = styled.button`
  width: 44px;
  height: 44px;
  border: 1px solid #000;
  border-radius: 50%;
  background: #fff;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: -4px;
  top: -1px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
`

const DetailButton = styled.button`
  min-width: 34px;
  min-height: 20px;
  border: 0;
  background: #e5e7eb;
  color: #000;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
`

function getPlacementStyle(placement) {
  const styles = {
    topLeft: `
      top: 18px;
      left: 0;

      ${TextPanel} {
        width: 184px;
      }

      ${DetailButton} {
        margin-top: 6px;
      }
    `,
    rightFloat: `
      top: 186px;
      right: 0;

      ${TextPanel} {
        width: 184px;
        margin-top: 0;
      }

      ${PlayButton} {
        right: 6px;
      }

      ${DetailButton} {
        display: block;
        margin-left: auto;
        margin-top: 6px;
      }
    `,
    centerOverlap: `
      top: 330px;
      left: 110px;

      ${TextPanel} {
        width: 138px;
        height: 72px;
        position: absolute;
        left: -110px;
        top: 49px;
      }

      ${PlayButton} {
        right: -2px;
        top: 36px;
      }

      ${DetailButton} {
        position: absolute;
        left: -110px;
        top: 127px;
      }
    `,
    bottomLeft: `
      top: 12px;
      left: 8px;

      ${TextPanel} {
        width: 178px;
        height: 90px;
        position: absolute;
        left: 184px;
        top: 0;
      }

      ${PlayButton} {
        right: 8px;
        top: 50px;
      }

      ${DetailButton} {
        position: absolute;
        left: 328px;
        top: 96px;
      }
    `,
    bottomRight: `
      top: 190px;
      right: 0;

      ${TextPanel},
      ${DetailButton} {
        display: none;
      }
    `,
  }

  return styles[placement]
}
