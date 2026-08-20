import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { uploadAudio } from '../../api/uploads'
import Button from '../../components/common/Button'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import PhotoUploadStatus from '../../components/common/PhotoUploadStatus'
import { createPin, deletePin } from '../../features/pins/pinApi'
import PhotoPreviewOverlay, {
  PreviewDeleteButton,
} from '../../components/common/PhotoPreviewOverlay'
import {
  attachUploadedPhotos,
  orderUploadedPhotos,
  uploadCapturedPhotos,
} from '../../features/pins/recordPhotos'
import { reverseGeocode } from '../../features/pins/reverseGeocode'
import {
  MAX_PIN_PHOTOS,
  getRemainingPhotoCapacity,
} from '../../features/pins/photoUploadQueue'
import useVoiceRecorder, {
  formatVoiceDuration,
} from '../../features/pins/useVoiceRecorder'
import backIcon from '../../assets/icons/trip-edit-back.svg'
import closeIcon from '../../assets/pin-save/close.svg'
import photoAddIcon from '../../assets/pin-save/manual-pin-photo-add.svg'
import locationIcon from '../../assets/pin-save/location.svg'
import microphoneIcon from '../../assets/pin-save/microphone.svg'
import pencilIcon from '../../assets/pin-save/pencil.svg'
import recordingDotIcon from '../../assets/pin-save/recording-dot.svg'

const WAVEFORM_HEIGHTS = [
  6, 11, 18, 9, 24, 14, 7, 20, 30, 13, 6, 16, 26, 10, 15, 7, 14, 22,
  9, 18, 12, 7, 16, 28, 11, 17, 8, 20, 13, 6, 15, 25, 9, 12, 19, 8,
  22, 10, 14, 7, 17, 11, 6, 13, 9, 5, 8, 6, 4, 5, 3, 4, 3, 2, 3, 2,
]

const FALLBACK_LOCATION = { latitude: 37.5796, longitude: 126.9849 }

const formatCurrentDate = () => {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')

  return {
    date: `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`,
    time: new Intl.DateTimeFormat('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now),
  }
}

const ManualPinDetails = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const latitude = Number.isFinite(location.state?.latitude)
    ? location.state.latitude
    : FALLBACK_LOCATION.latitude
  const longitude = Number.isFinite(location.state?.longitude)
    ? location.state.longitude
    : FALLBACK_LOCATION.longitude
  const address = location.state?.address ?? ''
  /** 위치 선택 화면에서 이미 받아 온 주소·도시·나라. 없으면 여기서 다시 묻는다. */
  const passedPlace = location.state?.place ?? null
  const savedAt = useRef(formatCurrentDate()).current

  const [placeName, setPlaceName] = useState('')
  const [memo, setMemo] = useState('')
  const [photos, setPhotos] = useState([])
  /** 크게 보고 있는 사진의 자리. 없으면 -1 */
  const [previewIndex, setPreviewIndex] = useState(-1)
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  /** 일부만 올라갔을 때 물어보려고 들고 있는 `{ total, uploaded }`. */
  const [partialUpload, setPartialUpload] = useState(null)
  const [registrationResult, setRegistrationResult] = useState(null)
  const [photoMessage, setPhotoMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(null)
  const [resolvedPlace, setResolvedPlace] = useState(null)
  const locationRequestRef = useRef(null)
  const photoInputRef = useRef(null)
  const photosRef = useRef([])
  const createdPinIdRef = useRef(null)
  const uploadedPhotosRef = useRef({})
  const hasAllowedPartialSaveRef = useRef(false)
  const uploadedAudioRef = useRef(null)
  const {
    status: voiceStatus,
    durationSec: voiceDurationSec,
    audioFile: voiceFile,
    audioUrl: voiceUrl,
    errorMessage: voiceError,
    startRecording,
    stopRecording,
    deleteRecording,
  } = useVoiceRecorder()

  /**
   * 지도에서 고른 좌표를 도시·나라로 바꾼다. 화면당 한 번만 요청한다.
   * 저장 버튼이 먼저 눌려도 handleSave 가 같은 요청을 기다린다.
   */
  const resolveLocationDetails = useCallback(() => {
    if (passedPlace) return Promise.resolve(passedPlace)

    locationRequestRef.current ??= reverseGeocode({ latitude, longitude })

    return locationRequestRef.current
  }, [latitude, longitude, passedPlace])

  // 화면에 들어오면 바로 받아 온다. 검색어를 안 넣었어도 주소가 보인다.
  useEffect(() => {
    let ignore = false

    void resolveLocationDetails().then((place) => {
      if (!ignore) setResolvedPlace(place)
    })

    return () => {
      ignore = true
    }
  }, [resolveLocationDetails])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url))
    },
    [],
  )

  useEffect(() => {
    if (!isVoiceSheetOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      if (voiceStatus === 'recording' || voiceStatus === 'requesting') {
        stopRecording()
      }
      setIsVoiceSheetOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isVoiceSheetOpen, stopRecording, voiceStatus])

  const handlePhotoSelection = (event) => {
    const imageFiles = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith('image/'),
    )
    const remainingCapacity = getRemainingPhotoCapacity(photos.length)
    const acceptedFiles = imageFiles.slice(0, remainingCapacity)
    const overflowCount = imageFiles.length - acceptedFiles.length
    const selectedPhotos = acceptedFiles
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${
          crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        }`,
        file,
        url: URL.createObjectURL(file),
        capturedAt: new Date(file.lastModified || Date.now()).toISOString(),
      }))

    if (selectedPhotos.length > 0) {
      setPhotos((current) => [...current, ...selectedPhotos])
      // 새로 고른 사진은 아직 물어본 적이 없으니 다시 묻는다.
      hasAllowedPartialSaveRef.current = false
    }

    setPhotoMessage(
      overflowCount > 0
        ? `최대 ${MAX_PIN_PHOTOS}장까지 추가할 수 있어 ${acceptedFiles.length}장만 추가했어요.`
        : '',
    )

    event.target.value = ''
  }

  /* 지운 자리의 다음 사진으로 넘어가고, 마지막 한 장이었으면 크게 보기를 닫는다. */
  const handleRemovePhoto = () => {
    const removed = photos[previewIndex]
    if (!removed) return

    URL.revokeObjectURL(removed.url)

    const remaining = photos.filter((photo) => photo.id !== removed.id)

    setPhotos(remaining)
    hasAllowedPartialSaveRef.current = false
    setPhotoMessage('')
    setPreviewIndex(previewIndex < remaining.length ? previewIndex : -1)
  }

  const handleOpenVoiceMemo = () => {
    setIsVoiceSheetOpen(true)
    if (voiceStatus === 'idle' || voiceStatus === 'error') {
      void startRecording()
    }
  }

  const handleCloseVoiceMemo = () => {
    if (voiceStatus === 'recording' || voiceStatus === 'requesting') {
      stopRecording()
    }
    setIsVoiceSheetOpen(false)
  }

  const handleRecordAgain = () => {
    uploadedAudioRef.current = null
    deleteRecording()
    void startRecording()
  }

  const handleDeleteRecording = () => {
    uploadedAudioRef.current = null
    deleteRecording()
    setIsVoiceSheetOpen(false)
  }

  const handleSave = async () => {
    // 일반 촬영 저장과 마찬가지로 사진이 없으면 핀을 만들지 않는다.
    // 이후 업로드·등록 단계가 건너뛰어져 빈 핀이 남는 것을 막는다.
    if (photos.length === 0 || isSaving) return

    setIsSaving(true)
    setSaveError('')
    setUploadProgress(null)

    try {
      if (
        voiceFile &&
        uploadedAudioRef.current?.sourceFile !== voiceFile
      ) {
        uploadedAudioRef.current = {
          sourceFile: voiceFile,
          url: await uploadAudio(voiceFile),
        }
      }

      /* 사진을 핀보다 먼저 올린다. 여기서 실패하면 핀은 아직 만들지 않은
         상태라, 사진 없는 핀이 남지 않는다. */
      /* 빠진 사진을 두고 저장하기로 했으면 다시 올리지 않는다. */
      if (photos.length > 0 && !hasAllowedPartialSaveRef.current) {
        uploadedPhotosRef.current = await uploadCapturedPhotos(
          photos,
          { latitude, longitude, onProgress: setUploadProgress },
          uploadedPhotosRef.current,
        )
      }

      const uploadedPhotos = orderUploadedPhotos(
        photos,
        uploadedPhotosRef.current,
      )

      if (photos.length > 0 && uploadedPhotos.length === 0) {
        throw new Error('사진을 올리지 못했습니다. 잠시 후 다시 시도해주세요.')
      }

      /* 일부만 올라갔으면 이대로 저장할지 먼저 묻는다. 못 올린 사진은 핀에
         들어가지 않으므로, 모르고 넘어가면 빠진 줄도 모른다. */
      if (
        uploadedPhotos.length < photos.length &&
        !hasAllowedPartialSaveRef.current
      ) {
        setPartialUpload({
          total: photos.length,
          uploaded: uploadedPhotos.length,
        })
        return
      }

      if (!createdPinIdRef.current) {
        // 아직 안 끝났으면 기다린다. 도시가 비면 방문 도시와 도장이 빠진다.
        const place = await resolveLocationDetails()

        const createdPin = await createPin({
          latitude,
          longitude,
          // 검색창에 직접 적은 주소가 있으면 그쪽을 우선한다.
          address: address || (place?.address ?? ''),
          city: place?.city ?? '',
          countryCode: place?.countryCode ?? '',
          countryName: place?.countryName ?? '',
          placeName,
          textNote: memo,
          audioFile: uploadedAudioRef.current?.url,
          voiceDurationSec,
        })

        createdPinIdRef.current = createdPin.pin_id
      }

      if (uploadedPhotos.length > 0) {
        /* 한 장도 붙지 않았으면 사진 없는 핀이라 지운다. 한 장이라도 붙었으면
           그대로 둔다. 올려 둔 파일은 그대로라, 다시 시도하면 핀만 새로 만든다. */
        try {
          const photoResult = await attachUploadedPhotos(
            createdPinIdRef.current,
            uploadedPhotos,
            { onProgress: setUploadProgress },
          )

          if ((photoResult.added?.length ?? 0) === 0) {
            throw new Error('사진을 핀에 등록하지 못했습니다.')
          }

          if (photoResult.added.length < uploadedPhotos.length) {
            setRegistrationResult({
              total: photos.length,
              added: photoResult.added.length,
            })
            return
          }
        } catch (error) {
          // 지우는 것까지 실패해도 알릴 것은 원래 오류다.
          await deletePin(createdPinIdRef.current).catch(() => {})
          createdPinIdRef.current = null
          throw error
        }
      }

      navigate('/map', { replace: true })
    } catch (error) {
      setSaveError(
        error.message ?? '핀을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
      )
    } finally {
      setIsSaving(false)
      setUploadProgress(null)
    }
  }

  /** 못 올린 사진을 포기하고 올라간 것만으로 핀을 만든다. */
  const handleSaveWithoutMissingPhotos = () => {
    hasAllowedPartialSaveRef.current = true
    setPartialUpload(null)
    void handleSave()
  }

  /** 못 올린 사진만 다시 올린다. 이미 올린 사진은 그대로 쓴다. */
  const handleRetryMissingPhotos = () => {
    setPartialUpload(null)
    void handleSave()
  }

  const handleViewPartiallySavedPin = () => {
    const pinId = createdPinIdRef.current
    setRegistrationResult(null)
    navigate(pinId ? `/map/pin/${pinId}` : '/map', { replace: true })
  }

  return (
    <Page>

      <Header>
        <BackButton
          type="button"
          aria-label="핀 위치 선택으로 돌아가기"
          onClick={() => navigate('/map/pin/new')}
        >
          <img src={backIcon} alt="" aria-hidden="true" />
        </BackButton>
        <HeaderTitle>핀 추가</HeaderTitle>
      </Header>

      <Content>
        <MemoryIntro>
          <TitleRow>
            <PromptIcon src={pencilIcon} alt="" aria-hidden="true" />
            <PromptTitle>이전 기억을 남겨볼까요?</PromptTitle>
          </TitleRow>
          <PromptDescription>
            사진만으로는 남지 않는 순간을 짧게 기록해보세요.
          </PromptDescription>
        </MemoryIntro>

        <ChosenLocation>
          <LocationCopy>
            <ChosenName>
              {address || resolvedPlace?.address || '지도에서 선택한 위치'}
            </ChosenName>
            <ChosenAddress>
              위도 {latitude.toFixed(5)} · 경도 {longitude.toFixed(5)}
            </ChosenAddress>
          </LocationCopy>
          <ChangeLocationButton
            type="button"
            onClick={() => navigate('/map/pin/new')}
          >
            변경
          </ChangeLocationButton>
        </ChosenLocation>

        <AddressField>
          <AddressIcon src={locationIcon} alt="" aria-hidden="true" />
          <AddressInput
            type="text"
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder="장소 상세 이름을 입력해주세요"
            aria-label="장소 상세 이름"
          />
        </AddressField>

        <DateFields>
          <FieldGroup>
            <FieldLabel>날짜</FieldLabel>
            <DateValue>{savedAt.date}</DateValue>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>시각</FieldLabel>
            <DateValue>{savedAt.time}</DateValue>
          </FieldGroup>
        </DateFields>

        <PhotoSection>
          <PhotoLabelRow>
            <FieldLabel>사진</FieldLabel>
            <PhotoCapacity>
              {photos.length}/{MAX_PIN_PHOTOS} ·{' '}
              {getRemainingPhotoCapacity(photos.length)}장 더 추가할 수 있어요
            </PhotoCapacity>
          </PhotoLabelRow>
          <HiddenPhotoInput
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelection}
          />
          {photos.length > 0 ? (
            <PhotoViewport>
              <PhotoStrip aria-label="추가된 사진">
                {photos.map((photo, index) => (
                  <PhotoTile
                    key={photo.id}
                    type="button"
                    aria-label={`추가된 사진 ${index + 1} 크게 보기`}
                    onClick={() => setPreviewIndex(index)}
                  >
                    <PhotoPreview
                      src={photo.url}
                      alt={`추가된 사진 ${index + 1}`}
                    />
                  </PhotoTile>
                ))}
                <AddMorePhotoButton
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photos.length >= MAX_PIN_PHOTOS || isSaving}
                >
                  <AddPhotoIcon src={photoAddIcon} alt="" aria-hidden="true" />
                  더 추가
                </AddMorePhotoButton>
              </PhotoStrip>
            </PhotoViewport>
          ) : (
            <AddPhotoButton
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isSaving}
            >
              <AddPhotoIcon src={photoAddIcon} alt="" aria-hidden="true" />
              <span>사진 추가</span>
            </AddPhotoButton>
          )}
          {photoMessage && <PhotoMessage role="status">{photoMessage}</PhotoMessage>}
          {isSaving && <PhotoUploadStatus progress={uploadProgress} />}
        </PhotoSection>

        <NoteField>
          <MemoInput
            value={memo}
            maxLength={300}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="이 장소에서 기억하고 싶은 걸 적어주세요"
            aria-label="장소에 대한 메모"
          />
          <NoteActions>
            <VoiceMemoButton
              type="button"
              $variant="ghost"
              onClick={handleOpenVoiceMemo}
              disabled={isSaving || Boolean(createdPinIdRef.current)}
            >
              <VoiceIcon src={microphoneIcon} alt="" aria-hidden="true" />
              {voiceFile ? '음성 메모 확인' : '음성 메모 추가'}
            </VoiceMemoButton>
            <CharacterCount>{memo.length} / 300</CharacterCount>
          </NoteActions>
        </NoteField>
      </Content>

      <AddPinButton
        type="button"
        onClick={handleSave}
        disabled={isSaving || photos.length === 0}
      >
        {isSaving ? '저장 중...' : '핀 추가하기'}
      </AddPinButton>
      {saveError && <SaveError role="alert">{saveError}</SaveError>}

      <ConfirmationModal
        open={Boolean(partialUpload)}
        title="일부 사진을 올리지 못했어요"
        confirmLabel="이대로 저장하기"
        cancelLabel="다시 시도"
        closeOnBackdrop={false}
        onConfirm={handleSaveWithoutMissingPhotos}
        onCancel={handleRetryMissingPhotos}
      >
        <PartialUploadNotice>
          {partialUpload &&
            `${partialUpload.total}장 중 ${partialUpload.uploaded}장이 올라갔어요. 이대로 저장하면 나머지 ${
              partialUpload.total - partialUpload.uploaded
            }장은 핀에 들어가지 않습니다.`}
        </PartialUploadNotice>
      </ConfirmationModal>

      <ConfirmationModal
        open={Boolean(registrationResult)}
        title="일부 사진만 저장됐어요"
        confirmLabel="지도로 이동"
        cancelLabel="핀에서 확인"
        closeOnBackdrop={false}
        onConfirm={() => {
          setRegistrationResult(null)
          navigate('/map', { replace: true })
        }}
        onCancel={handleViewPartiallySavedPin}
      >
        <PartialUploadNotice>
          {registrationResult &&
            `${registrationResult.total}장 중 ${registrationResult.added}장이 핀에 저장됐어요. 나머지 ${
              registrationResult.total - registrationResult.added
            }장은 저장하지 못했습니다.`}
        </PartialUploadNotice>
      </ConfirmationModal>

      {isVoiceSheetOpen && (
        <ModalLayer>
          <Scrim
            type="button"
            aria-label="음성 메모 닫기"
            onClick={handleCloseVoiceMemo}
          />
          <VoiceSheet
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-voice-sheet-title"
          >
            <SheetHandle aria-hidden="true" />
            <SheetTitle id="manual-voice-sheet-title">음성 메모</SheetTitle>
            <CloseButton
              type="button"
              aria-label="음성 메모 닫기"
              onClick={handleCloseVoiceMemo}
            >
              <CloseIcon src={closeIcon} alt="" aria-hidden="true" />
            </CloseButton>

            <RecordingState>
              {voiceStatus === 'recording' && (
                <RecordingDot src={recordingDotIcon} alt="" aria-hidden="true" />
              )}
              {voiceStatus === 'requesting' && '마이크 권한 확인 중'}
              {voiceStatus === 'recording' && '녹음 중'}
              {voiceStatus === 'recorded' && '녹음 완료'}
              {voiceStatus === 'error' && '녹음 오류'}
            </RecordingState>

            <Waveform aria-hidden="true">
              {WAVEFORM_HEIGHTS.map((height, index) => (
                <WaveformBar
                  key={`${height}-${index}`}
                  $height={height}
                  $active={
                    voiceStatus === 'recording' ||
                    (voiceStatus === 'recorded' && index < 38)
                  }
                />
              ))}
            </Waveform>

            <RecordingTime>
              {formatVoiceDuration(voiceDurationSec)}
            </RecordingTime>
            {voiceUrl && (
              <VoicePlayback controls src={voiceUrl} aria-label="녹음 미리 듣기" />
            )}
            {voiceError && <VoiceError role="alert">{voiceError}</VoiceError>}
            <RecordAgainButton
              type="button"
              onClick={handleRecordAgain}
              disabled={
                voiceStatus === 'requesting' || voiceStatus === 'recording'
              }
            >
              다시녹음
            </RecordAgainButton>
            {voiceStatus === 'recording' ? (
              <StopButton
                type="button"
                aria-label="녹음 중지"
                onClick={stopRecording}
              >
                <StopIcon aria-hidden="true" />
              </StopButton>
            ) : (
              <ConfirmRecordingButton
                type="button"
                onClick={handleCloseVoiceMemo}
                disabled={voiceStatus === 'requesting'}
              >
                완료
              </ConfirmRecordingButton>
            )}
            <DeleteRecordingButton
              type="button"
              onClick={handleDeleteRecording}
            >
              삭제
            </DeleteRecordingButton>
          </VoiceSheet>
        </ModalLayer>
      )}
      {previewIndex >= 0 && (
        <PhotoPreviewOverlay
          photos={photos}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(-1)}
        >
          <PreviewDeleteButton onClick={handleRemovePhoto} />
        </PhotoPreviewOverlay>
      )}
    </Page>
  )
}

export default ManualPinDetails

/* 시안은 상태바 자리(58)까지 포함해 874 로 그렸는데, 브라우저가 이미 그
   자리를 비켜 그린다. 그대로 두면 헤더 위에 빈 자리가 한 번 더 남는다.
   아래 자리값들은 모두 시안에서 58 을 뺀 값이다. */
const Page = styled.main`
  position: relative;
  width: min(100%, 402px);
  min-height: max(816px, var(--app-viewport-height));
  margin: 0 auto;
  overflow: hidden;
  background: var(--Background-Base);
  color: var(--Text-Primary);
`

const Header = styled.header`
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  left: 0;
  height: 50px;
  border-bottom: 1px solid #d0d0d0;
`

const BackButton = styled.button`
  position: absolute;
  top: 0;
  left: 24px;
  width: 32px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 20px;
    height: 14px;
    display: block;
  }
`

const HeaderTitle = styled.h1`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f2937;
  font: var(--text-ui-h3);
`

const Content = styled.div`
  position: absolute;
  z-index: 1;
  top: 78px;
  left: 24px;
  width: calc(100% - 48px);
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const MemoryIntro = styled.section`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
`

const PromptIcon = styled.img`
  width: 19px;
  height: 18px;
  display: block;
`

const PromptTitle = styled.h2`
  font: var(--text-ui-h3);
`

const PromptDescription = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const ChosenLocation = styled.section`
  height: 66px;
  padding: 13px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  border-radius: 14px;
  background: rgb(181 118 59 / 10%);
`

const LocationCopy = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
`

const ChosenName = styled.p`
  overflow: hidden;
  font: var(--text-ui-label);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ChosenAddress = styled.p`
  overflow: hidden;
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ChangeLocationButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  cursor: pointer;
`

const AddressField = styled.label`
  height: 49px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  border: 1px solid var(--Border-Default);
  border-radius: 14px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);

  &:focus-within {
    border-color: var(--Primary-Cognac);
  }
`

const AddressIcon = styled.img`
  width: 18px;
  height: 20px;
  flex: 0 0 auto;
  display: block;
`

const AddressInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--Text-Primary);
  font: var(--text-ui-body-m);

  &::placeholder {
    color: var(--State-Disabled-Text);
    opacity: 1;
  }
`

const DateFields = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`

const FieldGroup = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const FieldLabel = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const DateValue = styled.div`
  width: 100%;
  height: 45px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 12px;
  background: var(--Surface-Base);
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  text-align: left;
`

const PhotoSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const PhotoLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const PhotoCapacity = styled.span`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const PhotoMessage = styled.p`
  margin: 0;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const AddPhotoButton = styled.button`
  width: 100%;
  height: 124px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1.4px dashed var(--Border-Strong);
  border-radius: 12px;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-nav);
  cursor: pointer;
`

const HiddenPhotoInput = styled.input`
  display: none;
`

const AddPhotoIcon = styled.img`
  width: 20px;
  height: 20px;
  display: block;
`

/* 넘치는 사진을 가로로 넘겨 본다. 촬영 화면의 썸네일 줄과 같은 방식이다.
   본문 여백(24)을 음수 마진으로 상쇄해 넘기는 동안 화면 끝까지 흘러간다. */
const PhotoViewport = styled.div`
  width: calc(100vw - 24px);
  max-width: 378px;
  margin: 0 -24px;
  padding: 0 24px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  touch-action: pan-x;

  &::-webkit-scrollbar {
    display: none;
  }
`

const PhotoStrip = styled.div`
  width: max-content;
  display: flex;
  gap: 10px;
`

const PhotoTile = styled.button`
  width: 111.333px;
  height: 124px;
  flex: 0 0 111.333px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  background: var(--Map-Land);
  cursor: pointer;
`

const PhotoPreview = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const AddMorePhotoButton = styled(AddPhotoButton)`
  width: 111.333px;
  flex: 0 0 111.333px;
`

const NoteField = styled.section`
  position: relative;
  height: 160px;
  overflow: hidden;
  border: 1px solid var(--Border-Default);
  border-radius: 16px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);

  &:focus-within {
    border-color: var(--Primary-Cognac);
  }
`

const MemoInput = styled.textarea`
  width: 100%;
  height: 100%;
  padding: 16px 17px 50px;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--Text-Primary);
  font: var(--text-ui-body-m);

  &::placeholder {
    color: var(--State-Disabled-Text);
    opacity: 1;
  }
`

const NoteActions = styled.div`
  position: absolute;
  right: 17px;
  bottom: 17px;
  left: 17px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
`

const VoiceMemoButton = styled(Button)`
  width: auto;
  height: 20px;
  padding: 0;
  gap: 8px;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  pointer-events: auto;
`

const VoiceIcon = styled.img`
  width: 16px;
  height: 20px;
  display: block;
`

const CharacterCount = styled.span`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const AddPinButton = styled(Button)`
  position: absolute;
  z-index: 2;
  top: 708px;
  right: 24px;
  left: 24px;
  width: auto;
  height: 54px;
  color: var(--Text-Inverse);
  background: var(--Primary-Cognac);
  font: var(--text-ui-button);
`

const SaveError = styled.p`
  position: absolute;
  z-index: 3;
  top: 769px;
  right: 24px;
  left: 24px;
  color: #b42318;
  font: var(--text-ui-caption);
  text-align: center;
`

const PartialUploadNotice = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
`

/* 시트는 화면 아래에 붙는 것이라 가장자리까지 닿아야 한다. 본문과 같은
   402 로 묶으면 그보다 넓은 기기에서 좌우가 뜬다. 앱 공통 상한을 쓴다. */
const ModalLayer = styled.div`
  position: fixed;
  z-index: 50;
  inset: 0 auto 0 50%;
  width: min(100%, 450px);
  transform: translateX(-50%);
`

const Scrim = styled.button`
  position: absolute;
  inset: 0;
  width: 100%;
  padding: 0;
  border: 0;
  background: rgb(42 37 34 / 45%);
  cursor: default;
`

const VoiceSheet = styled.section`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 320px;
  overflow: hidden;
  border-radius: 30px 30px 0 0;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Bottom-Sheet);
`

const SheetHandle = styled.span`
  position: absolute;
  top: 10px;
  left: 50%;
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: rgb(181 161 140 / 50%);
  transform: translateX(-50%);
`

const SheetTitle = styled.h2`
  position: absolute;
  top: 31px;
  left: 28px;
  font: var(--text-ui-h3);
`

const CloseButton = styled.button`
  position: absolute;
  top: 31px;
  right: 25px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
`

const CloseIcon = styled.img`
  width: 16px;
  height: 16px;
  display: block;
`

const RecordingState = styled.div`
  position: absolute;
  top: 61px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  transform: translateX(-50%);
`

const RecordingDot = styled.img`
  width: 8px;
  height: 8px;
  display: block;
`

const Waveform = styled.div`
  position: absolute;
  top: 83px;
  right: 42px;
  left: 42px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 2.7px;
  overflow: hidden;
`

const WaveformBar = styled.span`
  width: 3px;
  height: ${({ $height }) => `${$height}px`};
  flex: 0 0 3px;
  border-radius: 1.5px;
  background: ${({ $active }) =>
    $active ? 'var(--Primary-Cognac)' : 'rgb(181 161 140 / 35%)'};
`

const RecordingTime = styled.p`
  position: absolute;
  top: 147px;
  left: 50%;
  font: var(--text-ui-h1);
  letter-spacing: -0.26px;
  transform: translateX(-50%);
`

const SheetTextButton = styled.button`
  position: absolute;
  top: 257px;
  padding: 0;
  border: 0;
  background: transparent;
  font: var(--text-ui-button);
  cursor: pointer;
`

const RecordAgainButton = styled(SheetTextButton)`
  left: 50px;
  color: var(--Text-Secondary);
`

const StopButton = styled.button`
  position: absolute;
  top: 232px;
  left: 50%;
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--Primary-Cognac);
  transform: translateX(-50%);
  cursor: pointer;
`

const StopIcon = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--Text-Inverse);
`

const ConfirmRecordingButton = styled(StopButton)`
  color: var(--Text-Inverse);
  font: var(--text-ui-button);
`

const VoicePlayback = styled.audio`
  position: absolute;
  top: 184px;
  left: 50%;
  width: 220px;
  height: 32px;
  transform: translateX(-50%);
`

const VoiceError = styled.p`
  position: absolute;
  top: 184px;
  right: 36px;
  left: 36px;
  color: #b42318;
  font: var(--text-ui-caption);
  text-align: center;
`

const DeleteRecordingButton = styled(SheetTextButton)`
  right: 68px;
  color: var(--Primary-Cognac);
`
