import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import paperTexture from '../../assets/pin-save/manual-pin-form-bg.png'
import Header from '../../components/layout/Header'
import {
  PhotobookCityHeader,
  PhotobookPinBlock,
} from '../../features/photobooks/components'

const PHOTO_GRADIENTS = {
  amber: 'linear-gradient(180deg, #ebcea4 0%, #a87a52 100%)',
  brown: 'linear-gradient(180deg, #c9a88b 0%, #3a2a20 100%)',
  sage: 'linear-gradient(180deg, #f0e2cb 0%, #9da69b 100%)',
  olive: 'linear-gradient(180deg, #d8c6a6 0%, #6b5b3e 100%)',
}

const makePhotos = (pinId, gradients) =>
  gradients.map((gradient, index) => ({
    id: `${pinId}-photo-${index + 1}`,
    gradient,
  }))

const NOTE =
  '계단 끝에서 도시가 한 번에 펼쳐졌다. 숨 고르느라 오래 서 있었음.'

// 6.2 UI 확인용 데이터다. API 연결 단계에서 상세 조회 응답으로 교체한다.
const TRIP_ARCHIVE_FIXTURE = {
  title: '파리 · 암스테르담',
  period: '2024.09.03 – 2024.09.18',
  pinCount: 12,
  photoCount: 138,
  voiceCount: 6,
  cities: [
    {
      id: 'paris-primary',
      name: 'PARIS',
      pins: [
        {
          id: 101,
          placeName: '몽마르트 언덕',
          recordedAt: '2024.09.13 17:20',
          photos: makePhotos('101', [
            PHOTO_GRADIENTS.amber,
            PHOTO_GRADIENTS.brown,
            PHOTO_GRADIENTS.sage,
            PHOTO_GRADIENTS.olive,
          ]),
          note: NOTE,
          voiceDuration: 38,
        },
        {
          id: 102,
          placeName: '몽마르트 언덕',
          recordedAt: '2024.09.13 17:20',
          photos: makePhotos('102', [
            PHOTO_GRADIENTS.sage,
            PHOTO_GRADIENTS.amber,
          ]),
        },
        {
          id: 103,
          placeName: '몽마르트 언덕',
          recordedAt: '2024.09.13 17:20',
          photos: makePhotos('103', [
            PHOTO_GRADIENTS.brown,
            PHOTO_GRADIENTS.sage,
            PHOTO_GRADIENTS.olive,
          ]),
          note: NOTE,
          voiceDuration: 38,
        },
      ],
    },
    {
      id: 'paris-secondary',
      name: 'PARIS',
      pins: [
        {
          id: 104,
          placeName: '몽마르트 언덕',
          recordedAt: '2024.09.13 17:20',
          photos: makePhotos('104', [
            PHOTO_GRADIENTS.amber,
            PHOTO_GRADIENTS.brown,
            PHOTO_GRADIENTS.sage,
            PHOTO_GRADIENTS.olive,
          ]),
          note: NOTE,
          voiceDuration: 38,
        },
        {
          id: 105,
          placeName: '몽마르트 언덕',
          recordedAt: '2024.09.13 17:20',
          photos: makePhotos('105', [
            PHOTO_GRADIENTS.sage,
            PHOTO_GRADIENTS.amber,
          ]),
        },
      ],
    },
  ],
}

const TripArchive = () => {
  const { tripID } = useParams()
  const navigate = useNavigate()
  const [playingVoiceId, setPlayingVoiceId] = useState(null)
  const archive = TRIP_ARCHIVE_FIXTURE

  const handleToggleVoice = (pinId) => {
    setPlayingVoiceId((currentId) => (currentId === pinId ? null : pinId))
  }

  return (
    <PageSurface>
      <Header to="/archive" ariaLabel="포토북 목록으로 돌아가기" />

      <PageContent>
        <HeroSection>
          <TripSummary>
            <TitleBlock>
              <TitleRow>
                <TripTitle>{archive.title}</TripTitle>
                <ManageLink to={`/trip-management/${tripID}`}>
                  여행 구간 관리
                </ManageLink>
              </TitleRow>
              <TripPeriod>{archive.period}</TripPeriod>
            </TitleBlock>

            <TripStats>
              {archive.pinCount} PIN · {archive.photoCount} PHOTO ·{' '}
              {archive.voiceCount} VOICE
            </TripStats>
          </TripSummary>

          <MapHero role="img" aria-label="여행 핀 지도">
            지도 화면
          </MapHero>
        </HeroSection>

        {archive.cities.map((city) => (
          <CitySection key={city.id}>
            <CityContent>
              <PhotobookCityHeader
                city={city.name}
                pinCount={city.pins.length}
              />

              <PinList>
                {city.pins.map((pin) => (
                  <PhotobookPinBlock
                    key={pin.id}
                    placeName={pin.placeName}
                    recordedAt={pin.recordedAt}
                    photos={pin.photos}
                    note={pin.note}
                    voiceMemo={
                      pin.voiceDuration
                        ? {
                            duration: pin.voiceDuration,
                            progress: 0.32,
                            isPlaying: playingVoiceId === pin.id,
                            onToggle: () => handleToggleVoice(pin.id),
                          }
                        : undefined
                    }
                    onOpenDetail={() => navigate(`/map/pin/${pin.id}`)}
                  />
                ))}
              </PinList>
            </CityContent>
          </CitySection>
        ))}
      </PageContent>
    </PageSurface>
  )
}

export default TripArchive

const PageSurface = styled.div`
  width: 100%;
  height: var(--app-viewport-height);
  min-height: var(--app-viewport-height);
  overflow-y: auto;
  scrollbar-width: none;
  background-color: var(--Background-Base);
  background-image: url(${paperTexture});
  background-repeat: repeat-y;
  background-position: top center;
  background-size: 100% auto;

  &::-webkit-scrollbar {
    display: none;
  }
`

const PageContent = styled.main`
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
  padding: 4px 0 184px;
  display: flex;
  flex-direction: column;
  gap: 50px;
`

const HeroSection = styled.section`
  width: 100%;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 29px;
`

const TripSummary = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const TitleBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const TitleRow = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
`

const TripTitle = styled.h1`
  min-width: 0;
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ManageLink = styled(Link)`
  flex: 0 0 auto;
  color: #b6aca2;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  text-decoration: underline;
  text-underline-position: from-font;
`

const TripPeriod = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
`

const TripStats = styled.p`
  min-height: 20px;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
`

const MapHero = styled.div`
  width: 100%;
  height: 224px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 15px;
  background: #e0e0e0;
  box-shadow: 0 2px 6px rgb(48 38 28 / 6%);
  color: #9ca3af;
  font-family: Inter, sans-serif;
  font-size: 11px;
`

const CitySection = styled.section`
  width: 100%;
  padding: 26px;
  background: #efe7da;
  box-shadow: 0 4px 7px rgb(48 38 28 / 11%);
`

const CityContent = styled.div`
  width: 100%;
  max-width: 350px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
`

const PinList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 25px;
`
