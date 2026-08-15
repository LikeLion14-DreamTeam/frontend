import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Header from '../../components/layout/Header'
import NavBar from '../../components/layout/NavBar'
import archiveCover from '../../assets/photobooks/archive-cover-2.png'
import { PhotobookListItem } from '../../features/photobooks/components'

// 6.1 UI 확인용 데이터다. API 연결 단계에서 조회 결과로 교체한다.
const ARCHIVE_FIXTURES = [
  {
    id: 30,
    title: '파리 · 암스테르담',
    period: '2024.09.12 — 2024.09.27',
    completedAt: '2024-09-27T10:00:00.000Z',
    coverUrl: archiveCover,
    pinCount: 12,
    photoCount: 138,
    voiceCount: 6,
  },
  {
    id: 29,
    title: '파리 · 암스테르담',
    period: '2024.05.03 — 2024.05.11',
    completedAt: '2024-05-11T10:00:00.000Z',
    coverUrl: archiveCover,
    pinCount: 9,
    photoCount: 94,
    voiceCount: 4,
  },
  {
    id: 28,
    title: '파리 · 암스테르담',
    period: '2023.11.08 — 2023.11.19',
    completedAt: '2023-11-19T10:00:00.000Z',
    coverUrl: archiveCover,
    pinCount: 7,
    photoCount: 72,
    voiceCount: 3,
  },
]

const SORT = {
  latest: 'latest',
  photos: 'photos',
}

const Archive = () => {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState(SORT.latest)
  const [refreshingId, setRefreshingId] = useState(null)

  const photobooks = useMemo(() => {
    const next = [...ARCHIVE_FIXTURES]

    if (sortBy === SORT.photos) {
      return next.sort((a, b) => b.photoCount - a.photoCount)
    }

    return next.sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt),
    )
  }, [sortBy])

  const handleRefreshCover = (photobookId) => {
    setRefreshingId(photobookId)

    window.setTimeout(() => {
      setRefreshingId((currentId) =>
        currentId === photobookId ? null : currentId,
      )
    }, 650)
  }

  return (
    <PageSurface>
      <Header to="/" />

      <ArchiveWrapper>
        <ArchiveHeader>
          <Intro>
            <Title>여행의 기록</Title>
            <Description>
              여행이 끝날 때마다 한 권의 포토북으로 보관됩니다
            </Description>
          </Intro>

          <SortSection>
            <TopDivider />
            <SortRow>
              <SortTabs role="tablist" aria-label="포토북 정렬 기준">
                <SortButton
                  type="button"
                  role="tab"
                  aria-selected={sortBy === SORT.latest}
                  $active={sortBy === SORT.latest}
                  onClick={() => setSortBy(SORT.latest)}
                >
                  최신순
                </SortButton>
                <SortButton
                  type="button"
                  role="tab"
                  aria-selected={sortBy === SORT.photos}
                  $active={sortBy === SORT.photos}
                  onClick={() => setSortBy(SORT.photos)}
                >
                  사진 많은 순
                </SortButton>
              </SortTabs>

              <CompletedCount>완성된 여정 {photobooks.length}개</CompletedCount>
            </SortRow>
          </SortSection>
        </ArchiveHeader>

        <PhotobookList aria-label="완성된 포토북 목록">
          {photobooks.map((photobook, index) => (
            <Fragment key={photobook.id}>
              <PhotobookListItem
                {...photobook}
                onOpen={() => navigate(`/archive/trip/${photobook.id}`)}
                onRefresh={() => handleRefreshCover(photobook.id)}
                isRefreshing={refreshingId === photobook.id}
              />
              {index < photobooks.length - 1 ? <ItemDivider /> : null}
            </Fragment>
          ))}
        </PhotobookList>
      </ArchiveWrapper>

      <NavBar activeOverride="archive" />
    </PageSurface>
  )
}

export default Archive

const PageSurface = styled.div`
  width: 100%;
  height: var(--app-viewport-height);
  min-height: var(--app-viewport-height);
  overflow-y: auto;
  scrollbar-width: none;
  background: var(--Background-Base);

  &::-webkit-scrollbar {
    display: none;
  }
`

const ArchiveWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: calc(
    var(--app-viewport-height) - 116px + var(--design-safe-top)
  );
  margin: 0 auto;
  padding: 4px 24px 99px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`

const ArchiveHeader = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h1`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
`

const Description = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  word-break: keep-all;
`

const SortSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`

const TopDivider = styled.span`
  width: 100%;
  height: 1px;
  display: block;
  background: rgb(200 184 166 / 80%);
`

const SortRow = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const SortTabs = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 29px;
`

const SortButton = styled.button`
  min-width: max-content;
  padding: 0 0 7px;
  border: 0;
  border-bottom: 2px solid
    ${({ $active }) =>
      $active ? 'var(--Primary-Cognac)' : 'transparent'};
  background: transparent;
  color: ${({ $active }) =>
    $active ? 'var(--Primary-Cognac)' : 'var(--Text-Secondary)'};
  font: var(--text-ui-label);
  cursor: pointer;
`

const CompletedCount = styled.p`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const PhotobookList = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const ItemDivider = styled.div`
  width: 100%;
  height: 1px;
  background: rgb(222 211 198 / 70%);
`
