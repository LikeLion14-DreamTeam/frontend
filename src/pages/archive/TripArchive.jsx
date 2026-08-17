import { useEffect, useMemo, useRef, useState } from 'react'
import { Polyline } from '@vis.gl/react-google-maps'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import noteEditIcon from '../../assets/map/note-edit.svg'
import paperTexture from '../../assets/pin-save/manual-pin-form-bg.png'
import GoogleMap, { FOCUS_ZOOM } from '../../components/common/GoogleMap'
import Header from '../../components/layout/Header'
import {
  PhotobookCityHeader,
  PhotobookPinBlock,
} from '../../features/photobooks/components'
import {
  getPhotobook,
  updatePhotobookName,
} from '../../features/photobooks/photobookApi'

const INITIAL_PLAYER = {
  pinId: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
}

const pad2 = (value) => String(value).padStart(2, '0')

const getCount = (value) => {
  const count = Number(value)
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0
}

const getCoordinate = (value) => {
  if (value === null || value === undefined || value === '') return null

  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}

const formatDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

const formatPeriod = (startAt, endAt) =>
  [formatDate(startAt), formatDate(endAt)].filter(Boolean).join(' – ')

const formatDateTime = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${formatDate(value)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

const normalizePhotos = (photos, placeName) =>
  (Array.isArray(photos) ? photos : [])
    .map((photo, index) => {
      const isUrlOnly = typeof photo === 'string'
      const url = isUrlOnly
        ? photo
        : photo.url ?? photo.photo_url ?? photo.file_path
      const rawOrder = isUrlOnly ? index + 1 : Number(photo.order)
      const order = Number.isFinite(rawOrder) ? rawOrder : index + 1

      return {
        id: isUrlOnly
          ? `${url}-${index}`
          : photo.photo_id ?? photo.id ?? `${url}-${index}`,
        url,
        order,
        sourceIndex: index,
        alt: `${placeName} 사진 ${index + 1}`,
      }
    })
    .filter((photo) => Boolean(photo.url))
    .sort(
      (a, b) => a.order - b.order || a.sourceIndex - b.sourceIndex,
    )
    .slice(0, 4)
    .map(({ sourceIndex: _sourceIndex, ...photo }) => photo)

const normalizePin = (pin, cityName, index) => {
  const placeName = pin.place_name?.trim() || '이름 없는 장소'
  const voiceMemo = pin.voice_memo

  return {
    id: pin.pin_id,
    order: Number.isFinite(Number(pin.order)) ? Number(pin.order) : index + 1,
    cityName,
    placeName,
    recordedAt: formatDateTime(pin.tagged_at),
    latitude: getCoordinate(pin.latitude),
    longitude: getCoordinate(pin.longitude),
    note: pin.text_note?.trim() || undefined,
    photos: normalizePhotos(pin.photos, placeName),
    voiceMemo: voiceMemo
      ? {
          audioUrl: voiceMemo.audio_url ?? voiceMemo.audio_file ?? '',
          duration: getCount(voiceMemo.duration_sec),
        }
      : null,
  }
}

const normalizePhotobook = (photobook) => {
  const cities = (Array.isArray(photobook.cities) ? photobook.cities : []).map(
    (city, cityIndex) => {
      const cityName = city.city?.trim() || '이름 없는 도시'
      const pins = (Array.isArray(city.pins) ? city.pins : []).map(
        (pin, pinIndex) => normalizePin(pin, cityName, pinIndex),
      )

      return {
        id: `${cityName}-${city.start_at ?? cityIndex}`,
        name: cityName,
        pinCount: Number.isFinite(Number(city.pin_count))
          ? getCount(city.pin_count)
          : pins.length,
        pins,
      }
    },
  )
  const cityNames = cities.map((city) => city.name).filter(Boolean)

  return {
    id: photobook.photobook_id,
    segmentId: photobook.segment_id,
    title: photobook.name?.trim() || cityNames.join(' · ') || '이름 없는 포토북',
    period: formatPeriod(photobook.start_at, photobook.end_at),
    pinCount: getCount(photobook.pin_count),
    photoCount: getCount(photobook.photo_count),
    voiceCount: getCount(photobook.voice_memo_count),
    cities,
    pins: cities.flatMap((city) => city.pins),
  }
}

const hasCoordinates = (pin) =>
  Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude)

const TripArchive = () => {
  const { tripID: photobookId } = useParams()
  const navigate = useNavigate()
  const audioRef = useRef(null)
  const audioPinIdRef = useRef(null)
  const nameInputRef = useRef(null)
  const [photobook, setPhotobook] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [player, setPlayer] = useState(INITIAL_PLAYER)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    let ignore = false

    const loadPhotobook = async () => {
      audioRef.current?.pause()
      audioRef.current = null
      audioPinIdRef.current = null
      setPlayer(INITIAL_PLAYER)
      setIsEditingName(false)
      setNameDraft('')
      setIsSavingName(false)
      setNameError('')
      setIsLoading(true)
      setErrorMessage('')

      try {
        const detail = await getPhotobook(photobookId)

        if (!ignore) setPhotobook(detail)
      } catch (error) {
        if (ignore) return

        setPhotobook(null)
        setErrorMessage(
          error.message ?? '포토북을 불러오지 못했습니다.',
        )
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadPhotobook()

    return () => {
      ignore = true
    }
  }, [photobookId])

  useEffect(
    () => () => {
      audioRef.current?.pause()
      audioRef.current = null
    },
    [],
  )

  const archive = useMemo(
    () => (photobook ? normalizePhotobook(photobook) : null),
    [photobook],
  )

  const mapPins = useMemo(
    () =>
      (archive?.pins ?? []).filter(hasCoordinates).map((pin) => ({
        id: pin.id,
        name: pin.placeName,
        lat: pin.latitude,
        lng: pin.longitude,
      })),
    [archive],
  )

  const routePath = useMemo(
    () => mapPins.map(({ lat, lng }) => ({ lat, lng })),
    [mapPins],
  )

  const handleStartNameEdit = () => {
    if (!archive || isSavingName) return

    setNameDraft(archive.title)
    setNameError('')
    setIsEditingName(true)

    window.requestAnimationFrame(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    })
  }

  const handleCancelNameEdit = () => {
    if (isSavingName) return

    setIsEditingName(false)
    setNameDraft('')
    setNameError('')
  }

  const handleSubmitName = async (event) => {
    event.preventDefault()
    if (!archive || isSavingName) return

    const nextName = nameDraft.trim()

    if (!nextName) {
      setNameError('포토북 이름을 입력해 주세요.')
      nameInputRef.current?.focus()
      return
    }

    if (nextName === archive.title) {
      setIsEditingName(false)
      setNameDraft('')
      setNameError('')
      return
    }

    setIsSavingName(true)
    setNameError('')

    try {
      const updated = await updatePhotobookName(photobookId, nextName)
      const savedName = updated.name?.trim() || nextName

      setPhotobook((current) =>
        current ? { ...current, name: savedName } : current,
      )
      setIsEditingName(false)
      setNameDraft('')
    } catch (error) {
      setNameError(error.message ?? '포토북 이름을 수정하지 못했습니다.')
    } finally {
      setIsSavingName(false)
    }
  }

  const handleNameKeyDown = (event) => {
    if (event.key === 'Escape') handleCancelNameEdit()
  }

  const handleToggleVoice = (pin) => {
    const audioUrl = pin.voiceMemo?.audioUrl

    if (!audioUrl) {
      setPlayer((current) =>
        current.pinId === pin.id
          ? { ...current, isPlaying: !current.isPlaying }
          : {
              pinId: pin.id,
              isPlaying: true,
              progress: 0.32,
              duration: pin.voiceMemo?.duration ?? 0,
            },
      )
      return
    }

    const currentAudio = audioRef.current

    if (audioPinIdRef.current === pin.id && currentAudio) {
      if (currentAudio.paused) {
        currentAudio.play().then(() => {
          setPlayer((current) => ({ ...current, isPlaying: true }))
        }).catch(() => {
          setPlayer((current) => ({ ...current, isPlaying: false }))
        })
      } else {
        currentAudio.pause()
        setPlayer((current) => ({ ...current, isPlaying: false }))
      }
      return
    }

    currentAudio?.pause()

    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audioPinIdRef.current = pin.id
    setPlayer({
      pinId: pin.id,
      isPlaying: false,
      progress: 0,
      duration: pin.voiceMemo.duration,
    })

    audio.addEventListener('loadedmetadata', () => {
      if (!Number.isFinite(audio.duration)) return

      setPlayer((current) =>
        current.pinId === pin.id
          ? { ...current, duration: audio.duration }
          : current,
      )
    })

    audio.addEventListener('timeupdate', () => {
      const duration = Number.isFinite(audio.duration)
        ? audio.duration
        : pin.voiceMemo.duration
      const progress = duration > 0 ? audio.currentTime / duration : 0

      setPlayer((current) =>
        current.pinId === pin.id ? { ...current, progress } : current,
      )
    })

    audio.addEventListener('ended', () => {
      setPlayer((current) =>
        current.pinId === pin.id
          ? { ...current, isPlaying: false, progress: 0 }
          : current,
      )
    })

    audio.play().then(() => {
      setPlayer((current) =>
        current.pinId === pin.id
          ? { ...current, isPlaying: true }
          : current,
      )
    }).catch(() => {
      setPlayer((current) =>
        current.pinId === pin.id
          ? { ...current, isPlaying: false }
          : current,
      )
    })
  }

  return (
    <PageSurface>
      <Header to="/archive" ariaLabel="포토북 목록으로 돌아가기" />

      <PageContent>
        {isLoading ? <StateMessage>불러오는 중...</StateMessage> : null}

        {!isLoading && errorMessage ? (
          <StateMessage role="alert">{errorMessage}</StateMessage>
        ) : null}

        {!isLoading && !errorMessage && archive ? (
          <>
            <HeroSection>
              <TripSummary>
                <TitleBlock>
                  <TitleRow>
                    {isEditingName ? (
                      <NameEditForm onSubmit={handleSubmitName}>
                        <NameInput
                          ref={nameInputRef}
                          value={nameDraft}
                          onChange={(event) => {
                            setNameDraft(event.target.value)
                            if (nameError) setNameError('')
                          }}
                          onKeyDown={handleNameKeyDown}
                          aria-label="포토북 이름"
                          disabled={isSavingName}
                        />
                        <NameActionButton
                          type="submit"
                          disabled={isSavingName}
                        >
                          {isSavingName ? '저장 중' : '저장'}
                        </NameActionButton>
                        <NameActionButton
                          type="button"
                          onClick={handleCancelNameEdit}
                          disabled={isSavingName}
                        >
                          취소
                        </NameActionButton>
                      </NameEditForm>
                    ) : (
                      <TitleWithEdit>
                        <TripTitle>{archive.title}</TripTitle>
                        <EditNameButton
                          type="button"
                          aria-label="포토북 이름 수정"
                          onClick={handleStartNameEdit}
                        >
                          <EditNameIcon
                            src={noteEditIcon}
                            alt=""
                            aria-hidden="true"
                          />
                        </EditNameButton>
                      </TitleWithEdit>
                    )}
                    <ManageLink
                      /* 여정 관리에서 이 포토북으로 되돌아올 수 있게 id 를 넘긴다. */
                      to={
                        archive.segmentId
                          ? `/trip-management/${archive.segmentId}?photobook=${archive.id}`
                          : '/trip-management'
                      }
                    >
                      여정 관리
                    </ManageLink>
                  </TitleRow>
                  {nameError ? (
                    <NameError role="alert">{nameError}</NameError>
                  ) : null}
                  <TripPeriod>{archive.period}</TripPeriod>
                </TitleBlock>

                <TripStats>
                  {archive.pinCount} PIN · {archive.photoCount} PHOTO ·{' '}
                  {archive.voiceCount} VOICE
                </TripStats>
              </TripSummary>

              <MapHero>
                {mapPins.length ? (
                  <GoogleMap
                    markers={mapPins}
                    /* 핀이 하나뿐이라 영역을 못 잡을 때만 쓰인다.
                       영역 맞춤 상한과 같은 값이라 첫 배율이 일관된다. */
                    zoom={FOCUS_ZOOM}
                    height="100%"
                    borderRadius="15px"
                    bordered={false}
                    mapOptions={{
                      clickableIcons: false,
                      keyboardShortcuts: false,
                    }}
                  >
                    {routePath.length > 1 ? (
                      <Polyline
                        path={routePath}
                        strokeColor="#c99a45"
                        strokeOpacity={0.92}
                        strokeWeight={3}
                      />
                    ) : null}
                  </GoogleMap>
                ) : (
                  <MapPlaceholder>위치 정보가 없습니다.</MapPlaceholder>
                )}
              </MapHero>
            </HeroSection>

            {archive.cities.map((city) => (
              <CitySection key={city.id}>
                <CityContent>
                  <PhotobookCityHeader
                    city={city.name}
                    pinCount={city.pinCount}
                  />

                  <PinList>
                    {city.pins.map((pin) => {
                      const isCurrentVoice = player.pinId === pin.id

                      return (
                        <PhotobookPinBlock
                          key={pin.id}
                          placeName={pin.placeName}
                          recordedAt={pin.recordedAt}
                          photos={pin.photos}
                          note={pin.note}
                          voiceMemo={
                            pin.voiceMemo
                              ? {
                                  duration:
                                    isCurrentVoice && player.duration > 0
                                      ? player.duration
                                      : pin.voiceMemo.duration,
                                  progress: isCurrentVoice
                                    ? player.progress
                                    : 0,
                                  isPlaying:
                                    isCurrentVoice && player.isPlaying,
                                  onToggle: () => handleToggleVoice(pin),
                                }
                              : undefined
                          }
                          onOpenDetail={() =>
                            navigate(`/map/pin/${pin.id}`)
                          }
                          onShare={() =>
                            navigate(
                              `/archive/trip/${photobookId}/pin/${pin.id}/share`,
                              { state: { pin, tripTitle: archive.title } },
                            )
                          }
                        />
                      )
                    })}
                  </PinList>
                </CityContent>
              </CitySection>
            ))}
          </>
        ) : null}
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

const StateMessage = styled.p`
  width: 100%;
  padding: 80px 24px;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
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

/* 아이콘 아래끝을 제목 글자 아래끝에 맞춘다. */
const TitleWithEdit = styled.div`
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
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

/* 홈 화면의 여정 이름 수정 버튼과 같은 크기·아이콘을 쓴다. */
const EditNameButton = styled.button`
  width: 17px;
  height: 16px;
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

const NameEditForm = styled.form`
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
`

const NameInput = styled.input`
  min-width: 0;
  flex: 1;
  height: 34px;
  padding: 4px 8px;
  border: 1px solid #c99a45;
  border-radius: 6px;
  outline: none;
  color: var(--Text-Primary);
  background: rgb(255 253 248 / 76%);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;

  &:focus {
    box-shadow: 0 0 0 2px rgb(201 154 69 / 18%);
  }

  &:disabled {
    opacity: 0.65;
  }
`

const NameActionButton = styled.button`
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  color: #8f8173;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
`

const NameError = styled.p`
  color: #b8564f;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
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
  height: 300px;
  overflow: hidden;
  border-radius: 15px;
  background: #e0e0e0;
  box-shadow: 0 2px 6px rgb(48 38 28 / 6%);
`

const MapPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-family: var(--font-sans);
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
