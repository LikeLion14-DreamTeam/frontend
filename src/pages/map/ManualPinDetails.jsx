import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Tile from '../../components/common/Tile'
import backIcon from '../../assets/icons/trip-edit-back.svg'
import chevronIcon from '../../assets/icons/trip-select-chevron.svg'
import closeIcon from '../../assets/pin-save/close.svg'
import backgroundTexture from '../../assets/pin-save/manual-pin-form-bg.png'
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

const ManualPinDetails = () => {
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [memo, setMemo] = useState('')
  const [hasPhotos, setHasPhotos] = useState(false)
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false)

  useEffect(() => {
    if (!isVoiceSheetOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsVoiceSheetOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isVoiceSheetOpen])

  return (
    <Page>
      <Background src={backgroundTexture} alt="" aria-hidden="true" />

      <Header>
        <BackButton
          type="button"
          aria-label="핀 위치 선택으로 돌아가기"
          onClick={() => navigate('/map/pin/new')}
        >
          <img src={backIcon} alt="" aria-hidden="true" />
        </BackButton>
        <HeaderTitle>구간 편집</HeaderTitle>
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
            <ChosenName>북촌 한옥마을 입구</ChosenName>
            <ChosenAddress>서울 종로구 계동길 37</ChosenAddress>
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
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="상세 주소를 입력해주세요"
            aria-label="상세 주소"
          />
        </AddressField>

        <DateFields>
          <FieldGroup>
            <FieldLabel>날짜</FieldLabel>
            <SelectButton type="button">
              <span>2024.11.03</span>
              <Chevron src={chevronIcon} alt="" aria-hidden="true" />
            </SelectButton>
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>시각</FieldLabel>
            <SelectButton type="button">
              <span>오후 2:40</span>
              <Chevron src={chevronIcon} alt="" aria-hidden="true" />
            </SelectButton>
          </FieldGroup>
        </DateFields>

        <PhotoSection>
          <FieldLabel>사진</FieldLabel>
          {hasPhotos ? (
            <PhotoViewport>
              <PhotoStrip aria-label="추가된 사진">
                {Array.from({ length: 4 }, (_, index) => (
                  <PhotoTile
                    key={index}
                    interactive={false}
                    aria-label={`추가된 사진 ${index + 1}`}
                  />
                ))}
              </PhotoStrip>
            </PhotoViewport>
          ) : (
            <AddPhotoButton type="button" onClick={() => setHasPhotos(true)}>
              <AddPhotoIcon src={photoAddIcon} alt="" aria-hidden="true" />
              <span>사진 추가</span>
            </AddPhotoButton>
          )}
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
              onClick={() => setIsVoiceSheetOpen(true)}
            >
              <VoiceIcon src={microphoneIcon} alt="" aria-hidden="true" />
              음성 메모 추가
            </VoiceMemoButton>
            <CharacterCount>{memo.length} / 300</CharacterCount>
          </NoteActions>
        </NoteField>
      </Content>

      <AddPinButton type="button">핀 추가하기</AddPinButton>

      {isVoiceSheetOpen && (
        <ModalLayer>
          <Scrim
            type="button"
            aria-label="음성 메모 닫기"
            onClick={() => setIsVoiceSheetOpen(false)}
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
              onClick={() => setIsVoiceSheetOpen(false)}
            >
              <CloseIcon src={closeIcon} alt="" aria-hidden="true" />
            </CloseButton>

            <RecordingState>
              <RecordingDot src={recordingDotIcon} alt="" aria-hidden="true" />
              녹음 중
            </RecordingState>

            <Waveform aria-hidden="true">
              {WAVEFORM_HEIGHTS.map((height, index) => (
                <WaveformBar
                  key={`${height}-${index}`}
                  $height={height}
                  $active={index < 38}
                />
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
    </Page>
  )
}

export default ManualPinDetails

const Page = styled.main`
  position: relative;
  width: min(100%, 402px);
  min-height: max(874px, var(--app-viewport-height));
  margin: 0 auto;
  overflow: hidden;
  background: var(--Background-Base);
  color: var(--Text-Primary);
`

const Background = styled.img`
  position: absolute;
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  pointer-events: none;
`

const Header = styled.header`
  position: absolute;
  z-index: 2;
  top: 58px;
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
  top: 136px;
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

const SelectButton = styled.button`
  width: 100%;
  height: 45px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  background: var(--Surface-Base);
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  text-align: left;
  cursor: pointer;

  span {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const Chevron = styled.img`
  width: 11.5px;
  height: 6.5px;
  flex: 0 0 auto;
  display: block;
`

const PhotoSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 7px;
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

const AddPhotoIcon = styled.img`
  width: 20px;
  height: 20px;
  display: block;
`

const PhotoViewport = styled.div`
  width: calc(100vw - 24px);
  max-width: 378px;
  overflow: hidden;
`

const PhotoStrip = styled.div`
  width: 475px;
  display: flex;
  gap: 10px;
`

const PhotoTile = styled(Tile)`
  width: 111.333px;
  height: 124px;
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
  top: 766px;
  right: 24px;
  left: 24px;
  width: auto;
  height: 54px;
  color: var(--Text-Inverse);
  background: var(--Primary-Cognac);
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
  top: 234px;
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
  top: 211px;
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

const DeleteRecordingButton = styled(SheetTextButton)`
  right: 68px;
  color: var(--Primary-Cognac);
`
