import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import NavBar from '../../components/layout/NavBar'
import {
  endCurrentTrip,
  getCountryStamps,
  getCurrentTrip,
  updateCurrentTripName,
} from '../../features/trips/tripApi'
import journeyCardImage from '../../assets/home/journey-card.png'
import lastTaggedProductImage from '../../assets/home/last-tagged-product.webp'
import noteEditIcon from '../../assets/map/note-edit.svg'
import passportClosedImage from '../../assets/home/passport-closed.png'
import passportOpenImage from '../../assets/home/passport-open.png'

/**
 * 진행 중인 여정 블록의 시안 값(폭 362px 기준)을 컨테이너 단위로 바꾼다.
 * 띠·카드·글자·버튼이 화면 폭을 따라 같은 비율로 커지고 줄어든다.
 */
const journeyScale = (px) => `${((px / 362) * 100).toFixed(4)}cqw`

/** 여권 면(시안 폭 376px)용. 위에 얹는 스탬프도 같은 단위로 배치한다. */
const passportScale = (px) => `${((px / 376) * 100).toFixed(4)}cqw`

/** 진행 중인 여정이 없을 때 뜨는 카드(시안 폭 350px)용. */
const lastTaggedScale = (px) => `${((px / 350) * 100).toFixed(4)}cqw`

/**
 * 파일명이 곧 ISO 3166-1 alpha-2 국가 코드다. 구글 역지오코딩의
 * `address_components` 중 country 의 `short_name` 이 이 값이라, 응답 언어와
 * 무관하게 항상 같은 코드가 온다. 정적으로 58개를 나열하지 않고 폴더에서 모은다.
 */
const stampModules = import.meta.glob('../../assets/stamps/*.webp', {
  eager: true,
  import: 'default',
})

const stampByCountryCode = Object.fromEntries(
  Object.entries(stampModules).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.webp'.length),
    url,
  ]),
)

/** 빈 칸은 Empty, 스탬프가 없는 나라는 Country 로 대체한다. */
const getStampSrc = (stampImageId, countryCode) => {
  const mappedCode = stampImageId?.replace(/^stamp-/, '').toUpperCase()
  const assetCode = mappedCode && stampByCountryCode[mappedCode] ? mappedCode : countryCode
  if (!assetCode) return stampByCountryCode.Empty

  return stampByCountryCode[assetCode] ?? stampByCountryCode.Country
}

const replaceBrokenStamp = (event) => {
  // 개별 국가 에셋이 손상·누락돼도 슬롯은 남기고 기본 도장으로 바꾼다.
  if (event.currentTarget.src !== stampByCountryCode.Country) {
    event.currentTarget.src = stampByCountryCode.Country
  }
}

/** 분석 SDK가 붙기 전에도 이벤트 계약을 유지한다. 앱 셸이 이 이벤트를 수집한다. */
const recordPassportEvent = (name, payload = {}) => {
  window.dispatchEvent(
    new CustomEvent('orte:passport-event', { detail: { name, ...payload } }),
  )
}

const STAMPS_PER_SIDE = 4
const STAMPS_PER_SPREAD = STAMPS_PER_SIDE * 2

/** 이만큼 가로로 움직여야 넘긴 것으로 본다. */
const SWIPE_THRESHOLD = 40

/**
 * 좌우 스와이프 핸들러를 만든다. 여정 카드와 여권이 같은 방식으로 넘어간다.
 *
 * @param startRef 터치 시작점을 담아둘 ref
 * @param onMove 넘길 방향(-1 이전 / 1 다음)을 받는 콜백
 */
const createSwipeHandlers = (startRef, onMove) => ({
  onTouchStart: (event) => {
    const [touch] = event.touches
    startRef.current = { x: touch.clientX, y: touch.clientY }
  },

  onTouchEnd: (event) => {
    const start = startRef.current
    if (!start) return
    startRef.current = null

    const [touch] = event.changedTouches
    const movedX = touch.clientX - start.x
    const movedY = touch.clientY - start.y

    // 세로로 더 많이 움직였으면 페이지를 스크롤한 것이지 넘긴 게 아니다.
    if (Math.abs(movedX) < SWIPE_THRESHOLD) return
    if (Math.abs(movedX) <= Math.abs(movedY)) return

    onMove(movedX < 0 ? 1 : -1)
  },

  onTouchCancel: () => {
    startRef.current = null
  },
})

/** 진행 중인 여정 영역에서 좌우로 넘길 수 있는 카드 */
const JOURNEY_CARD = 'journey'
const LAST_TAGGED_CARD = 'lastTagged'

/**
 * 여권의 첫 장은 덮인 표지다. 도장 면은 그 뒤로 이어진다.
 *
 * 표지를 한 장으로 세어 두면 넘기기와 아래 점이 도장 면과 똑같이 동작한다.
 */
const PASSPORT_COVER = 'cover'

/**
 * 도장을 여권 펼침 단위로 나눈다. 한 펼침은 [왼쪽 면, 오른쪽 면] 이고
 * 각 면은 4칸이다. 남는 칸은 null 로 채워 빈 도장이 찍힌다.
 * 도장이 하나도 없어도 빈 면 한 장은 보여준다.
 */
const toStampSpreads = (stamps) => {
  const spreadCount = Math.max(1, Math.ceil(stamps.length / STAMPS_PER_SPREAD))

  return Array.from({ length: spreadCount }, (_, spreadIndex) => {
    const slots = Array.from(
      { length: STAMPS_PER_SPREAD },
      (_, slotIndex) => stamps[spreadIndex * STAMPS_PER_SPREAD + slotIndex] ?? null,
    )

    return [slots.slice(0, STAMPS_PER_SIDE), slots.slice(STAMPS_PER_SIDE)]
  })
}

const pad2 = (value) => String(value).padStart(2, '0')

const formatStartedAt = (startedAt) => {
  if (!startedAt) return ''

  const date = new Date(startedAt)

  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

const formatCounts = (trip) =>
  [
    `${trip.pin_count} PIN`,
    `${trip.photo_count} PHOTO`,
    `${trip.voice_memo_count} VOICE`,
  ].join(' · ')

/**
 * 3 홈 화면
 *
 * TODO: 여정 이름 수정 버튼은 명세가 나오는 대로 카드에 추가한다.
 */
const Home = () => {
  const navigate = useNavigate()
  const [currentTrip, setCurrentTrip] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tripError, setTripError] = useState('')
  const [stamps, setStamps] = useState([])
  const [isStampsLoading, setIsStampsLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const [journeyIndex, setJourneyIndex] = useState(0)
  const [isEndingTrip, setIsEndingTrip] = useState(false)
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false)
  const [endError, setEndError] = useState('')
  const passportSwipeStart = useRef(null)
  const journeySwipeStart = useRef(null)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const trip = await getCurrentTrip()
        if (!ignore) setCurrentTrip(trip)
      } catch (error) {
        if (!ignore) setTripError(error.message)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setIsStampsLoading(true)

      try {
        const { stamps: visited } = await getCountryStamps()
        if (!ignore) {
          setStamps(visited)
          recordPassportEvent('passport_page_viewed', { stamp_count: visited.length })
        }
      } catch {
        // 도장은 부가 정보라 실패해도 빈 여권으로 둔다.
        if (!ignore) setStamps([])
      } finally {
        if (!ignore) setIsStampsLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  const hasPins = currentTrip?.has_pins === true
  const stampSpreads = toStampSpreads(stamps)
  const countryCount = stamps.length
  const cityCount = stamps.reduce(
    (total, stamp) => total + (stamp?.cities?.length ?? 0) + (stamp?.extra_city_count ?? 0),
    0,
  )
  const passportPages = [PASSPORT_COVER, ...stampSpreads]
  const isCoverPage = pageIndex === 0
  // 표지가 넘어가는 동안 그 아래에 첫 도장 면이 미리 깔려 있어야 한다.
  const spreadIndex = Math.max(0, pageIndex - 1)

  // 진행 중인 여정이 없으면 최근 태깅한 제품 카드 한 장뿐이다.
  const journeyCards = hasPins
    ? [JOURNEY_CARD, LAST_TAGGED_CARD]
    : [LAST_TAGGED_CARD]
  const currentJourneyCard = journeyCards[journeyIndex] ?? journeyCards[0]

  const moveWithin = (setIndex, length) => (step) =>
    setIndex((current) => Math.min(Math.max(current + step, 0), length - 1))

  const passportSwipe = createSwipeHandlers(
    passportSwipeStart,
    moveWithin(setPageIndex, passportPages.length),
  )

  const journeySwipe = createSwipeHandlers(
    journeySwipeStart,
    moveWithin(setJourneyIndex, journeyCards.length),
  )

  const handleEndTrip = async () => {
    setIsEndingTrip(true)
    setEndError('')

    try {
      // 이름·종료일은 보내지 않는다. 서버가 3.4 로 지어둔 이름과
      // 마지막 핀 시각으로 채운다.
      await endCurrentTrip()

      // 여정이 끝나면 진행 중인 핀이 사라지고 나라 도장이 하나 늘 수 있다.
      const [trip, { stamps: visited }] = await Promise.all([
        getCurrentTrip(),
        getCountryStamps(),
      ])

      setCurrentTrip(trip)
      setStamps(visited)
      setJourneyIndex(0)
      setIsConfirmingEnd(false)
    } catch (error) {
      setEndError(error.message)
    } finally {
      setIsEndingTrip(false)
    }
  }

  const openNameEditor = () => {
    setNameDraft(currentTrip?.name ?? '')
    setNameError('')
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    const name = nameDraft.trim()

    if (!name) {
      setNameError('여정 이름을 입력해주세요.')
      return
    }

    setIsSavingName(true)
    setNameError('')

    try {
      // 3.4 는 3.1 과 같은 형태를 돌려주므로 그대로 갈아끼운다.
      setCurrentTrip(await updateCurrentTripName(name))
      setIsEditingName(false)
    } catch (error) {
      setNameError(error.message)
    } finally {
      setIsSavingName(false)
    }
  }

  const openCountryPins = (stamp) => {
    const countryCode = stamp?.country_code?.toUpperCase()
    if (!countryCode) return

    const query = new URLSearchParams({
      country_code: countryCode,
      country_name: stamp?.country_name ?? '',
    })

    recordPassportEvent('country_stamp_selected', { country_code: countryCode })
    // 5.1 지도 뷰를 재사용한다. 국가 필터일 때는 동선을 그리지 않는다.
    navigate(`/map?${query.toString()}`)
  }

  return (
    <Page>
      <Brand>
        <BrandRow>
          <BrandName>Orte</BrandName>
          <BrandTag>TRAVEL ARCHIVE</BrandTag>
        </BrandRow>
        <Hairline aria-hidden="true" />
      </Brand>

      {/* 라벨은 지금 보고 있는 카드를 따라간다. */}
      <SectionLabel>
        <LabelTick aria-hidden="true" />
        {currentJourneyCard === JOURNEY_CARD ? '진행 중인 여정' : '최근 태깅한 제품'}
      </SectionLabel>

      {isLoading || tripError ? (
        <JourneyPlaceholder role={tripError ? 'alert' : undefined}>
          {tripError || '불러오는 중...'}
        </JourneyPlaceholder>
      ) : (
        <>
          <JourneyCarousel {...journeySwipe}>
            {currentJourneyCard === JOURNEY_CARD ? (
              <JourneyBlock>
                <JourneyBand>JOURNEY IN PROGRESS</JourneyBand>

                <JourneyCard>
                  <JourneyImage src={journeyCardImage} alt="" aria-hidden="true" />

                  <JourneyBody>
                    <JourneyInfo>
                      <TripNameRow>
                        <TripName>{currentTrip.name}</TripName>
                        <EditNameButton
                          type="button"
                          aria-label="여정 이름 수정"
                          onClick={openNameEditor}
                        >
                          <EditNameIcon src={noteEditIcon} alt="" aria-hidden="true" />
                        </EditNameButton>
                      </TripNameRow>
                      <JourneyMeta>
                        <MetaLine>
                          {formatStartedAt(currentTrip.started_at)} — 진행중
                        </MetaLine>
                        <MetaLine>{formatCounts(currentTrip)}</MetaLine>
                      </JourneyMeta>
                    </JourneyInfo>

                    <JourneyActions>
                      <EndJourneyButton
                        type="button"
                        onClick={() => {
                          setEndError('')
                          setIsConfirmingEnd(true)
                        }}
                      >
                        여정 종료하기
                      </EndJourneyButton>
                      <ContinueJourneyLink to="/record/multi-capture">
                        여정 계속하기
                      </ContinueJourneyLink>
                    </JourneyActions>
                  </JourneyBody>
                </JourneyCard>
              </JourneyBlock>
            ) : (
              /*
               * 시안 `3 홈 화면 - 2`. 진행 중인 여정이 없을 때는 이 카드만 뜨고,
               * 있을 때는 오른쪽으로 넘겨서 볼 수 있다.
               */
              <LastTaggedCard>
                {/* 카드 오른쪽에 겹쳐 깔리는 장식. 광원 하나에 테두리 두 겹이다. */}
                <CardGlow aria-hidden="true" />
                <CardRing $variant="outer" aria-hidden="true" />
                <CardRing $variant="inner" aria-hidden="true" />

                <ProductImage
                  src={lastTaggedProductImage}
                  alt=""
                  aria-hidden="true"
                />

                <LastTaggedLabel>LAST TAGGED</LastTaggedLabel>

                <LastTaggedBody>
                  {/* 보여주기용 고정 값이다. 연동할 API 를 두지 않기로 했다. */}
                  <ProductIdentity>
                    <ProductName>Ottomar 비세토스 위켄더</ProductName>
                    <ProductTaggedAt>2024.03.15 태깅</ProductTaggedAt>
                  </ProductIdentity>

                  <StartJourneyLink to="/record/multi-capture">
                    눌러서 여정 시작하기
                  </StartJourneyLink>
                </LastTaggedBody>
              </LastTaggedCard>
            )}
          </JourneyCarousel>

          {journeyCards.length > 1 && (
            <JourneyDots>
              {journeyCards.map((card, index) => (
                <Dot
                  key={card}
                  type="button"
                  $active={index === journeyIndex}
                  aria-label={
                    card === JOURNEY_CARD
                      ? '진행 중인 여정'
                      : '최근 태깅한 제품'
                  }
                  aria-current={index === journeyIndex}
                  onClick={() => setJourneyIndex(index)}
                />
              ))}
            </JourneyDots>
          )}
        </>
      )}

      <PassportBlock>
        <PassportHead>
          <SectionLabel>
            <LabelTick aria-hidden="true" />
            나의 여행 여권
          </SectionLabel>

          <ResultCard>
            <ResultTitle>기록은 계속 쌓이고 있어요</ResultTitle>
            <ResultDescription>
              {isStampsLoading
                ? '도장을 불러오는 중입니다.'
                : countryCount === 0
                  ? '아직 방문 도장이 없어요. 첫 태깅을 시작해보세요.'
                  : `지금까지 ${cityCount}개의 도시, ${countryCount}개의 나라를 다녀왔어요.`}
            </ResultDescription>
          </ResultCard>
        </PassportHead>

        <PassportStage {...passportSwipe}>
          {/* 표지가 넘어가는 걸 보여주려면 도장 면이 그 아래 깔려 있어야 한다. */}
          <PassportSpread $visible={!isCoverPage} aria-hidden={isCoverPage}>
            <PassportImage src={passportOpenImage} alt="" aria-hidden="true" />

            {/*
              면을 전부 겹쳐 두고 현재 것만 드러낸다. 나가는 면과 들어오는 면이
              동시에 있어야 서로 겹치며 바뀐다.
            */}
            {stampSpreads.map((spread, index) => (
              <StampPages
                key={index}
                $visible={index === spreadIndex}
                aria-hidden={index !== spreadIndex}
              >
                {spread.map((side, sideIndex) => (
                  <StampGrid
                    key={sideIndex}
                    $side={sideIndex === 0 ? 'left' : 'right'}
                  >
                    {side.map((stamp, slotIndex) => (
                      <StampButton
                        key={slotIndex}
                        type="button"
                        disabled={!stamp?.country_code}
                        aria-label={
                          stamp?.country_name
                            ? `${stamp.country_name} 핀 보기`
                            : '빈 도장'
                        }
                        onClick={() => openCountryPins(stamp)}
                      >
                        <Stamp
                          $new={stamp?.is_new}
                          src={getStampSrc(
                            stamp?.stamp_image_id,
                            stamp?.country_code,
                          )}
                          onError={replaceBrokenStamp}
                          alt={stamp?.country_name ?? ''}
                        />
                      </StampButton>
                    ))}
                  </StampGrid>
                ))}
              </StampPages>
            ))}
          </PassportSpread>

          {/* 눌러도 스와이프해도 첫 도장 면으로 넘어간다. */}
          <PassportCover
            type="button"
            $open={!isCoverPage}
            aria-label="여권 펼치기"
            aria-hidden={!isCoverPage}
            tabIndex={isCoverPage ? 0 : -1}
            onClick={() => setPageIndex(1)}
          >
            <PassportCoverImage
              $open={!isCoverPage}
              src={passportClosedImage}
              alt=""
              aria-hidden="true"
            />
          </PassportCover>
        </PassportStage>

        <PageDots>
          {passportPages.map((page, index) => (
            <Dot
              key={index}
              type="button"
              $active={index === pageIndex}
              aria-label={
                page === PASSPORT_COVER ? '여권 표지' : `여권 ${index}번째 면`
              }
              aria-current={index === pageIndex}
              onClick={() => setPageIndex(index)}
            />
          ))}
        </PageDots>
      </PassportBlock>

      {/* TODO: 종료 확인 시안이 없어 공통 확인 모달로 만들었다. */}
      <ConfirmationModal
        open={hasPins && isConfirmingEnd}
        title="여정을 종료할까요?"
        confirmLabel={isEndingTrip ? '종료하는 중...' : '여정 종료하기'}
        onConfirm={() => void handleEndTrip()}
        onCancel={() => setIsConfirmingEnd(false)}
        confirmDisabled={isEndingTrip}
        cancelDisabled={isEndingTrip}
        ariaDescribedBy="trip-end-notice"
      >
        {hasPins && (
          <EndTripContent>
            <EndTripCard>
              <EndTripName>{currentTrip.name}</EndTripName>
              <EndTripMeta>
                {formatStartedAt(currentTrip.started_at)} ·{' '}
                {formatCounts(currentTrip)}
              </EndTripMeta>
            </EndTripCard>
            <EndTripNotice id="trip-end-notice">
              지금까지 남긴 핀이 하나의 여정으로 묶이고 포토북이 만들어져요.
            </EndTripNotice>
            {endError && <EndTripError role="alert">{endError}</EndTripError>}
          </EndTripContent>
        )}
      </ConfirmationModal>

      {/* TODO: 이름 수정 시안이 없어 공통 확인 모달에 입력란을 얹어 만들었다. */}
      <ConfirmationModal
        open={isEditingName}
        title="여정 이름을 정해주세요"
        confirmLabel={isSavingName ? '저장 중...' : '저장'}
        onConfirm={() => void handleSaveName()}
        onCancel={() => setIsEditingName(false)}
        confirmDisabled={isSavingName}
        cancelDisabled={isSavingName}
      >
        <NameEditor>
          <NameInput
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder="예) 여름 남해 여행"
            aria-label="여정 이름"
            disabled={isSavingName}
          />
          <NameHint>
            비워두면 방문한 도시 이름이 자동으로 붙습니다.
          </NameHint>
          {nameError && <NameError role="alert">{nameError}</NameError>}
        </NameEditor>
      </ConfirmationModal>

      <NavBar />
    </Page>
  )
}

export default Home

const Page = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: var(--app-viewport-height);
  margin: 0 auto;
  /* 시안의 y=58 은 이미 안전영역 아래라 그만큼 뺀다. */
  padding: calc(58px - var(--design-safe-top)) 24px 87px;
  overflow-x: hidden;
  background: #f5eee4;
`

const Brand = styled.header`
  width: 100%;
  display: flex;
  flex-direction: column;
`

const BrandRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  margin: 5px 0;
  justify-content: space-between;
`

const BrandName = styled.h1`
  color: var(--Text-Primary);
  font: 600 27px/34px var(--font-serif);
  letter-spacing: 0.54px;
`

const BrandTag = styled.p`
  color: var(--Accent-Gold);
  font: 400 9px/16px var(--font-sans);
  letter-spacing: 1.35px;
  text-align: right;
`

const Hairline = styled.div`
  width: 100%;
  height: 1px;
  background: rgb(222 211 198 / 85%);
`

const SectionLabel = styled.h2`
  display: flex;
  align-items: center;
  margin-top: 23px;
  gap: 8px;
  color: var(--Text-Secondary);
  font: 500 16px/19px var(--font-sans);
`

const LabelTick = styled.span`
  width: 2px;
  height: 15px;
  flex: 0 0 2px;
  background: #e4bc7f;
`

/* 시안에서 카드(좌 20)가 띠(좌 26)보다 넓어 본문 패딩 밖으로 4px 넘어간다. */
const JourneyBlock = styled.section`
  position: relative;
  margin: 15px -4px 0;
  /* 안쪽 cqw 값의 기준점 */
  container-type: inline-size;
`

/* 띠는 카드 뒤에 깔린다. 시안 350 × 77 비율을 폭이 달라져도 유지한다. */
const JourneyBand = styled.p`
  position: absolute;
  top: 0;
  /* Figma 기준(402px 화면): 카드 362px, 띠 350px.
     폭과 좌우 기준을 분리하지 않고 가운데 기준으로 배치한다. */
  left: 50%;
  width: calc(100% - ${journeyScale(12)});
  transform: translateX(-50%);
  aspect-ratio: 350 / 77;
  padding: ${journeyScale(10)} 0 0 ${journeyScale(17)};
  border-radius: ${journeyScale(16)};
  background: linear-gradient(
    167.07deg,
    rgb(69 50 36) 0%,
    rgb(49 35 26) 39.007%,
    rgb(34 24 16) 70.922%
  );
  box-shadow: 0 ${journeyScale(8)} ${journeyScale(20)} 0 rgb(36 26 18 / 30%);
  color: var(--Accent-Gold);
  font: 600 ${journeyScale(9)}/normal var(--font-serif);
  letter-spacing: ${journeyScale(1.8)};
`

/* 시안 362 × 203. 위쪽 27px 만큼 띠가 드러나고 나머지는 카드가 덮는다. */
const JourneyCard = styled.div`
  position: relative;
  aspect-ratio: 362 / 203;
  margin-top: ${journeyScale(27)};
  /* 카드 안쪽 값도 카드 폭을 따라가게 한다. */
  container-type: inline-size;
  border-radius: ${journeyScale(13)};
  /* 카드 이미지가 사각형이 아니라 filter 로 그림자를 준다. */
  filter: drop-shadow(
    0 ${journeyScale(4)} ${journeyScale(7)} rgb(48 38 28 / 11%)
  );
`

const JourneyImage = styled.img`
  position: absolute;
  top: -9.55%;
  left: -1.47%;
  width: 103.23%;
  height: 123.12%;
  max-width: none;
  /* 화면이 402 보다 넓어져도 늘어나지 않고 잘리게 한다. */
  object-fit: cover;
`

const JourneyBody = styled.div`
  position: relative;
  height: 100%;
  padding: ${journeyScale(27)} ${journeyScale(40)} ${journeyScale(16)} ${journeyScale(27)};
  display: flex;
  flex-direction: column;
  gap: ${journeyScale(32)};
  align-items: flex-start;
  justify-content: space-around;
`

/* 진행 중인 여정과 최근 태깅한 제품을 좌우로 넘겨 본다. */
const JourneyCarousel = styled.div`
  /* 가로 제스처는 카드 넘기기로 쓰고 세로 스크롤은 그대로 둔다. */
  touch-action: pan-y;
`

const JourneyDots = styled.div`
  height: 7px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`

/* 카드 자리를 미리 잡아둬야 불러오는 동안 아래 내용이 밀리지 않는다. */
const JourneyPlaceholder = styled.p`
  margin: 15px 2px 0;
  aspect-ratio: 350 / 228;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgb(48 38 28 / 5%);
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
`

/* 시안 `3 홈 화면 - 2` 의 Card. 350 × 228, 좌우 26 여백. */
const LastTaggedCard = styled.section`
  position: relative;
  margin: 15px 2px 0;
  aspect-ratio: 350 / 228;
  overflow: hidden;
  border-radius: ${lastTaggedScale(16)};
  background: linear-gradient(
    145.79deg,
    rgb(69 50 36) 0%,
    rgb(49 35 26) 39.007%,
    rgb(34 24 16) 70.922%
  );
  box-shadow: 0 8px 20px 0 rgb(36 26 18 / 30%);
  container-type: inline-size;
`

/* 제품 뒤에서 은은하게 퍼지는 광원. 시안의 채워진 타원이다. */
const CardGlow = styled.div`
  position: absolute;
  top: ${lastTaggedScale(8)};
  left: ${lastTaggedScale(87)};
  width: ${lastTaggedScale(280)};
  height: ${lastTaggedScale(214)};
  border-radius: 50%;
  background: radial-gradient(
    closest-side,
    rgb(197 161 91 / 24%),
    rgb(197 161 91 / 0%)
  );
  pointer-events: none;
`

/* 광원을 감싸는 테두리 두 겹. 바깥이 더 옅다. */
const CardRing = styled.div`
  position: absolute;
  top: ${({ $variant }) => lastTaggedScale($variant === 'outer' ? 2 : 14)};
  left: ${({ $variant }) => lastTaggedScale($variant === 'outer' ? 79 : 95)};
  width: ${({ $variant }) => lastTaggedScale($variant === 'outer' ? 296 : 264)};
  height: ${({ $variant }) => lastTaggedScale($variant === 'outer' ? 226 : 202)};
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'outer' ? 'rgb(197 161 91 / 30%)' : 'rgb(197 161 91 / 50%)'};
  border-radius: 50%;
  pointer-events: none;
`

/* 카드 위로 넘치게 놓인다. 넘치는 부분은 카드가 잘라낸다. */
const ProductImage = styled.img`
  position: absolute;
  top: ${lastTaggedScale(-21)};
  left: ${lastTaggedScale(139)};
  width: ${lastTaggedScale(209)};
  height: ${lastTaggedScale(226)};
  max-width: none;
  object-fit: contain;
  pointer-events: none;
`

const LastTaggedLabel = styled.p`
  position: absolute;
  top: ${lastTaggedScale(10)};
  left: ${lastTaggedScale(17)};
  color: var(--Accent-Gold);
  font: 600 ${lastTaggedScale(9)}/normal var(--font-serif);
  letter-spacing: ${lastTaggedScale(1.8)};
`

const LastTaggedBody = styled.div`
  position: absolute;
  top: ${lastTaggedScale(33)};
  left: ${lastTaggedScale(19)};
  width: ${lastTaggedScale(307)};
  display: flex;
  flex-direction: column;
  gap: ${lastTaggedScale(85)};
  align-items: flex-start;
`

const ProductIdentity = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${lastTaggedScale(6)};
`

const ProductName = styled.p`
  overflow: hidden;
  color: #f5eee4;
  font: 700 ${lastTaggedScale(22)}/${lastTaggedScale(30)} var(--font-sans);
  letter-spacing: ${lastTaggedScale(-0.22)};
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ProductTaggedAt = styled.p`
  color: rgb(245 238 228 / 60%);
  font: 400 ${lastTaggedScale(11)}/normal var(--font-sans);
`

/* 시안에서 카드 폭을 다 쓰지 않는 작은 알약 모양이다. */
const StartJourneyLink = styled(Link)`
  width: ${lastTaggedScale(136)};
  height: ${lastTaggedScale(37)};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${lastTaggedScale(22)};
  background: #f5eee4;
  color: var(--Text-Primary);
  font: 500 ${lastTaggedScale(12)}/normal var(--font-sans);
  text-decoration: none;
  white-space: nowrap;
`

/* 시안의 도시명 자리에 여정 이름이 들어간다. 나라 줄은 없다. */
const JourneyInfo = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${journeyScale(12)};
  align-items: flex-start;
`

/* 수정 버튼은 이름 바로 뒤에 붙는다. 이름 길이가 데이터마다 달라 시안의
   고정 좌표 대신 인라인으로 둔다. */
const TripNameRow = styled.div`
  max-width: 100%;
  display: flex;
  /* 아이콘 아래끝을 여정 이름 글자 아래끝에 맞춘다. */
  align-items: baseline;
  gap: ${journeyScale(8)};
`

/*
 * 시안은 Cormorant Garamond 지만 여정 이름은 한글이라 본문과 같은 산세리프로
 * 맞춘다. 세리프에는 한글 글리프가 없어 시스템 명조로 대체돼 버린다.
 * 자간도 라틴 대문자용이라 한글에서는 빼고 크기만 시안대로 둔다.
 *
 * 서버가 도시명을 이어 붙여 이름을 짓기도 해서 길어질 수 있다.
 */
const TripName = styled.p`
  min-width: 0;
  overflow: hidden;
  color: var(--Text-Primary);
  font: 600 ${journeyScale(25)}/${journeyScale(40)} var(--font-sans);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const EditNameButton = styled.button`
  width: ${journeyScale(17)};
  height: ${journeyScale(16)};
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
`

const EditNameIcon = styled.img`
  width: 100%;
  height: 100%;
  display: block;
`

const EndTripContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const EndTripCard = styled.div`
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--Background-Base);
`

const EndTripName = styled.p`
  overflow: hidden;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const EndTripMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

const EndTripNotice = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const EndTripError = styled.p`
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const NameEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const NameInput = styled.input`
  width: 100%;
  height: 45px;
  padding: 0 14px;
  border: 1px solid var(--Border-Default);
  border-radius: 12px;
  background: var(--Surface-Base);
  color: var(--Text-Primary);
  font: var(--text-ui-body-m);

  &::placeholder {
    color: var(--State-Disabled-Text);
  }

  &:focus {
    border-color: var(--Primary-Cognac);
    outline: none;
  }
`

const NameHint = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const NameError = styled.p`
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const JourneyMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${journeyScale(3)};
`

const MetaLine = styled.p`
  color: var(--Text-Secondary);
  font: 400 ${journeyScale(12)}/${journeyScale(18)} var(--font-sans);
`

const JourneyActions = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${journeyScale(5)};
`

const EndJourneyButton = styled.button`
  width: ${journeyScale(91)};
  height: ${journeyScale(33)};
  border: 0;
  background: none;
  color: var(--State-Disabled-Text);
  font: 500 ${journeyScale(11)}/${journeyScale(16)} var(--font-sans);
  cursor: pointer;
`

/* 누르면 촬영 화면으로 이동한다. */
const ContinueJourneyLink = styled(Link)`
  width: ${journeyScale(105)};
  height: ${journeyScale(33)};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${journeyScale(6)};
  background: var(--Primary-Cognac);
  box-shadow: var(--Effect-Chip);
  color: var(--Text-Inverse);
  font: 500 ${journeyScale(11)}/${journeyScale(16)} var(--font-sans);
  text-decoration: none;
  white-space: nowrap;
`

/* 여권 면은 본문 폭(354)보다 넓은 376 이라 양쪽으로 11px 씩 넘어간다. */
const PassportBlock = styled.section`
  margin: 21px -11px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`

/* 여권 면이 본문보다 11px 씩 넓어, 머리말은 그만큼 도로 좁혀 본문에 맞춘다. */
const PassportHead = styled.div`
  width: calc(100% - 22px);
  display: flex;
  flex-direction: column;
  gap: 15px;
`

const ResultCard = styled.div`
  width: 100%;
  padding: 15px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
  border-radius: 14px;
  background: rgb(181 118 59 / 9%);
`

const ResultTitle = styled.p`
  color: var(--Text-Primary);
  font: 500 14px/normal var(--font-sans);
`

const ResultDescription = styled.p`
  color: rgb(129 116 104 / 90%);
  font: 400 11px/normal var(--font-sans);
`

/* 표지와 도장 면이 같은 자리를 쓴다. 넘겨도 아래 내용이 밀리지 않는다. */
const PassportStage = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 376 / 261;
  /* 가로 제스처는 면 넘기기로 쓰고 세로 스크롤은 그대로 둔다. */
  touch-action: pan-y;
  /* 표지 크기를 이 폭 기준으로 잡는다. */
  container-type: inline-size;
`

/*
 * 덮인 여권은 펼친 면의 오른쪽 페이지 자리에 세운다.
 *
 * 책을 덮으면 앞표지가 오른쪽 면 위로 포개지고, 펼치면 왼쪽으로 넘어간다.
 */
const PassportCover = styled.button`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  /* 무대와 같은 비율. 퍼센트 높이는 부모 높이가 auto 라 풀린다. */
  aspect-ratio: 376 / 261;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border: 0;
  background: none;
  cursor: pointer;
  /* 표지가 돌아갈 때 앞쪽이 커 보이는 원근. 없으면 납작해졌다 사라진다. */
  perspective: 900px;

  /* 펼친 뒤에는 도장 면을 덮고 있어도 누름을 가로채지 않는다. */
  ${({ $open }) => $open && 'pointer-events: none;'}
`

/*
 * 표지는 폭으로 크기를 정하고 높이는 비율에서 나온다. 화면이 넓어지면 같이
 * 커지고, 173 × 249 비율은 그대로다. (45.6% 는 펼친 면 높이의 94.6% 에 해당)
 *
 * 회전축은 표지의 왼쪽 모서리, 곧 책등이다. 실제 책처럼 왼쪽으로 넘어간다.
 * 크기는 폭으로만 정해두었으니 회전이 비율을 건드리지 않는다.
 */
const PassportCoverImage = styled.img`
  width: 45.6%;
  height: auto;
  flex: none;
  margin-bottom: 13px;
  aspect-ratio: 173 / 249;
  display: block;
  transform-origin: left center;
  transform: rotateY(${({ $open }) => ($open ? '-180deg' : '0deg')});
  /* 90도를 넘겨 뒷면이 보이는 순간 사라진다. 안쪽 표지 그림은 없다. */
  backface-visibility: hidden;
  transition: transform 1000ms cubic-bezier(0.33, 0, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/* 시안 376 × 261. 안쪽 cqw 값의 기준점이라 자신에게는 cqw 를 쓰지 못한다.
   (컨테이너 단위는 조상 컨테이너를 기준으로 해 여기선 뷰포트로 잡힌다) */
const PassportSpread = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  container-type: inline-size;
  /*
   * 덮여 있는 동안에는 지면이 보이면 안 된다. 표지는 오른쪽 절반만 가려서
   * 깔아두기만 하면 왼쪽 면이 그대로 드러난다.
   *
   * 표지가 절반쯤 젖혀졌을 때(약 350ms) 맞춰 드러나고 사라진다.
   */
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 320ms ease 300ms;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const PassportImage = styled.img`
  position: absolute;
  top: -3.11%;
  left: -4.32%;
  width: 108.65%;
  height: 104.28%;
  object-fit: cover;
  max-width: none;
`

/* 지면 여백은 위 40 · 좌 19 · 우 20 · 아래 52.
   왼쪽 면 162, 오른쪽 면 158, 사이 17 로 합이 지면 폭 337 이다. */
const StampPages = styled.div`
  position: absolute;
  inset: 0;
  padding: ${passportScale(40)} ${passportScale(20)} ${passportScale(52)} ${passportScale(19)};
  display: flex;
  align-items: center;
  gap: ${passportScale(17)};
  /* 표지가 아닌 면끼리는 겹쳐 지며 바뀐다. */
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition: opacity 260ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/* 두 면은 시안에서 칸 간격이 서로 다르다. */
const StampGrid = styled.div`
  width: ${({ $side }) => passportScale($side === 'left' ? 162 : 158)};
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: ${({ $side }) => passportScale($side === 'left' ? 1 : 2)};
  row-gap: ${({ $side }) => passportScale($side === 'left' ? 9 : 13)};
`

/* 빈 칸(Empty.webp)은 이미 흐린 톤이라 따로 opacity 를 주지 않는다. */
const Stamp = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;

  ${({ $new }) =>
    $new &&
    `
      animation: stamp-in 560ms cubic-bezier(0.2, 0.85, 0.32, 1.2) both;
    `}

  @keyframes stamp-in {
    from {
      opacity: 0;
      transform: scale(1.5) rotate(-8deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const StampButton = styled.button`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${passportScale(3)};
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
`

const PageDots = styled.div`
  height: 7px;
  display: flex;
  align-items: center;
  gap: 6px;
`

const Dot = styled.button`
  width: ${({ $active }) => ($active ? '7px' : '5px')};
  height: ${({ $active }) => ($active ? '7px' : '5px')};
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: ${({ $active }) =>
    $active ? 'var(--Primary-Cognac)' : 'rgb(181 161 140 / 45%)'};
  cursor: pointer;
`
