import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import Button from '../../components/common/Button'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import GoogleMap from '../../components/common/GoogleMap'
import SnapSheet from '../../components/common/SnapSheet'
import PhotoPreviewOverlay from '../../components/common/PhotoPreviewOverlay'
import PhotoUploadStatus from '../../components/common/PhotoUploadStatus'
import VoiceMemoBar from '../../components/common/VoiceMemoBar'
import activePinIcon from '../../assets/map/map-pin-active.svg'
import deleteWarningIcon from '../../assets/icons/delete-warning.svg'
import backIcon from '../../assets/map/detail-back.svg'
import refreshIcon from '../../assets/map/refresh.svg'
import photoAddIcon from '../../assets/map/photo-add-round.svg'
import noteEditIcon from '../../assets/map/note-edit.svg'
import {
  cacheRepresentativePhotos,
  deletePin,
  getPin,
  getPinPhotos,
  getPinVoiceMemos,
  refreshRepresentativePhotos,
  updatePin,
} from '../../features/pins/pinApi'
import {
  addNearbyPhotos,
  describeRejected,
} from '../../features/pins/nearbyPhotos'
import {
  MAX_PIN_PHOTOS,
  PHOTO_UPLOAD_BATCH_SIZE,
  getRemainingPhotoCapacity,
} from '../../features/pins/photoUploadQueue'
import { getTrip, getTripPins } from '../../features/trips/tripApi'

// 지도에서 넘어오는 경로가 아직 없어 pinID 가 비면 이 값을 쓴다.
const FALLBACK_PIN_ID = 101
const DETAIL_MAP_ZOOM = 15.5

/* 기록 시트가 서는 세 자리. 값은 모두 화면 위에서부터 잰 거리다. */
const SHEET_TOP_INSET = 44
const SHEET_DEFAULT_TOP = 317
const SHEET_PEEK = 54

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

/** 삭제 확인 모달의 대상 카드에 쓸 요약. 예) 2024.11.03 · 사진 138장 · 음성 */
const formatDeleteMeta = (pin, photoCount) => {
  const taggedAt = pin.tagged_at ? new Date(pin.tagged_at) : null
  const pad2 = (value) => String(value).padStart(2, '0')

  return [
    taggedAt
      ? `${taggedAt.getFullYear()}.${pad2(taggedAt.getMonth() + 1)}.${pad2(taggedAt.getDate())}`
      : '',
    `사진 ${photoCount}장`,
    pin.voice_memo ? '음성' : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * 화면 픽셀만큼 남쪽으로 내린 중심을 구한다. 그만큼 핀이 위로 올라온다.
 * 시트가 열린 상태에서 가려지지 않는 지도 영역의 가운데에 핀이 오도록 쓴다.
 */
const getOffsetCenter = (map, core, position, zoom, offsetPx) => {
  const projection = map.getProjection()
  if (!core || !projection) return null

  const point = projection.fromLatLngToPoint(position)
  const shifted = new core.Point(point.x, point.y + offsetPx / 2 ** zoom)
  const latLng = projection.fromPointToLatLng(shifted)

  return { lat: latLng.lat(), lng: latLng.lng() }
}

const CenterPinForSheet = ({ latitude, longitude, offsetPx }) => {
  const map = useMap()
  const core = useMapsLibrary('core')

  useEffect(() => {
    if (!map || !core) return undefined

    const applyOffsetCenter = () => {
      const zoom = map.getZoom()
      if (zoom == null) return false

      const center = getOffsetCenter(
        map,
        core,
        { lat: latitude, lng: longitude },
        zoom,
        offsetPx,
      )
      if (!center) return false

      if (typeof map.moveCamera === 'function') {
        map.moveCamera({ center, zoom })
      } else {
        map.setCenter(center)
      }

      return true
    }

    if (applyOffsetCenter()) return undefined

    const listener =
      typeof map.addListener === 'function'
        ? map.addListener('idle', () => {
            if (applyOffsetCenter()) listener.remove()
          })
        : null

    return () => listener?.remove()
  }, [core, latitude, longitude, map, offsetPx])

  return null
}

const PinDetail = () => {
  const navigate = useNavigate()
  const { pinID = FALLBACK_PIN_ID } = useParams()

  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioSrc, setAudioSrc] = useState(null)
  const [playedRatio, setPlayedRatio] = useState(0)
  const [playedSec, setPlayedSec] = useState(0)
  /* 파일 메타데이터가 서버의 계산값보다 정확하므로 화면 표시에 우선한다. */
  const [audioDuration, setAudioDuration] = useState(0)
  const [voiceError, setVoiceError] = useState('')
  const [pin, setPin] = useState(null)
  const [photos, setPhotos] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const [journey, setJourney] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError] = useState('')

  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [noteError, setNoteError] = useState('')

  /** 크게 보고 있는 추천 사진의 자리. 없으면 -1 */
  const [suggestedIndex, setSuggestedIndex] = useState(-1)

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight)
  const [sheetOffset, setSheetOffset] = useState(0)

  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [addMessage, setAddMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(null)

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', updateViewportHeight)
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        // PHOTOS 그리드에 쓸 사진 목록은 5.1 응답에 없어 5.4 로 따로 받는다.
        const [data, photoList] = await Promise.all([
          getPin(pinID),
          getPinPhotos(pinID),
        ])

        if (!ignore) {
          setPin(data)
          setPhotos(photoList.photos)
        }
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
   * 5.8. 5.1 은 음성 메모의 길이만 주고 재생할 파일 주소는 주지 않는다.
   * 메모가 있는 핀에서만 한 번 더 받아 재생 버튼에 물린다.
   */
  useEffect(() => {
    const voiceMemoId = pin?.voice_memo?.voice_memo_id

    if (!voiceMemoId) {
      setAudioSrc(null)
      return undefined
    }

    let ignore = false

    const loadVoiceMemo = async () => {
      setAudioDuration(0)
      setPlayedSec(0)
      setPlayedRatio(0)

      try {
        const { voice_memo: memo } = await getPinVoiceMemos(pinID)

        if (!ignore) setAudioSrc(memo?.audio_file ?? null)
      } catch {
        if (!ignore) setVoiceError('음성 메모를 불러오지 못했어요.')
      }
    }

    loadVoiceMemo()

    return () => {
      ignore = true
    }
  }, [pinID, pin?.voice_memo?.voice_memo_id])

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

  const startEditingName = () => {
    setNameDraft(pin.place_name ?? '')
    setNameError('')
    setIsEditingName(true)
  }

  /* 5.2 는 장소명과 텍스트 기록을 함께 받는다. 한쪽만 고칠 때도 다른 쪽을
     그대로 실어 보내야 지워지지 않는다. */
  const saveName = async () => {
    setIsSavingName(true)
    setNameError('')

    try {
      const updated = await updatePin(pinID, {
        placeName: nameDraft,
        textNote: pin.text_note ?? '',
      })

      setPin((prev) => ({ ...prev, place_name: updated.place_name }))
      setIsEditingName(false)
    } catch (error) {
      setNameError(error.message)
    } finally {
      setIsSavingName(false)
    }
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
      const updated = await updatePin(pinID, {
        placeName: pin.place_name ?? '',
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

  const handleTogglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    // 버튼에 그리는 상태는 브라우저 이벤트로 갱신된다. 클릭 순간에는 그 값이
    // 실제 미디어 상태보다 늦을 수 있으므로, 재생/정지는 audio 자체를 기준으로
    // 판단한다. 그래야 첫 클릭도 곧바로 재생 요청으로 이어진다.
    if (!audio.paused) {
      audio.pause()
      return
    }

    try {
      setVoiceError('')
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
      setVoiceError('음성을 재생할 수 없어요.')
    }
  }

  /** 5.5. 전체 사진 보기의 `주변 사진 추가` 와 같은 흐름이다. */
  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) return

    setIsUploading(true)
    setAddMessage('')
    const uploadableCount = Math.min(
      files.length,
      getRemainingPhotoCapacity(photos.length),
    )
    setUploadProgress(
      uploadableCount > 0
        ? {
            phase: 'upload',
            completed: 0,
            total: uploadableCount,
            batchIndex: 1,
            totalBatches: Math.ceil(uploadableCount / PHOTO_UPLOAD_BATCH_SIZE),
          }
        : null,
    )

    try {
      const { added, rejected } = await addNearbyPhotos(pinID, files, {
        currentPhotoCount: photos.length,
        onProgress: setUploadProgress,
      })

      const lines = []
      if (added.length > 0) {
        lines.push(
          rejected.length > 0
            ? `${files.length}장 중 ${added.length}장을 추가했어요.`
            : `사진 ${added.length}장을 추가했어요.`,
        )
      }
      if (rejected.length > 0) {
        lines.push(
          `${rejected.length}장은 추가하지 못했어요 · ${describeRejected(rejected)}`,
        )
      }
      setAddMessage(lines.join(' '))

      const photoList = await getPinPhotos(pinID)
      setPhotos(photoList.photos)
    } catch (error) {
      setAddMessage(error.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleRefreshSuggested = async () => {
    setIsRefreshing(true)
    setRefreshError('')

    try {
      const result = await refreshRepresentativePhotos(pinID)
      cacheRepresentativePhotos(pinID, result.representative_photos)
      setPin((prev) => ({
        ...prev,
        representative_photos: result.representative_photos,
      }))
    } catch (error) {
      setRefreshError(error.message)
    } finally {
      setIsRefreshing(false)
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

  // API 응답 좌표가 문자열일 때도 새로고침 직후 마커/중심 계산이 깨지지 않게 맞춘다.
  const latitude = Number(pin.latitude)
  const longitude = Number(pin.longitude)

  // 위치 권한을 거부한 상태로 저장된 핀은 좌표가 없다. 지도를 그리지 않는다.
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
  const position = hasCoordinates
    ? { lat: latitude, lng: longitude }
    : null
  const title = pin.place_name || pin.address || '이름 없는 장소'
  const apiRepresentativePhotos = (pin.representative_photos ?? [])
    .filter((photo) => photo?.url)
    .slice(0, 3)
  const representativePhotos = apiRepresentativePhotos.length
    ? apiRepresentativePhotos
    : photos
        .filter((photo) => photo.is_pin_cover && photo.file_path)
        .slice(0, 3)
        .map((photo) => ({ photo_id: photo.photo_id, url: photo.file_path }))
  const previewPhotos = photos.slice(0, 3)
  // 미리보기 세 칸에 안 들어간 나머지 장수
  const hiddenPhotoCount = Math.max(photos.length - previewPhotos.length, 0)
  // 5.3: 여정에 배정되기 전(진행 중)인 핀만 삭제할 수 있다.
  const isDeletable = pin.segment_id === null
  /*
   * 시트는 세 자리를 오간다.
   *
   * 끝까지 올리면 위 44px 만 남기고 지도를 덮고, 처음에는 예전처럼 상단에서
   * 317px 자리에 서며, 끝까지 내리면 54px 만 남기고 지도를 보여준다.
   * 뒤로 가기 버튼은 시트보다 위에 있어 어느 자리에서든 누를 수 있다.
   */
  const detailSheetHeight = Math.max(403, viewportHeight - SHEET_TOP_INSET)
  const sheetDefaultOffset = Math.max(
    0,
    Math.min(SHEET_DEFAULT_TOP - SHEET_TOP_INSET, detailSheetHeight - SHEET_PEEK),
  )
  const sheetCollapsedOffset = detailSheetHeight - SHEET_PEEK
  // 지도 핀을 띄울 기준은 처음 자리에서 시트가 가리는 높이다.
  const defaultVisibleSheet = detailSheetHeight - sheetDefaultOffset

  return (
    <Page>
      <MapHero>
        {hasCoordinates ? (
          <GoogleMap
            center={position}
            zoom={DETAIL_MAP_ZOOM}
            height="100%"
            borderRadius="0"
            bordered={false}
            mapOptions={{ clickableIcons: false, keyboardShortcuts: false }}
          >
            <Marker position={position} icon={activePinIcon} title={title} />
            <CenterPinForSheet
              latitude={position.lat}
              longitude={position.lng}
              offsetPx={defaultVisibleSheet / 2}
            />
          </GoogleMap>
        ) : (
          <NoLocation>위치 정보 없음</NoLocation>
        )}

        <BackButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <img src={backIcon} alt="" />
        </BackButton>

        {journey && (
          <JourneyChip $sheetHeight={detailSheetHeight} $sheetOffset={sheetOffset}>
            {journey.name} · {journey.total}개 핀 중 {journey.order}번째
          </JourneyChip>
        )}

      </MapHero>

      <DetailSheet
        ariaLabel="핀 기록"
        collapsedOffset={sheetCollapsedOffset}
        snapOffsets={[sheetDefaultOffset]}
        expandOnScroll
        initialOffset={sheetDefaultOffset}
        height={detailSheetHeight}
        onOffsetChange={setSheetOffset}
      >

        <DetailContent>
          <PinIntro>
            <HeadingGroup>
              {isEditingName ? (
                <NoteEditor>
                  <NameInput
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    aria-label="장소 이름"
                    placeholder="이 장소의 이름"
                  />
                  {nameError && <NoteError role="alert">{nameError}</NoteError>}
                  <NoteActions>
                    <NoteCancel
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      disabled={isSavingName}
                    >
                      취소
                    </NoteCancel>
                    <NoteSave
                      type="button"
                      onClick={saveName}
                      disabled={isSavingName}
                    >
                      {isSavingName ? '저장 중...' : '저장'}
                    </NoteSave>
                  </NoteActions>
                </NoteEditor>
              ) : (
                <TitleRow>
                  <PinTitle>{title}</PinTitle>
                  <EditNameButton
                    type="button"
                    aria-label="장소 이름 수정"
                    onClick={startEditingName}
                  >
                    <img src={noteEditIcon} alt="" />
                  </EditNameButton>
                </TitleRow>
              )}
              <PinMeta>
                {pin.address && <PinMetaAddress>{pin.address}</PinMetaAddress>}
                {pin.address && pin.tagged_at && (
                  <PinMetaDivider aria-hidden="true">·</PinMetaDivider>
                )}
                {pin.tagged_at && (
                  <PinMetaTime>{formatTaggedAt(pin.tagged_at)}</PinMetaTime>
                )}
              </PinMeta>
            </HeadingGroup>

            {/* 기록이 없어도 형식은 그대로 두고, 수정 버튼으로 새로 남길 수 있게 한다. */}
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
                ) : pin.text_note ? (
                  <MemoText>{pin.text_note}</MemoText>
                ) : (
                  !pin.voice_memo && (
                    <MemoEmpty>남긴 기록이 없습니다.</MemoEmpty>
                  )
                )}

                {pin.voice_memo && (
                  <>
                    <VoiceMemoBar
                      duration={
                        audioDuration > 0
                          ? audioDuration
                          : pin.voice_memo.duration_sec
                      }
                      position={playedSec}
                      isPlaying={isPlaying}
                      progress={playedRatio}
                      onToggle={handleTogglePlay}
                      disabled={!audioSrc}
                    />

                    {/* 파일 메타데이터를 읽어 서버 계산값과 실제 재생 길이를 맞춘다. */}
                    <audio
                      ref={audioRef}
                      src={audioSrc ?? undefined}
                      preload="metadata"
                      onLoadedMetadata={(event) => {
                        const { duration } = event.currentTarget
                        if (Number.isFinite(duration)) setAudioDuration(duration)
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={(event) => {
                        const { currentTime, duration } = event.currentTarget
                        setPlayedSec(currentTime)
                        setPlayedRatio(
                          duration ? currentTime / duration : 0,
                        )
                      }}
                      onEnded={() => {
                        setIsPlaying(false)
                        setPlayedSec(0)
                        setPlayedRatio(0)
                      }}
                      onError={() =>
                        setVoiceError('음성을 재생할 수 없어요.')
                      }
                    />

                    {voiceError && (
                      <VoiceError role="alert">{voiceError}</VoiceError>
                    )}
                  </>
                )}
              </MemoBody>

              {!isEditingNote && (
                <EditNoteButton
                  type="button"
                  aria-label="텍스트 기록 수정"
                  onClick={startEditingNote}
                >
                  <img src={noteEditIcon} alt="" />
                </EditNoteButton>
              )}
            </Memo>
          </PinIntro>

          <PhotosSection>
            <SectionHeading>
              <EditorialTitle>PHOTOS</EditorialTitle>
              <HeadingLine />
              <PhotoCapacity>
                {photos.length}/{MAX_PIN_PHOTOS} ·{' '}
                {getRemainingPhotoCapacity(photos.length)}장 남음
              </PhotoCapacity>
              <TextAction
                type="button"
                onClick={() => navigate('./photos')}
              >
                모두 보기
              </TextAction>
            </SectionHeading>

            <PhotoGrid>
              <Photo $tone="main">
                {previewPhotos[0] && (
                  <PhotoImage src={previewPhotos[0].file_path} alt="" crossOrigin="anonymous" />
                )}
              </Photo>
              <PhotoStack>
                <Photo $tone="light">
                  {previewPhotos[1] && (
                    <PhotoImage src={previewPhotos[1].file_path} alt="" crossOrigin="anonymous" />
                  )}
                </Photo>
                <Photo $tone="dark">
                  {previewPhotos[2] && (
                    <PhotoImage src={previewPhotos[2].file_path} alt="" crossOrigin="anonymous" />
                  )}
                  {hiddenPhotoCount > 0 && (
                    <>
                      <PhotoOverlay />
                      <PhotoCount>+{hiddenPhotoCount}</PhotoCount>
                    </>
                  )}
                </Photo>
              </PhotoStack>

              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
              />

              <AddPhotoButton
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || photos.length >= MAX_PIN_PHOTOS}
                aria-label={
                  photos.length >= MAX_PIN_PHOTOS
                    ? '사진을 최대 50장까지 추가했습니다'
                    : '주변 사진 추가'
                }
              >
                <img src={photoAddIcon} alt="" />
              </AddPhotoButton>
            </PhotoGrid>

            {isUploading && <PhotoUploadStatus progress={uploadProgress} />}
            {addMessage && <AddMessage role="status">{addMessage}</AddMessage>}
            {photos.length >= MAX_PIN_PHOTOS && !addMessage && (
              <AddMessage role="status">
                한 핀에는 사진을 최대 {MAX_PIN_PHOTOS}장까지 추가할 수 있어요.
              </AddMessage>
            )}
          </PhotosSection>

          <SuggestedSection>
            <SuggestedHeading>
              <EditorialTitle>SUGGESTED</EditorialTitle>
              <HeadingLine />
              <RefreshButton
                type="button"
                onClick={handleRefreshSuggested}
                disabled={isRefreshing || photos.length < 4}
              >
                <img src={refreshIcon} alt="" />
                {isRefreshing ? '고르는 중...' : '재추천'}
              </RefreshButton>
            </SuggestedHeading>
            <SuggestedDescription>
              AI가 취향 프로파일을 기준으로 상위 사진 중 3장을 골랐어요
            </SuggestedDescription>
            {photos.length < 4 && !refreshError && (
              <RefreshHint>
                대표사진 새로고침은 사진이 4장 이상일 때만 가능합니다.
              </RefreshHint>
            )}
            {refreshError && <RefreshError role="alert">{refreshError}</RefreshError>}

            <SuggestedGrid>
              {representativePhotos.map((photo, index) => (
                <SuggestedPhoto
                  key={photo.photo_id}
                  type="button"
                  aria-label={`추천 사진 ${index + 1} 크게 보기`}
                  onClick={() => setSuggestedIndex(index)}
                  $tone={['soft', 'warm', 'main'][index] ?? 'main'}
                >
                  <PhotoImage src={photo.url} alt="" crossOrigin="anonymous" />
                </SuggestedPhoto>
              ))}
            </SuggestedGrid>
          </SuggestedSection>

          {isDeletable && (
            <DeleteSection>
              {deleteError && (
                <DeleteError role="alert">{deleteError}</DeleteError>
              )}

              <DeleteTrigger
                type="button"
                $variant="ghost"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isDeleting}
              >
                핀 삭제하기
              </DeleteTrigger>
            </DeleteSection>
          )}
        </DetailContent>
      </DetailSheet>

      <ConfirmationModal
        open={isDeletable && isConfirmingDelete}
        title="이 핀을 삭제할까요?"
        confirmLabel={isDeleting ? '핀 삭제 중...' : '핀 삭제하기'}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsConfirmingDelete(false)}
        confirmDisabled={isDeleting}
        cancelDisabled={isDeleting}
        ariaDescribedBy="pin-delete-warning"
      >
        <PinDeleteModalContent>
          <PinDeleteTargetCard>
            <PinDeleteTargetName>{title}</PinDeleteTargetName>
            <PinDeleteTargetMeta>
              {formatDeleteMeta(pin, photos.length)}
            </PinDeleteTargetMeta>
          </PinDeleteTargetCard>
          <PinDeleteWarning id="pin-delete-warning">
            <PinDeleteWarningIcon
              src={deleteWarningIcon}
              alt=""
              aria-hidden="true"
            />
            핀에 담긴 사진, 음성 메모가 모두 함께 삭제돼요. 되돌릴 수 없습니다.
          </PinDeleteWarning>
        </PinDeleteModalContent>
      </ConfirmationModal>

      {suggestedIndex >= 0 && (
        <PhotoPreviewOverlay
          photos={representativePhotos.map((photo) => ({
            id: photo.photo_id,
            url: photo.url,
          }))}
          index={suggestedIndex}
          onIndexChange={setSuggestedIndex}
          onClose={() => setSuggestedIndex(-1)}
        />
      )}
    </Page>
  )
}

export default PinDetail

const Page = styled.main`
  position: relative;
  width: 100%;
  max-width: 450px;
  height: var(--app-viewport-height);
  margin: 0 auto;
  overflow: hidden;
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

const DeleteTrigger = styled(Button)`
  width: 100%;
  height: 52px;
  flex: none;
  font: var(--text-ui-button);

  &:disabled {
    cursor: not-allowed;
  }
`

const PinDeleteModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const PinDeleteTargetCard = styled.div`
  height: 74px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--Background-Base);
`

const PinDeleteTargetName = styled.p`
  overflow: hidden;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PinDeleteTargetMeta = styled.p`
  overflow: hidden;
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PinDeleteWarning = styled.p`
  min-height: 66px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 12px;
  background: rgb(181 118 59 / 10%);
  color: var(--Primary-Cognac);
  font: 400 11px/18px var(--font-sans);
  word-break: keep-all;
`

const PinDeleteWarningIcon = styled.img`
  width: 18px;
  height: 17px;
  flex: 0 0 18px;
  display: block;
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
  position: absolute;
  inset: 0;
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

/* 시트를 끄는 동안 자리가 프레임마다 바뀐다. 그 값을 CSS 에 넣으면
   styled-components 가 프레임마다 클래스를 새로 만든다. 바뀌는 두 값만
   인라인 스타일로 빼서 클래스는 하나로 둔다. */
const JourneyChip = styled.span.attrs(({ $sheetHeight, $sheetOffset }) => ({
  style: {
    bottom: `${$sheetHeight + 28}px`,
    transform: `translateY(${$sheetOffset}px)`,
  },
}))`
  position: absolute;
  z-index: 3;
  left: 20px;
  max-width: calc(100% - 40px);
  padding: 7px 12px;
  overflow: hidden;
  border-radius: 14px;
  background: rgb(42 37 34 / 60%);
  box-shadow: var(--Effect-Chip);
  color: var(--Text-Inverse);
  font: var(--text-ui-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const DetailSheet = styled(SnapSheet)`
  z-index: 2;
  border-radius: 30px 30px 0 0;
  background: var(--Background-Base);
`

/* 스크롤은 시트가 맡는다(`expandOnScroll`). 여기서는 여백과 배치만 잡는다. */
const DetailContent = styled.div`
  min-height: 100%;
  padding: 30px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 38px;
  overflow-x: hidden;
`

/* PHOTOS·SUGGESTED 와 같이 본문 폭을 꽉 채운다. 여기만 354 로 묶어두면
   화면이 402 보다 넓을 때 수정 버튼이 오른쪽 여백만큼 안쪽으로 밀린다. */
const PinIntro = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 22px;
`

const HeadingGroup = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

/* 홈의 여정 이름과 같은 방식이다. 아이콘 아래끝을 제목 글자 아래끝에 맞춰
   바로 옆에 붙인다. */
const TitleRow = styled.div`
  /* 제목이 길어 버튼이 오른쪽으로 밀릴 때, 아래 기록 수정 버튼과 같은 자리에서
     멈추도록 그 버튼의 오른쪽 여백(12)만큼 남긴다. */
  max-width: calc(100% - 12px);
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
`

const PinTitle = styled.h1`
  min-width: 0;
  /* 늘어나지 않고 글에 맞춘다. 늘어나면 수정 버튼이 줄 끝으로 밀린다.
     긴 제목은 여전히 줄어들며 말줄임으로 넘어간다. */
  flex: 0 1 auto;
  overflow: hidden;
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PinMeta = styled.p`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 7px;
  row-gap: 2px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  line-height: 1.5;
`

const PinMetaAddress = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: keep-all;
`

const PinMetaDivider = styled.span`
  flex: 0 0 auto;
`

const PinMetaTime = styled.span`
  flex: 0 0 auto;
  max-width: 100%;
  white-space: nowrap;
`

/* 2(줄) + 16 + 본문 + 2 + 17(수정). 수정 버튼은 오른쪽 끝에 붙고 본문이 남는 폭을 쓴다.
   gap 을 쓰면 본문과 수정 버튼 사이에도 16 이 끼어 본문이 좁아진다. */
const Memo = styled.div`
  display: flex;
  align-items: stretch;
`

/* Memo 가 align-items: stretch 라 본문 높이를 그대로 따라간다.
   기록 줄 수와 음성 메모 유무에 따라 길이가 달라진다. */
const MemoRule = styled.div`
  width: 2px;
  flex: 0 0 auto;
  background: var(--Accent-Gold);
`

const MemoBody = styled.div`
  min-width: 0;
  flex: 1;
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const MemoText = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-body-m);
  white-space: pre-line;
`

/* 기록이 없을 때 자리를 지키는 문구. 실제 기록과 구분되게 흐린 색을 쓴다. */
const MemoEmpty = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
`

/* 기록 길이와 상관없이 메모 블록 오른쪽 위에 고정된다(시안 기준 위에서 5). */
const EditNoteButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  align-self: flex-start;
  width: 17px;
  height: 16px;
  margin: 5px 12px 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;

  img {
    width: 18.5px;
    height: 17.5px;
    display: block;
  }

  /* 아이콘이 작아 탭 영역만 넓힌다. 자리는 그대로다. */
  &::after {
    content: '';
    position: absolute;
    inset: -10px;
  }
`

/* 기록 수정 버튼과 같은 그림이다. 제목 옆에 서므로 여백만 다르게 준다. */
const EditNameButton = styled(EditNoteButton)`
  align-self: baseline;
  margin: 0;
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

/* 한 줄이라 textarea 대신 input 이다. 생김새는 텍스트 기록과 같게 둔다. */
const NameInput = styled.input`
  width: 100%;
  border: 1px solid var(--Border-Default);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--Text-Primary);
  background: var(--Surface-Base);
  font: var(--text-ui-body-m);
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

const VoiceError = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: keep-all;
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
  position: relative;
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

const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`

/* 시안에서 그리드 오른쪽 아래 모서리에 걸쳐 있다. 원은 28 이지만 내려받은
   아이콘은 그림자 여백까지 38 이라, 원 위치를 기준으로 잡고 이미지를 밀어 넣는다. */
const AddPhotoButton = styled.button`
  position: absolute;
  right: -11px;
  bottom: -8px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;

  img {
    position: absolute;
    top: -3px;
    left: -5px;
    width: 38px;
    height: 38px;
    display: block;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`

const AddMessage = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const PhotoCapacity = styled.span`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
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

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`

const SuggestedDescription = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

const RefreshHint = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const RefreshError = styled.p`
  color: var(--Status-Error, #b3261e);
  font: var(--text-ui-caption);
`

const SuggestedGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`

const SuggestedPhoto = styled.button`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  background: ${({ $tone }) => toneBackgrounds[$tone]};
  cursor: pointer;
`

