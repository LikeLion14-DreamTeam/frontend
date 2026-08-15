import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import NavBar from '../../components/layout/NavBar'
import {
  getCountryStamps,
  getCurrentTrip,
} from '../../features/trips/tripApi'
import journeyCardImage from '../../assets/home/journey-card.png'
import noteEditIcon from '../../assets/map/note-edit.svg'
import passportOpenImage from '../../assets/home/passport-open.png'

/**
 * 진행 중인 여정 블록의 시안 값(폭 362px 기준)을 컨테이너 단위로 바꾼다.
 * 띠·카드·글자·버튼이 화면 폭을 따라 같은 비율로 커지고 줄어든다.
 */
const journeyScale = (px) => `${((px / 362) * 100).toFixed(4)}cqw`

/** 여권 면(시안 폭 376px)용. 위에 얹는 스탬프도 같은 단위로 배치한다. */
const passportScale = (px) => `${((px / 376) * 100).toFixed(4)}cqw`

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
const getStampSrc = (countryCode) => {
  if (!countryCode) return stampByCountryCode.Empty

  return stampByCountryCode[countryCode] ?? stampByCountryCode.Country
}

const STAMPS_PER_SIDE = 4
const STAMPS_PER_SPREAD = STAMPS_PER_SIDE * 2

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
 * TODO: 여권 요약과 스탬프는 아직 시안 값이다. 마이페이지 통계와
 * 3.3 GET /users/me/country-stamps 로 채운다.
 * TODO: 여정 이름 수정 버튼은 명세가 나오는 대로 카드에 추가한다.
 * TODO: 여권은 펼쳐진 상태만 구현했다. 덮인 상태(passport-closed.png)에서 펼쳐지는
 * 애니메이션은 다음 작업이다.
 */
const Home = () => {
  const [currentTrip, setCurrentTrip] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tripError, setTripError] = useState('')
  const [stamps, setStamps] = useState([])
  const [spreadIndex, setSpreadIndex] = useState(0)

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
      try {
        const { stamps: visited } = await getCountryStamps()
        if (!ignore) setStamps(visited)
      } catch {
        // 도장은 부가 정보라 실패해도 빈 여권으로 둔다.
        if (!ignore) setStamps([])
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  const hasPins = currentTrip?.has_pins === true
  const stampSpreads = toStampSpreads(stamps)
  const currentSpread = stampSpreads[spreadIndex] ?? stampSpreads[0]

  return (
    <Page>
      <Brand>
        <BrandRow>
          <BrandName>Orte</BrandName>
          <BrandTag>TRAVEL ARCHIVE</BrandTag>
        </BrandRow>
        <Hairline aria-hidden="true" />
      </Brand>

      <SectionLabel>
        <LabelTick aria-hidden="true" />
        진행 중인 여정
      </SectionLabel>

      <JourneyBlock>
        <JourneyBand>JOURNEY IN PROGRESS</JourneyBand>

        <JourneyCard>
          <JourneyImage src={journeyCardImage} alt="" aria-hidden="true" />

          <JourneyBody>
            {isLoading && <JourneyStatus>불러오는 중...</JourneyStatus>}

            {!isLoading && tripError && (
              <JourneyStatus role="alert">{tripError}</JourneyStatus>
            )}

            {/* has_pins: false 는 아직 태깅을 한 번도 안 한 상태다. */}
            {!isLoading && !tripError && !hasPins && (
              <JourneyInfo>
                <TripName>여정을 시작해보세요</TripName>
                <JourneyMeta>
                  <MetaLine>태그를 인식하면 첫 핀이 저장돼요</MetaLine>
                </JourneyMeta>
              </JourneyInfo>
            )}

            {!isLoading && !tripError && hasPins && (
              <JourneyInfo>
                <TripNameRow>
                  <TripName>{currentTrip.name}</TripName>
                  {/* TODO: 여정 이름 수정 API 명세가 나오면 연결한다. */}
                  <EditNameButton type="button" aria-label="여정 이름 수정">
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
            )}

            <JourneyActions>
              {/* 배정할 핀이 없으면 3.2 가 409 EMPTY_TRIP 이라 아예 감춘다. */}
              {hasPins && (
                <EndJourneyButton type="button">여정 종료하기</EndJourneyButton>
              )}
              <ContinueJourneyLink to="/record/multi-capture">
                여정 계속하기
              </ContinueJourneyLink>
            </JourneyActions>
          </JourneyBody>
        </JourneyCard>
      </JourneyBlock>

      <PassportBlock>
        <PassportHead>
          <SectionLabel>
            <LabelTick aria-hidden="true" />
            나의 여행 여권
          </SectionLabel>

          <ResultCard>
            <ResultTitle>기록은 계속 쌓이고 있어요</ResultTitle>
            <ResultDescription>
              지금까지 12개의 도시, 7개의 나라를 다녀왔어요.
            </ResultDescription>
          </ResultCard>
        </PassportHead>

        <PassportSpread>
          <PassportImage src={passportOpenImage} alt="" aria-hidden="true" />

          <StampPages>
            {currentSpread.map((side, sideIndex) => (
              <StampGrid
                key={sideIndex}
                $side={sideIndex === 0 ? 'left' : 'right'}
              >
                {side.map((stamp, slotIndex) => (
                  <Stamp
                    key={slotIndex}
                    src={getStampSrc(stamp?.country_code)}
                    alt={stamp?.country_name ?? ''}
                  />
                ))}
              </StampGrid>
            ))}
          </StampPages>
        </PassportSpread>

        {/* TODO: 좌우 스와이프로도 넘길 수 있게 한다. */}
        <PageDots>
          {stampSpreads.map((_, index) => (
            <Dot
              key={index}
              type="button"
              $active={index === spreadIndex}
              aria-label={`여권 ${index + 1}번째 면`}
              aria-current={index === spreadIndex}
              onClick={() => setSpreadIndex(index)}
            />
          ))}
        </PageDots>
      </PassportBlock>

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
  right: ${journeyScale(6)};
  left: ${journeyScale(6)};
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
  padding: ${journeyScale(27)} ${journeyScale(40)} ${journeyScale(16)}
    ${journeyScale(27)};
  display: flex;
  flex-direction: column;
  gap: ${journeyScale(32)};
  align-items: flex-start;
`

const JourneyStatus = styled.p`
  color: var(--Text-Secondary);
  font: 400 ${journeyScale(12)}/${journeyScale(18)} var(--font-sans);
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
  align-items: center;
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

/* 시안 376 × 261. 안쪽 cqw 값의 기준점이라 자신에게는 cqw 를 쓰지 못한다.
   (컨테이너 단위는 조상 컨테이너를 기준으로 해 여기선 뷰포트로 잡힌다) */
const PassportSpread = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 376 / 261;
  overflow: hidden;
  container-type: inline-size;
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
  position: relative;
  height: 100%;
  padding: ${passportScale(40)} ${passportScale(20)} ${passportScale(52)}
    ${passportScale(19)};
  display: flex;
  align-items: center;
  gap: ${passportScale(17)};
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
