import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { uploadAudio } from '../../api/uploads'
import Button from '../../components/common/Button'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import PhotoUploadStatus from '../../components/common/PhotoUploadStatus'
import { createPin, deletePin } from '../../features/pins/pinApi'
import {
  attachUploadedPhotos,
  orderUploadedPhotos,
  uploadCapturedPhotos,
} from '../../features/pins/recordPhotos'
import { reverseGeocode } from '../../features/pins/reverseGeocode'
import useRecordDraftStore from '../../features/pins/useRecordDraftStore'
import {
  MAX_PIN_PHOTOS,
  getRemainingPhotoCapacity,
} from '../../features/pins/photoUploadQueue'
import useSwipeNavigation from '../../hooks/useSwipeNavigation'
import useVoiceRecorder, {
  formatVoiceDuration,
} from '../../features/pins/useVoiceRecorder'
import stampCheckIcon from '../../assets/pin-save/stamp-check.svg'
import pencilIcon from '../../assets/pin-save/pencil.svg'
import microphoneIcon from '../../assets/pin-save/microphone.svg'
import locationIcon from '../../assets/pin-save/location.svg'
import closeIcon from '../../assets/pin-save/close.svg'
import recordingDotIcon from '../../assets/pin-save/recording-dot.svg'

const WAVEFORM_HEIGHTS = [
  6, 11, 18, 9, 24, 14, 7, 20, 30, 13, 6, 16, 26, 10, 15, 7, 14, 22,
  9, 18, 12, 7, 16, 28, 11, 17, 8, 20, 13, 6, 15, 25, 9, 12, 19, 8,
  22, 10, 14, 7, 17, 11, 6, 13, 9, 5, 8, 6, 4, 5, 3, 4, 3, 2, 3, 2,
]

const formatRecordTime = (capturedAt) => {
  const date = new Date(capturedAt)

  if (Number.isNaN(date.getTime())) return '촬영 시각 정보 없음'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/*
 * 위치 권한은 허용했지만 기기가 좌표를 못 잡은 경우에 쓰는 문구.
 *
 * 좌표가 없으면 사진도 붙일 수 없어(5.5 반경 검사) 핀만 덩그러니 남는다.
 * 그래서 만들기 전에 막고, 왜 안 되는지와 무엇을 하면 되는지 알려 준다.
 */
const NO_LOCATION_MESSAGE =
  '지금 위치를 확인하지 못해 저장할 수 없어요. 위치를 찾은 뒤 다시 시도해주세요.'

const LOCATE_FAILED_MESSAGE =
  '여전히 위치를 확인하지 못했어요. 실내라면 창가로 나가 잠시 후 다시 시도해주세요.'

const PinSaveComplete = () => {
  const navigate = useNavigate()
  const photos = useRecordDraftStore((draft) => draft.photos)
  const tagId = useRecordDraftStore((draft) => draft.tagId)
  const latitude = useRecordDraftStore((draft) => draft.latitude)
  const longitude = useRecordDraftStore((draft) => draft.longitude)
  const address = useRecordDraftStore((draft) => draft.address)
  const city = useRecordDraftStore((draft) => draft.city)
  const countryCode = useRecordDraftStore((draft) => draft.countryCode)
  const countryName = useRecordDraftStore((draft) => draft.countryName)
  const storedPlaceName = useRecordDraftStore((draft) => draft.placeName)
  const storedTextNote = useRecordDraftStore((draft) => draft.textNote)
  const storedVoiceMemoFile = useRecordDraftStore((draft) => draft.voiceMemoFile)
  const storedVoiceDurationSec = useRecordDraftStore(
    (draft) => draft.voiceDurationSec,
  )
  const setContext = useRecordDraftStore((draft) => draft.setContext)
  const setVoiceMemo = useRecordDraftStore((draft) => draft.setVoiceMemo)
  const setLocationDetails = useRecordDraftStore(
    (draft) => draft.setLocationDetails,
  )
  const setCoordinates = useRecordDraftStore((draft) => draft.setCoordinates)
  const clearDraft = useRecordDraftStore((draft) => draft.clearDraft)

  const [memo, setMemo] = useState(storedTextNote)
  const [placeName, setPlaceName] = useState(storedPlaceName)
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  const [saveError, setSaveError] = useState('')
  /** 일부만 올라갔을 때 물어보려고 들고 있는 `{ total, uploaded }`. */
  const [partialUpload, setPartialUpload] = useState(null)
  const [registrationResult, setRegistrationResult] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const createdPinIdRef = useRef(null)
  const uploadedPhotosRef = useRef({})
  const hasAllowedPartialSaveRef = useRef(false)
  const uploadedAudioRef = useRef(null)
  const locationRequestRef = useRef(null)
  const {
    status: voiceStatus,
    durationSec: voiceDurationSec,
    audioFile: voiceFile,
    audioUrl: voiceUrl,
    errorMessage: voiceError,
    startRecording,
    stopRecording,
    deleteRecording,
  } = useVoiceRecorder({
    initialAudioFile: storedVoiceMemoFile,
    initialDurationSec: storedVoiceDurationSec,
  })

  const {
    index: photoIndex,
    handlers: photoSwipe,
  } = useSwipeNavigation(photos.length)

  const hasLocation = latitude != null && longitude != null

  const record = {
    location:
      address ||
      (hasLocation
        ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : '위치를 확인하지 못했어요'),
    // 촬영 시각은 지금 보고 있는 사진 기준이다.
    time: formatRecordTime(photos[photoIndex]?.capturedAt),
    photoCount: photos.length,
  }

  /**
   * 좌표를 도시·나라로 바꾼다. 화면당 한 번만 요청하고 결과를 기록에 남긴다.
   *
   * 이미 값이 있으면(촬영을 이어서 하다가 돌아온 경우) 다시 부르지 않는다.
   * 저장 버튼이 먼저 눌려도 handleSave 가 같은 요청을 기다린다.
   */
  const resolveLocationDetails = useCallback(() => {
    if (city || latitude == null || longitude == null) return null

    locationRequestRef.current ??= reverseGeocode({ latitude, longitude })

    return locationRequestRef.current
  }, [city, latitude, longitude])

  // 저장 화면에 들어오면 바로 주소를 받아 온다. 좌표 대신 실제 주소가 보인다.
  useEffect(() => {
    const request = resolveLocationDetails()
    if (!request) return undefined

    let ignore = false

    void request.then((place) => {
      if (ignore || !place) return

      setLocationDetails({
        // 주소는 이미 있으면 그대로 둔다.
        address: address || place.address,
        city: place.city,
        countryCode: place.countryCode,
        countryName: place.countryName,
      })
    })

    return () => {
      ignore = true
    }
  }, [address, resolveLocationDetails, setLocationDetails])

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

  // 재촬영 화면을 거쳐도 음성 메모를 유지할 수 있도록 임시 기록에 함께 둔다.
  useEffect(() => {
    setVoiceMemo({ file: voiceFile, durationSec: voiceDurationSec })
  }, [setVoiceMemo, voiceDurationSec, voiceFile])

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

  const handleMemoChange = (event) => {
    const nextMemo = event.target.value
    setMemo(nextMemo)
    setContext({ placeName, textNote: nextMemo })
  }

  const handlePlaceNameChange = (event) => {
    const nextPlaceName = event.target.value
    setPlaceName(nextPlaceName)
    setContext({ placeName: nextPlaceName, textNote: memo })
  }

  const handleContinueCapture = () => {
    setContext({ placeName, textNote: memo })
    const tagQuery = tagId ? `?tagId=${encodeURIComponent(tagId)}` : ''
    navigate(`/record/multi-capture${tagQuery}`)
  }

  const handleRetryLocation = () => {
    if (isLocating || !navigator.geolocation) return

    setIsLocating(true)
    setLocateError('')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        setIsLocating(false)
      },
      () => {
        setLocateError(LOCATE_FAILED_MESSAGE)
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  const handleSave = async () => {
    if (photos.length === 0 || isSaving) return

    if (photos.length > MAX_PIN_PHOTOS) {
      setSaveError(`한 핀에는 사진을 최대 ${MAX_PIN_PHOTOS}장까지 추가할 수 있어요.`)
      return
    }

    /* 좌표 없이 핀을 만들면 사진을 붙이지 못해 빈 핀만 남는다.
       만들기 전에 막아야 되돌릴 것이 없다. */
    if (!hasLocation) {
      setSaveError(NO_LOCATION_MESSAGE)
      return
    }

    setIsSaving(true)
    setSaveError('')
    setUploadProgress(null)
    setContext({ placeName, textNote: memo })

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

      /* 사진을 핀보다 먼저 올린다. 한 장도 못 올렸으면 핀은 아직 만들지
         않은 상태라, 사진 없는 핀이 남지 않는다.
         빠진 사진을 두고 저장하기로 했으면 다시 올리지 않는다. */
      if (!hasAllowedPartialSaveRef.current) {
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

      if (uploadedPhotos.length === 0) {
        throw new Error('사진을 올리지 못했습니다. 잠시 후 다시 시도해주세요.')
      }

      /* 일부만 올라갔으면 이대로 저장할지 먼저 묻는다. 촬영한 사진은
         갤러리에 남지 않아, 여기서 버리면 되찾을 방법이 없다. */
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
          nfcTagId: tagId,
          latitude,
          longitude,
          address: address || (place?.address ?? ''),
          city: city || (place?.city ?? ''),
          countryCode: countryCode || (place?.countryCode ?? ''),
          countryName: countryName || (place?.countryName ?? ''),
          placeName,
          textNote: memo,
          audioFile: uploadedAudioRef.current?.url,
          voiceDurationSec,
        })

        createdPinIdRef.current = createdPin.pin_id
      }

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

      photos.forEach((photo) => URL.revokeObjectURL(photo.url))
      clearDraft()
      navigate('/', { replace: true })
    } catch (error) {
      setSaveError(
        error.message ?? '핀을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
      )
    } finally {
      setIsSaving(false)
      setUploadProgress(null)
    }
  }

  const finishSave = (destination = '/') => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    clearDraft()
    navigate(destination, { replace: true })
  }

  const handleViewPartiallySavedPin = () => {
    const pinId = createdPinIdRef.current
    setRegistrationResult(null)
    finishSave(pinId ? `/map/pin/${pinId}` : '/')
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

  return (
    <PageShell>
      <PageContent>
        <SuccessHeader>
          <StampIcon src={stampCheckIcon} alt="" aria-hidden="true" />
          <SuccessTitle>촬영을 마쳤어요</SuccessTitle>
          <SuccessDescription>
            {record.photoCount}장의 사진에 지금의 기억을 더해보세요
          </SuccessDescription>
          <PhotoCapacityText>
            사진 {record.photoCount}/{MAX_PIN_PHOTOS}장 ·{' '}
            {getRemainingPhotoCapacity(record.photoCount)}장 더 담을 수 있어요
          </PhotoCapacityText>
        </SuccessHeader>

        <SavedPhoto {...photoSwipe}>
          {/* 찍은 사진을 나란히 두고 트랙을 밀어 넘긴다. */}
          <PhotoTrack $index={photoIndex}>
            {photos.map((photo, index) => (
              <SavedImage
                key={photo.id}
                src={photo.url}
                alt={`저장된 여행 사진 ${index + 1}`}
              />
            ))}
          </PhotoTrack>

          <PhotoGradient aria-hidden="true" />
          <PhotoCount>
            {record.photoCount > 0
              ? `${photoIndex + 1} / ${record.photoCount}`
              : '사진 없음'}
          </PhotoCount>
          <PhotoCopy>
            <PhotoLocation>{record.location}</PhotoLocation>
            <PhotoTime>{record.time}</PhotoTime>
          </PhotoCopy>
        </SavedPhoto>

        <MemoryPrompt>
          <PromptTitleRow>
            <PromptIcon src={pencilIcon} alt="" aria-hidden="true" />
            <PromptTitle>지금 기억을 남겨볼까요?</PromptTitle>
          </PromptTitleRow>
          <PromptDescription>
            사진만으로는 남지 않는 순간을 짧게 기록해보세요.
          </PromptDescription>
        </MemoryPrompt>

        <AddressField>
          <AddressIcon src={locationIcon} alt="" aria-hidden="true" />
          <AddressInput
            type="text"
            value={placeName}
            onChange={handlePlaceNameChange}
            placeholder="장소 상세 이름을 입력해주세요"
            aria-label="장소 상세 이름"
          />
        </AddressField>

        <NoteField>
          <MemoInput
            value={memo}
            maxLength={300}
            onChange={handleMemoChange}
            placeholder="이 순간을 짧게 적어보세요"
            aria-label="이 순간에 대한 메모"
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

        {/* 좌표가 없으면 저장 자체가 막히므로, 누르기 전에 미리 알린다. */}
        {!hasLocation && (
          <LocationNotice role="status">
            <NoticeText>{locateError || NO_LOCATION_MESSAGE}</NoticeText>
            <RetryButton
              type="button"
              onClick={handleRetryLocation}
              disabled={isLocating}
            >
              {isLocating ? '위치 찾는 중...' : '위치 다시 찾기'}
            </RetryButton>
          </LocationNotice>
        )}

        <Footer>
          <FooterButton
            type="button"
            $variant="ghost"
            onClick={handleContinueCapture}
            disabled={isSaving || Boolean(createdPinIdRef.current)}
          >
            계속 촬영하기
          </FooterButton>
          <FooterButton
            type="button"
            $variant="primary"
            onClick={handleSave}
            disabled={isSaving || photos.length === 0 || !hasLocation}
          >
            {isSaving ? '저장 중...' : '저장하고 홈으로'}
          </FooterButton>
        </Footer>
        {isSaving && <PhotoUploadStatus progress={uploadProgress} />}
        {saveError && <SaveError role="alert">{saveError}</SaveError>}
      </PageContent>

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
            }장은 사라집니다.`}
        </PartialUploadNotice>
      </ConfirmationModal>

      <ConfirmationModal
        open={Boolean(registrationResult)}
        title="일부 사진만 저장됐어요"
        confirmLabel="홈으로"
        cancelLabel="핀에서 확인"
        closeOnBackdrop={false}
        onConfirm={() => {
          setRegistrationResult(null)
          finishSave()
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
          <VoiceSheet role="dialog" aria-modal="true" aria-labelledby="voice-sheet-title">
            <SheetHandle aria-hidden="true" />
            <SheetTitle id="voice-sheet-title">음성 메모</SheetTitle>
            <CloseButton
              type="button"
              aria-label="음성 메모 닫기"
              onClick={handleCloseVoiceMemo}
            >
              <CloseIcon src={closeIcon} alt="" />
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
    </PageShell>
  )
}

export default PinSaveComplete

const PageShell = styled.main`
  position: relative;
  width: min(100%, 402px);
  min-height: max(874px, var(--app-viewport-height));
  margin: 0 auto;
  overflow: hidden;
  background: var(--Background-Base);
  color: var(--Text-Primary);
  font-family: var(--font-sans);
`

const PageContent = styled.div`
  position: relative;
  z-index: 1;
  padding: 62px 24px 52px;
`

const SuccessHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`

const StampIcon = styled.img`
  width: 42px;
  height: 42px;
  display: block;
`

const SuccessTitle = styled.h1`
  margin-top: 14px;
  font: 700 24px/30px var(--font-sans);
  letter-spacing: -0.24px;
`

const SuccessDescription = styled.p`
  margin-top: 4px;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
`

const PhotoCapacityText = styled.p`
  margin-top: 4px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const SavedPhoto = styled.section`
  position: relative;
  height: 234px;
  /* 가로 제스처는 사진 넘기기로 쓰고 세로 스크롤은 그대로 둔다. */
  touch-action: pan-y;
  margin-top: 24px;
  overflow: hidden;
  border: 1px solid var(--Border-Default);
  border-radius: 20px;
  background: var(--Map-Land);
  box-shadow: var(--Effect-Chip);
`

/* 트랙 안에서 한 장씩 자리를 차지한다. 겹치지 않게 절대 위치를 쓰지 않는다. */
const SavedImage = styled.img`
  width: 100%;
  height: 100%;
  flex: none;
  display: block;
  object-fit: cover;
`

const PhotoTrack = styled.div`
  height: 100%;
  display: flex;
  transform: translateX(${({ $index }) => $index * -100}%);
  transition: transform 320ms cubic-bezier(0.33, 0, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const PhotoGradient = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 100px;
  background: linear-gradient(180deg, rgb(41 31 23 / 0%) 0%, rgb(41 31 23 / 78%) 100%);
`

const PhotoCount = styled.span`
  position: absolute;
  top: 15px;
  right: 15px;
  min-width: 55px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: rgb(42 37 34 / 55%);
  color: var(--Text-Inverse);
  font: var(--text-ui-caption);
`

const PhotoCopy = styled.div`
  position: absolute;
  right: 20px;
  bottom: 19px;
  left: 20px;
  color: var(--Text-Inverse);
`

/*
 * 18px 이면 흔한 길이의 도로명주소도 두 줄로 넘어간다. 15px 로 낮춰 대부분
 * 한 줄에 담기게 하고, 그래도 넘치는 긴 주소는 말줄임으로 한 줄을 지킨다.
 */
const PhotoLocation = styled.h2`
  overflow: hidden;
  font: var(--text-ui-button);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PhotoTime = styled.p`
  opacity: 0.82;
  font: var(--text-ui-caption);
`

const MemoryPrompt = styled.section`
  margin: 28px 3px 0;
`

const PromptTitleRow = styled.div`
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
  margin-top: 2px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const AddressField = styled.label`
  height: 49px;
  margin-top: 18px;
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

const NoteField = styled.section`
  position: relative;
  height: 160px;
  margin-top: 13px;
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

const Footer = styled.footer`
  margin-top: 24px;
  display: flex;
  gap: 10px;
`

const FooterButton = styled(Button)`
  width: auto;
  flex: 1 1 0;
  font: var(--text-ui-button);
`

const LocationNotice = styled.div`
  margin-top: 16px;
  border: 1px solid var(--Primary-Cognac);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgb(181 118 59 / 9%);
`

const NoticeText = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const PartialUploadNotice = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
`

const RetryButton = styled.button`
  min-height: 40px;
  border: 0;
  border-radius: 20px;
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

const SaveError = styled.p`
  margin-top: 12px;
  color: #b42318;
  font: var(--text-ui-caption);
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
  transform: translateX(-50%);
  background: rgb(181 161 140 / 50%);
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
  transform: translateX(-50%);
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
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
  transform: translateX(-50%);
  font: var(--text-ui-h1);
  letter-spacing: -0.26px;
`

const SheetTextButton = styled.button`
  position: absolute;
  top: 257px;
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
  border: 0;
  border-radius: 50%;
  transform: translateX(-50%);
  background: var(--Primary-Cognac);
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
