import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { uploadAudio } from '../../api/uploads'
import Button from '../../components/common/Button'
import { createPin } from '../../features/pins/pinApi'
import {
  addCapturedPhotos,
  attachUploadedPhotos,
} from '../../features/pins/recordPhotos'
import { reverseGeocode } from '../../features/pins/reverseGeocode'
import useRecordDraftStore from '../../features/pins/useRecordDraftStore'
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
  const setContext = useRecordDraftStore((draft) => draft.setContext)
  const setLocationDetails = useRecordDraftStore(
    (draft) => draft.setLocationDetails,
  )
  const clearDraft = useRecordDraftStore((draft) => draft.clearDraft)

  const [memo, setMemo] = useState(storedTextNote)
  const [placeName, setPlaceName] = useState(storedPlaceName)
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const createdPinIdRef = useRef(null)
  const uploadedPhotosRef = useRef(null)
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
  } = useVoiceRecorder()

  const record = {
    photo: photos[0]?.url ?? '',
    location:
      address ||
      (latitude != null && longitude != null
        ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : '위치 정보 없음'),
    time: formatRecordTime(photos[0]?.capturedAt),
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

  const handleSave = async () => {
    if (photos.length === 0 || isSaving) return

    setIsSaving(true)
    setSaveError('')
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
        })

        createdPinIdRef.current = createdPin.pin_id
      }

      let photoResult

      if (uploadedPhotosRef.current) {
        photoResult = await attachUploadedPhotos(
          createdPinIdRef.current,
          uploadedPhotosRef.current,
        )
      } else {
        const uploadResult = await addCapturedPhotos(
          createdPinIdRef.current,
          photos,
          { latitude, longitude },
        )
        uploadedPhotosRef.current = uploadResult.uploadedPhotos
        photoResult = uploadResult.result
      }

      if ((photoResult.rejected?.length ?? 0) > 0) {
        throw new Error('일부 사진을 핀에 첨부하지 못했습니다.')
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
    }
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
        </SuccessHeader>

        <SavedPhoto>
          {record.photo && <SavedImage src={record.photo} alt="저장된 여행 사진" />}
          <PhotoGradient aria-hidden="true" />
          <PhotoCount>
            {record.photoCount > 0 ? `1 / ${record.photoCount}` : '사진 없음'}
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
            disabled={isSaving || photos.length === 0}
          >
            {isSaving ? '저장 중...' : '저장하고 홈으로'}
          </FooterButton>
        </Footer>
        {saveError && <SaveError role="alert">{saveError}</SaveError>}
      </PageContent>

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

const SavedPhoto = styled.section`
  position: relative;
  height: 234px;
  margin-top: 24px;
  overflow: hidden;
  border: 1px solid var(--Border-Default);
  border-radius: 20px;
  background: var(--Map-Land);
  box-shadow: var(--Effect-Chip);
`

const SavedImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
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

const PhotoLocation = styled.h2`
  font: var(--text-ui-h3);
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

const SaveError = styled.p`
  margin-top: 12px;
  color: #b42318;
  font: var(--text-ui-caption);
  text-align: center;
  word-break: keep-all;
`

const ModalLayer = styled.div`
  position: fixed;
  z-index: 50;
  inset: 0 auto 0 50%;
  width: min(100%, 402px);
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
