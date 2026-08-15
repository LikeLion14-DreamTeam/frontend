import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Header from '../../components/layout/Header'
import NavBar from '../../components/layout/NavBar'
import { PhotobookListItem } from '../../features/photobooks/components'
import {
  getPhotobooks,
  refreshPhotobookCover,
} from '../../features/photobooks/photobookApi'

const SORT = {
  latest: 'latest',
  photos: 'photos',
}

const pad2 = (value) => String(value).padStart(2, '0')

const formatDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

const formatPeriod = (startAt, endAt) => {
  const start = formatDate(startAt)
  const end = formatDate(endAt)

  return [start, end].filter(Boolean).join(' — ')
}

const getPhotobookTitle = (photobook) => {
  const name = photobook.name?.trim()
  if (name) return name

  const cityName = Array.isArray(photobook.cities)
    ? photobook.cities.filter(Boolean).join(' · ')
    : ''

  return cityName || '이름 없는 포토북'
}

const getCount = (value) => {
  const count = Number(value)
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0
}

const toListItem = (photobook) => ({
  id: photobook.photobook_id,
  title: getPhotobookTitle(photobook),
  period: formatPeriod(photobook.start_at, photobook.end_at),
  completedAt: photobook.end_at,
  coverUrl: photobook.cover_photo_url,
  photoCount: getCount(photobook.photo_count),
})

const Archive = () => {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState(SORT.latest)
  const [refreshingId, setRefreshingId] = useState(null)
  const [photobooks, setPhotobooks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshErrorMessage, setRefreshErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    const loadPhotobooks = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const photobookData = await getPhotobooks()

        if (!ignore) {
          setPhotobooks(
            Array.isArray(photobookData.photobooks)
              ? photobookData.photobooks
              : [],
          )
        }
      } catch (error) {
        if (ignore) return

        setPhotobooks([])
        setErrorMessage(
          error.message ?? '포토북 목록을 불러오지 못했습니다.',
        )
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadPhotobooks()

    return () => {
      ignore = true
    }
  }, [])

  const sortedPhotobooks = useMemo(() => {
    const next = photobooks.map(toListItem)

    if (sortBy === SORT.photos) {
      return next.sort((a, b) => b.photoCount - a.photoCount)
    }

    return next.sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt),
    )
  }, [photobooks, sortBy])

  const handleRefreshCover = async (photobookId) => {
    if (refreshingId !== null) return

    setRefreshingId(photobookId)
    setRefreshErrorMessage('')

    try {
      const updated = await refreshPhotobookCover(photobookId)
      const nextCoverUrl = updated.cover_photo_url

      if (!nextCoverUrl) {
        throw new Error('새 커버 사진을 받지 못했습니다.')
      }

      setPhotobooks((current) =>
        current.map((photobook) =>
          photobook.photobook_id === photobookId
            ? { ...photobook, cover_photo_url: nextCoverUrl }
            : photobook,
        ),
      )
    } catch (error) {
      setRefreshErrorMessage(
        error.message ?? '포토북 커버를 새로고침하지 못했습니다.',
      )
    } finally {
      setRefreshingId(null)
    }
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

              <CompletedCount>
                완성된 여정 {sortedPhotobooks.length}개
              </CompletedCount>
            </SortRow>
          </SortSection>
        </ArchiveHeader>

        <PhotobookList aria-label="완성된 포토북 목록">
          {isLoading ? <StateMessage>불러오는 중...</StateMessage> : null}

          {refreshErrorMessage ? (
            <RefreshError role="alert">{refreshErrorMessage}</RefreshError>
          ) : null}

          {!isLoading && errorMessage ? (
            <StateMessage role="alert">{errorMessage}</StateMessage>
          ) : null}

          {!isLoading && !errorMessage && sortedPhotobooks.length === 0 ? (
            <StateMessage>아직 완성된 여정이 없습니다.</StateMessage>
          ) : null}

          {!isLoading && !errorMessage
            ? sortedPhotobooks.map((photobook, index) => (
                <Fragment key={photobook.id}>
                  <PhotobookListItem
                    {...photobook}
                    onOpen={() => navigate(`/archive/trip/${photobook.id}`)}
                    onRefresh={() => handleRefreshCover(photobook.id)}
                    isRefreshing={refreshingId === photobook.id}
                    refreshDisabled={refreshingId !== null}
                  />
                  {index < sortedPhotobooks.length - 1 ? (
                    <ItemDivider />
                  ) : null}
                </Fragment>
              ))
            : null}
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

const StateMessage = styled.p`
  width: 100%;
  padding: 40px 0;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
`

const RefreshError = styled.p`
  width: 100%;
  margin-bottom: -8px;
  color: #b8564f;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  word-break: keep-all;
`

const ItemDivider = styled.div`
  width: 100%;
  height: 1px;
  background: rgb(222 211 198 / 70%);
`
