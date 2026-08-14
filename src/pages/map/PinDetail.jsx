import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Marker } from '@vis.gl/react-google-maps'
import GoogleMap from '../../components/common/GoogleMap'
import activePinIcon from '../../assets/map/map-pin-active.svg'
import backIcon from '../../assets/map/detail-back.svg'
import openMapIcon from '../../assets/map/open-map.svg'
import photoAddIcon from '../../assets/map/photo-add.svg'
import refreshIcon from '../../assets/map/refresh.svg'
import voicePlayIcon from '../../assets/map/voice-play.svg'
import { MAP_STYLES } from './mapStyles'
import { deletePin, getPin, updatePin } from '../../features/pins/pinApi'
import { getTrip, getTripPins } from '../../features/trips/tripApi'

// 지도에서 넘어오는 경로가 아직 없어 pinID 가 비면 이 값을 쓴다.
const FALLBACK_PIN_ID = 101

const detailDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const formatTaggedAt = (taggedAt) =>
  taggedAt
    ? detailDateFormatter.format(new Date(taggedAt)).replace(/\. /g, '.')
    : ''

const formatDuration = (seconds) => {
  if (seconds == null) return ''

  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

const waveHeights = [
  5, 9, 14, 7, 17, 11, 6, 15, 19, 9, 5, 12, 17, 8, 11, 5, 10, 15,
  7, 13, 9, 6, 11, 16, 8, 12, 6, 14, 9, 5, 11, 17, 7, 10, 15, 8,
  13, 6, 12, 18, 9, 7, 14, 11, 5, 16, 8, 12, 10, 6, 15, 9, 7, 13,
  11, 6,
]

const PinDetail = () => {
  const navigate = useNavigate()
  const { pinID = FALLBACK_PIN_ID } = useParams()

  const [isPlaying, setIsPlaying] = useState(false)
  const [pin, setPin] = useState(null)
  const [journey, setJourney] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [noteError, setNoteError] = useState('')

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await getPin(pinID)
        if (!ignore) setPin(data)
      } catch (error) {
        if (!ignore) setErrorMessage(error.message)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [pinID])

  /**
   * 여정 칩(`n개 핀 중 m번째`)에 필요한 값은 5.1 응답에 없어서 4번 API로 따로 받는다.
   * segment_id 가 없으면(진행 중인 여정) 칩을 그리지 않는다.
   */
  useEffect(() => {
    const segmentId = pin?.segment_id

    if (!segmentId) {
      setJourney(null)
      return undefined
    }

    let ignore = false

    const loadJourney = async () => {
      try {
        const [trip, pinList] = await Promise.all([
          getTrip(segmentId),
          getTripPins(segmentId),
        ])

        if (ignore) return

        const order =
          pinList.pins.findIndex((item) => item.pin_id === pin.pin_id) + 1

        setJourney(
          order > 0
            ? { name: trip.name, total: pinList.pins.length, order }
            : null,
        )
      } catch {
        // 칩은 부가 정보라 실패해도 화면을 막지 않는다.
        if (!ignore) setJourney(null)
      }
    }

    loadJourney()

    return () => {
      ignore = true
    }
  }, [pin])

  if (isLoading || !pin) {
    return (
      <Page>
        <StateMessage role={errorMessage ? 'alert' : undefined}>
          {errorMessage || '불러오는 중...'}
        </StateMessage>
      </Page>
    )
  }

  const startEditingNote = () => {
    setNoteDraft(pin.text_note ?? '')
    setNoteError('')
    setIsEditingNote(true)
  }

  const saveNote = async () => {
    setIsSavingNote(true)
    setNoteError('')

    try {
      // 5.2 는 장소명과 텍스트 기록을 함께 받는다. 장소명은 편집 UI 가 없어 그대로 보낸다.
      const updated = await updatePin(pinID, {
        placeName: pin.place_name,
        textNote: noteDraft,
      })

      setPin((prev) => ({ ...prev, text_note: updated.text_note }))
      setIsEditingNote(false)
    } catch (error) {
      setNoteError(error.message)
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError('')

    try {
      await deletePin(pinID)
      navigate('/map', { replace: true })
    } catch (error) {
      setDeleteError(error.message)
      setIsDeleting(false)
      setIsConfirmingDelete(false)
    }
  }

  // 위치 권한을 거부한 상태로 저장된 핀은 좌표가 없다. 지도를 그리지 않는다.
  const hasCoordinates = pin.latitude !== null && pin.longitude !== null
  const position = hasCoordinates
    ? { lat: pin.latitude, lng: pin.longitude }
    : null
  const title = pin.place_name || pin.address || '이름 없는 장소'
  const representativePhotos = pin.representative_photos ?? []
  // 5.3: 여정에 배정되기 전(진행 중)인 핀만 삭제할 수 있다.
  const isDeletable = pin.segment_id === null
  const hasMemo =
    Boolean(pin.text_note) || Boolean(pin.voice_memo) || isEditingNote

  return (
    <Page>
      <MapHero>
        {hasCoordinates ? (
          <GoogleMap
            center={position}
            zoom={15.5}
            height="100%"
            styles={MAP_STYLES}
            borderRadius="0"
            bordered={false}
            mapOptions={{ clickableIcons: false, keyboardShortcuts: false }}
          >
            <Marker position={position} icon={activePinIcon} title={title} />
          </GoogleMap>
        ) : (
          <NoLocation>위치 정보 없음</NoLocation>
        )}

        <BackButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <img src={backIcon} alt="" />
        </BackButton>

        {journey && (
          <JourneyChip>
            {journey.name} · {journey.total}개 핀 중 {journey.order}번째
          </JourneyChip>
        )}

        {hasCoordinates && (
          <OpenMapButton type="button" onClick={() => navigate('/map')}>
            <img src={openMapIcon} alt="" />
            지도에서 보기
          </OpenMapButton>
        )}
      </MapHero>

      <DetailSheet>
        <SheetHandle aria-hidden="true" />

        <DetailContent>
          <PinIntro>
            <HeadingGroup>
              <PinTitle>{title}</PinTitle>
              <PinMeta>
                {pin.address}
                {pin.address && pin.tagged_at && (
                  <>&nbsp;&nbsp;·&nbsp;&nbsp;</>
                )}
                {formatTaggedAt(pin.tagged_at)}
              </PinMeta>
            </HeadingGroup>

            {hasMemo && (
              <Memo>
                <MemoRule />
                <MemoBody>
                  {isEditingNote ? (
                    <NoteEditor>
                      <NoteInput
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        aria-label="텍스트 기록"
                        placeholder="이 순간을 기록해보세요"
                        rows={3}
                      />
                      {noteError && <NoteError role="alert">{noteError}</NoteError>}
                      <NoteActions>
                        <NoteCancel
                          type="button"
                          onClick={() => setIsEditingNote(false)}
                          disabled={isSavingNote}
                        >
                          취소
                        </NoteCancel>
                        <NoteSave
                          type="button"
                          onClick={saveNote}
                          disabled={isSavingNote}
                        >
                          {isSavingNote ? '저장 중...' : '저장'}
                        </NoteSave>
                      </NoteActions>
                    </NoteEditor>
                  ) : (
                    pin.text_note && (
                      <NoteRow>
                        <MemoText>{pin.text_note}</MemoText>
                        <EditIndicator
                          type="button"
                          aria-label="텍스트 기록 수정"
                          onClick={startEditingNote}
                        >
                          수정
                        </EditIndicator>
                      </NoteRow>
                    )
                  )}

                  {pin.voice_memo && (
                    <VoiceBar>
                      <PlayButton
                        type="button"
                        aria-label={isPlaying ? '음성 일시정지' : '음성 재생'}
                        aria-pressed={isPlaying}
                        onClick={() => setIsPlaying((playing) => !playing)}
                      >
                        <img src={voicePlayIcon} alt="" />
                      </PlayButton>
                      <Waveform aria-hidden="true">
                        {waveHeights.map((height, index) => (
                          <Wave
                            key={`${height}-${index}`}
                            $height={height}
                            $played={index < (isPlaying ? 32 : 18)}
                          />
                        ))}
                      </Waveform>
                      <Duration>
                        {formatDuration(pin.voice_memo.duration_sec)}
                      </Duration>
                    </VoiceBar>
                  )}
                </MemoBody>
              </Memo>
            )}
          </PinIntro>

          <PhotosSection>
            <SectionHeading>
              <EditorialTitle>PHOTOS</EditorialTitle>
              <HeadingLine />
              <TextAction
                type="button"
                onClick={() => navigate('./photos')}
              >
                모두 보기
              </TextAction>
            </SectionHeading>

            {/* TODO: 세 번째 사진 위의 `+5` 배지 복구 대기.
                5.1 응답에 핀의 전체 사진 수가 없어 계산할 수 없다.
                5.4 사진 목록을 붙이면 그 개수로 표시한다. */}
            <PhotoGrid>
              <Photo $tone="main">
                {representativePhotos[0] && (
                  <PhotoImage src={representativePhotos[0].url} alt="" />
                )}
              </Photo>
              <PhotoStack>
                <Photo $tone="light">
                  {representativePhotos[1] && (
                    <PhotoImage src={representativePhotos[1].url} alt="" />
                  )}
                </Photo>
                <Photo $tone="dark">
                  {representativePhotos[2] && (
                    <PhotoImage src={representativePhotos[2].url} alt="" />
                  )}
                </Photo>
              </PhotoStack>
            </PhotoGrid>
          </PhotosSection>

          <SuggestedSection>
            <SuggestedHeading>
              <SuggestedTitle>
                <EditorialTitle>SUGGESTED</EditorialTitle>
                <SuggestedCount>3</SuggestedCount>
              </SuggestedTitle>
              <HeadingLine />
              <RefreshButton type="button">
                <img src={refreshIcon} alt="" />
                재추천
              </RefreshButton>
            </SuggestedHeading>
            <SuggestedDescription>
              AI가 이 장소 주변, 같은 시간대에 찍은 사진 중에서 골랐어요
            </SuggestedDescription>

            <SuggestedGrid>
              {['soft', 'warm', 'main'].map((tone) => (
                <SuggestedPhoto key={tone} $tone={tone}>
                  <AddButton type="button" aria-label="추천 사진 추가">
                    <img src={photoAddIcon} alt="" />
                  </AddButton>
                </SuggestedPhoto>
              ))}
            </SuggestedGrid>
          </SuggestedSection>

          {/* TODO: 임시 UI. 시안에 핀 삭제가 없어 위치·문구·색상을 임의로 정했다. */}
          {isDeletable && (
            <DeleteSection>
              {deleteError && <DeleteError role="alert">{deleteError}</DeleteError>}

              {isConfirmingDelete ? (
                <DeleteConfirm>
                  <DeleteWarning>
                    이 핀의 사진과 음성 메모가 함께 삭제됩니다. 되돌릴 수 없습니다.
                  </DeleteWarning>
                  <DeleteActions>
                    <DeleteCancelButton
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isDeleting}
                    >
                      취소
                    </DeleteCancelButton>
                    <DeleteConfirmButton
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '삭제 중...' : '삭제할게요'}
                    </DeleteConfirmButton>
                  </DeleteActions>
                </DeleteConfirm>
              ) : (
                <DeleteTrigger
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  이 핀 삭제
                </DeleteTrigger>
              )}
            </DeleteSection>
          )}
        </DetailContent>
      </DetailSheet>
    </Page>
  )
}

export default PinDetail

const Page = styled.main`
  width: 100%;
  max-width: 450px;
  height: var(--app-viewport-height);
  margin: 0 auto;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--Background-Base);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

/* 아래 삭제 관련 스타일은 디자인 회신 전까지 쓰는 임시 스타일이다. */
const DeleteSection = styled.section`
  display: flex;
  flex-direction: column;
`

const DeleteTrigger = styled.button`
  width: 100%;
  min-height: 44px;
  border: 0;
  background: none;
  color: var(--Text-Secondary);
  font: var(--text-ui-button);
  text-decoration: underline;
  cursor: pointer;
`

const DeleteConfirm = styled.div`
  border: 1px solid var(--Primary-Cognac);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgb(181 118 59 / 9%);
`

const DeleteWarning = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-caption);
  text-align: center;
  word-break: keep-all;
`

const DeleteActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`

const DeleteCancelButton = styled.button`
  min-height: 44px;
  border: 1px solid var(--Border-Default);
  border-radius: 22px;
  background: var(--Surface-Base);
  color: var(--Text-Secondary);
  font: var(--text-ui-button);
  cursor: pointer;

  &:disabled {
    color: var(--State-Disabled-Text);
    cursor: not-allowed;
  }
`

const DeleteConfirmButton = styled.button`
  min-height: 44px;
  border: 0;
  border-radius: 22px;
  background: var(--Primary-Cognac);
  color: var(--Text-Inverse);
  font: var(--text-ui-button);
  cursor: pointer;

  &:disabled {
    background: var(--State-Disabled-Fill);
    color: var(--State-Disabled-Text);
    cursor: not-allowed;
  }
`

const DeleteError = styled.p`
  margin-bottom: 10px;
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  text-align: center;
  word-break: keep-all;
`

const NoLocation = styled.p`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--Map-Base);
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
`

const StateMessage = styled.p`
  padding: 120px 24px;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
`

const MapHero = styled.section`
  position: relative;
  height: 348px;
  overflow: hidden;
  background: var(--Map-Base);
`

const BackButton = styled.button`
  position: absolute;
  z-index: 3;
  top: 58px;
  left: 24px;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  img {
    width: 40px;
    height: 40px;
    display: block;
  }
`

const JourneyChip = styled.span`
  position: absolute;
  z-index: 3;
  bottom: 59px;
  left: 20px;
  padding: 7px 12px;
  border-radius: 14px;
  background: rgb(42 37 34 / 60%);
  box-shadow: var(--Effect-Chip);
  color: var(--Text-Inverse);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const OpenMapButton = styled.button`
  position: absolute;
  z-index: 3;
  right: 22px;
  bottom: 59px;
  padding: 7px 12px;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 14px;
  background: rgb(255 253 249 / 95%);
  box-shadow: var(--Effect-Chip);
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  white-space: nowrap;
  cursor: pointer;

  img {
    width: 15px;
    height: 15px;
    display: block;
  }
`

const DetailSheet = styled.section`
  position: relative;
  z-index: 2;
  min-height: 719px;
  margin-top: -31px;
  border-radius: 30px 30px 0 0;
  background: var(--Background-Base);
  box-shadow: var(--Effect-Bottom-Sheet);
`

const SheetHandle = styled.div`
  position: absolute;
  top: 13px;
  left: 50%;
  width: 54px;
  height: 4px;
  border-radius: 2px;
  background: rgb(181 161 140 / 50%);
  transform: translateX(-50%);
`

const DetailContent = styled.div`
  padding: 60px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 38px;
`

const PinIntro = styled.section`
  width: 100%;
  max-width: 354px;
  display: flex;
  flex-direction: column;
  gap: 22px;
`

const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PinTitle = styled.h1`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
`

const PinMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const Memo = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px;
`

const MemoRule = styled.div`
  width: 2px;
  min-height: 72px;
  flex: 0 0 auto;
  background: var(--Accent-Gold);
`

const MemoBody = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const MemoText = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-body-m);
`

const NoteRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`

/* TODO: 임시 UI. 시안에 텍스트 기록 수정 지시자가 없어 문구·모양을 임의로 정했다. */
const EditIndicator = styled.button`
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: none;
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  text-decoration: underline;
  cursor: pointer;
`

const NoteEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const NoteInput = styled.textarea`
  width: 100%;
  border: 1px solid var(--Border-Default);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--Text-Primary);
  background: var(--Surface-Base);
  font: var(--text-ui-body-m);
  resize: none;
  outline: none;

  &:focus {
    border-color: var(--Primary-Cognac);
  }
`

const NoteError = styled.p`
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const NoteActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`

const NoteCancel = styled.button`
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid var(--Border-Default);
  border-radius: 16px;
  background: var(--Surface-Base);
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  cursor: pointer;

  &:disabled {
    color: var(--State-Disabled-Text);
    cursor: not-allowed;
  }
`

const NoteSave = styled.button`
  min-height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 16px;
  background: var(--Primary-Cognac);
  color: var(--Text-Inverse);
  font: var(--text-ui-caption);
  cursor: pointer;

  &:disabled {
    background: var(--State-Disabled-Fill);
    color: var(--State-Disabled-Text);
    cursor: not-allowed;
  }
`

const VoiceBar = styled.div`
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
`

const PlayButton = styled.button`
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  img {
    width: 22px;
    height: 22px;
    display: block;
  }
`

const Waveform = styled.span`
  min-width: 0;
  height: 24px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
`

const Wave = styled.span`
  width: 2px;
  height: ${({ $height }) => `${$height}px`};
  flex: 0 0 2px;
  border-radius: 1px;
  background: ${({ $played }) =>
    $played ? 'var(--Primary-Cognac)' : 'rgb(181 161 140 / 45%)'};
`

const Duration = styled.span`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font-family: var(--font-sans);
  font-size: 10px;
  line-height: 18px;
`

const PhotosSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`

const EditorialTitle = styled.h2`
  color: var(--Text-Primary);
  font: var(--text-editorial-brand);
  letter-spacing: 1.44px;
  white-space: nowrap;
`

const HeadingLine = styled.span`
  min-width: 20px;
  height: 1px;
  flex: 1;
  background: var(--Border-Default);
`

const TextAction = styled.button`
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  white-space: nowrap;
  cursor: pointer;
`

const PhotoGrid = styled.div`
  width: 100%;
  height: 164px;
  display: grid;
  grid-template-columns: minmax(0, 1.85fr) minmax(0, 1fr);
  /* 행 높이를 고정하지 않으면 사진 원본 크기가 그리드를 밀어낸다. */
  grid-template-rows: minmax(0, 1fr);
  gap: 6px;
`

const toneBackgrounds = {
  main: 'linear-gradient(180deg, #d6b591 0%, #8b6242 100%)',
  light: 'linear-gradient(180deg, #e3c49e 0%, #a87952 100%)',
  dark: 'linear-gradient(180deg, #b38a65 0%, #6b4d38 100%)',
  soft: 'linear-gradient(180deg, #eed9b6 0%, #b98a5c 100%)',
  warm: 'linear-gradient(180deg, #e9c89a 0%, #a9784e 100%)',
}

const Photo = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: 12px;
  background: ${({ $tone }) => toneBackgrounds[$tone]};
`

const PhotoImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const PhotoStack = styled.div`
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 6px;
`

const PhotoOverlay = styled.span`
  position: absolute;
  inset: 0;
  background: rgb(36 28 22 / 55%);
`

const PhotoCount = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--Background-Base);
  font: var(--text-editorial-brand);
  letter-spacing: 1.44px;
`

const SuggestedSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SuggestedHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
`

const SuggestedTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
`

const SuggestedCount = styled.span`
  color: var(--Accent-Gold);
  font: var(--text-editorial-brand);
  letter-spacing: 0.24px;
`

const RefreshButton = styled.button`
  flex: 0 0 auto;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  white-space: nowrap;
  cursor: pointer;

  img {
    width: 15px;
    height: 15px;
    display: block;
  }
`

const SuggestedDescription = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

const SuggestedGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`

const SuggestedPhoto = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 12px;
  background: ${({ $tone }) => toneBackgrounds[$tone]};
`

const AddButton = styled.button`
  position: absolute;
  right: 1px;
  bottom: -1px;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 38px;
    height: 38px;
    display: block;
  }
`
