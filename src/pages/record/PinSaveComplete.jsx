import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import stampCheckIcon from '../../assets/pin-save/stamp-check.svg'
import pencilIcon from '../../assets/pin-save/pencil.svg'
import microphoneIcon from '../../assets/pin-save/microphone.svg'
import locationIcon from '../../assets/pin-save/location.svg'
import closeIcon from '../../assets/pin-save/close.svg'
import recordingDotIcon from '../../assets/pin-save/recording-dot.svg'

const DEFAULT_RECORD = {
  location: '서울 종로구 세종로',
  time: '2025.06.14 오전 10:32',
  tripName: '서울 여행',
  pinOrder: 4,
  photoIndex: 1,
  photoCount: 3,
}

const WAVEFORM_HEIGHTS = [
  6, 11, 18, 9, 24, 14, 7, 20, 30, 13, 6, 16, 26, 10, 15, 7, 14, 22,
  9, 18, 12, 7, 16, 28, 11, 17, 8, 20, 13, 6, 15, 25, 9, 12, 19, 8,
  22, 10, 14, 7, 17, 11, 6, 13, 9, 5, 8, 6, 4, 5, 3, 4, 3, 2, 3, 2,
]

const getStoredRecord = () => {
  try {
    return JSON.parse(sessionStorage.getItem('latestPinRecord') || '{}')
  } catch {
    return {}
  }
}

const getTextValue = (value, fallback) => {
  if (typeof value !== 'string' || !value.trim() || value.includes('?')) {
    return fallback
  }

  return value
}

const formatRecordTime = (time) => {
  const validTime = getTextValue(time, '')

  if (!validTime) return DEFAULT_RECORD.time
  if (/^\d{4}\.\d{2}\.\d{2}/.test(validTime)) return validTime

  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('.')

  return `${date} ${validTime}`
}

const PinSaveComplete = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const storedRecord = getStoredRecord()
  const [memo, setMemo] = useState('')
  const [address, setAddress] = useState('')
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false)

  const record = {
    photo: state?.photo || storedRecord.photo || '',
    location: getTextValue(
      state?.location || storedRecord.location,
      DEFAULT_RECORD.location,
    ),
    time: formatRecordTime(state?.time || storedRecord.time),
    tripName: getTextValue(
      state?.tripName || storedRecord.tripName,
      DEFAULT_RECORD.tripName,
    ),
    pinOrder: state?.pinOrder || storedRecord.pinOrder || DEFAULT_RECORD.pinOrder,
    photoIndex:
      state?.photoIndex || storedRecord.photoIndex || DEFAULT_RECORD.photoIndex,
    photoCount:
      state?.photoCount || storedRecord.photoCount || DEFAULT_RECORD.photoCount,
  }

  useEffect(() => {
    if (!isVoiceSheetOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsVoiceSheetOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isVoiceSheetOpen])

  return (
    <PageShell>
      <PageContent>
        <SuccessHeader>
          <StampIcon src={stampCheckIcon} alt="" aria-hidden="true" />
          <SuccessTitle>기록했어요</SuccessTitle>
          <SuccessDescription>
            {record.tripName}의 {record.pinOrder}번째 핀에 추가됐어요
          </SuccessDescription>
        </SuccessHeader>

        <SavedPhoto>
          {record.photo && <SavedImage src={record.photo} alt="저장된 여행 사진" />}
          <PhotoGradient aria-hidden="true" />
          <PhotoCount>
            {record.photoIndex} / {record.photoCount}
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
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="상세 주소를 입력해주세요"
            aria-label="상세 주소"
          />
        </AddressField>

        <NoteField>
          <MemoInput
            value={memo}
            maxLength={300}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="이 순간을 짧게 적어보세요"
            aria-label="이 순간에 대한 메모"
          />
          <NoteActions>
            <VoiceMemoButton
              type="button"
              $variant="ghost"
              onClick={() => setIsVoiceSheetOpen(true)}
            >
              <VoiceIcon src={microphoneIcon} alt="" aria-hidden="true" />
              음성 메모 추가
            </VoiceMemoButton>
            <CharacterCount>{memo.length} / 300</CharacterCount>
          </NoteActions>
        </NoteField>

        <Footer>
          <FooterButton
            type="button"
            $variant="ghost"
            onClick={() => navigate('/record/camera')}
          >
            계속 촬영하기
          </FooterButton>
          <FooterButton type="button" $variant="primary" onClick={() => navigate('/')}>
            홈으로
          </FooterButton>
        </Footer>
      </PageContent>

      {isVoiceSheetOpen && (
        <ModalLayer>
          <Scrim
            type="button"
            aria-label="음성 메모 닫기"
            onClick={() => setIsVoiceSheetOpen(false)}
          />
          <VoiceSheet role="dialog" aria-modal="true" aria-labelledby="voice-sheet-title">
            <SheetHandle aria-hidden="true" />
            <SheetTitle id="voice-sheet-title">음성 메모</SheetTitle>
            <CloseButton
              type="button"
              aria-label="음성 메모 닫기"
              onClick={() => setIsVoiceSheetOpen(false)}
            >
              <CloseIcon src={closeIcon} alt="" />
            </CloseButton>

            <RecordingState>
              <RecordingDot src={recordingDotIcon} alt="" aria-hidden="true" />
              녹음 중
            </RecordingState>

            <Waveform aria-hidden="true">
              {WAVEFORM_HEIGHTS.map((height, index) => (
                <WaveformBar key={`${height}-${index}`} $height={height} $active={index < 38} />
              ))}
            </Waveform>

            <RecordingTime>00:23</RecordingTime>
            <RecordAgainButton type="button">다시녹음</RecordAgainButton>
            <StopButton
              type="button"
              aria-label="녹음 중지"
              onClick={() => setIsVoiceSheetOpen(false)}
            >
              <StopIcon aria-hidden="true" />
            </StopButton>
            <DeleteRecordingButton
              type="button"
              onClick={() => setIsVoiceSheetOpen(false)}
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
  height: 298px;
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
  top: 234px;
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
  top: 211px;
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

const DeleteRecordingButton = styled(SheetTextButton)`
  right: 68px;
  color: var(--Primary-Cognac);
`
