import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const DEFAULT_LOCATION = '크컴'

const formatCurrentTime = () => {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return formatter.format(new Date())
}

const PhotoCapture = () => {
  const navigate = useNavigate()
  const cameraInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)

  const openNativeCamera = () => {
    cameraInputRef.current?.click()
  }

  const handlePhotoSelected = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const photoUrl = URL.createObjectURL(file)
    const nextRecord = {
      photo: photoUrl,
      photoName: file.name,
      location: DEFAULT_LOCATION,
      time: formatCurrentTime(),
    }

    try {
      sessionStorage.setItem(
        'latestPinRecord',
        JSON.stringify({
          photoName: nextRecord.photoName,
          location: nextRecord.location,
          time: nextRecord.time,
        }),
      )
    } catch {
      // A stored preview is optional until backend persistence is connected.
    }

    navigate('/record/pin-saved', { state: nextRecord })
  }

  return (
    <CaptureShell>
      <NativeCameraInput
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelected}
      />

      <CameraPreviewArea>
        <TopControls>
          <TinyDot aria-hidden="true" />
          <CameraIcon type="button" aria-label="기본 카메라 열기" onClick={openNativeCamera}>
            ⧉
          </CameraIcon>
        </TopControls>

        <CameraOpenButton type="button" onClick={openNativeCamera} disabled={isLoading}>
          {isLoading ? '저장 중' : '기본 카메라 열기'}
        </CameraOpenButton>
      </CameraPreviewArea>

      <BottomPanel>
        <ModeRow>
          <ModeText>비디오</ModeText>
          <ModeActive>사진</ModeActive>
          <RotateButton type="button" aria-label="기본 카메라 열기" onClick={openNativeCamera}>
            ↻
          </RotateButton>
        </ModeRow>
      </BottomPanel>
    </CaptureShell>
  )
}

export default PhotoCapture

const CaptureShell = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: 100svh;
  margin: 0 auto;
  background: #000;
  color: #fff;
  overflow: hidden;
  position: relative;
  font-family: var(--font-sans);
`

const NativeCameraInput = styled.input`
  position: fixed;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`

const CameraPreviewArea = styled.section`
  height: calc(100svh - 138px);
  min-height: 604px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 47%, rgba(43, 40, 28, 0.86), transparent 28%),
    linear-gradient(180deg, #000 0 16%, #151410 16% 100%);
`

const TopControls = styled.div`
  position: absolute;
  top: 14px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`

const TinyDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #00d37a;
`

const CameraIcon = styled.button`
  position: absolute;
  top: 6px;
  right: 48px;
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 17px;
  line-height: 1;
`

const CameraOpenButton = styled.button`
  min-width: 128px;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  background: #fff;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    color: #6b7280;
    cursor: wait;
  }
`

const BottomPanel = styled.section`
  height: 138px;
  padding: 28px 22px calc(18px + env(safe-area-inset-bottom));
  background: #000;
  display: flex;
  align-items: flex-end;
`

const ModeRow = styled.div`
  width: 100%;
  min-height: 42px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`

const ModeText = styled.span`
  justify-self: end;
  margin-right: 12px;
  color: #d7d7d7;
  font-size: 17px;
`

const ModeActive = styled.span`
  min-width: 86px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(37, 37, 37, 0.98);
  color: #ffd60a;
  font-size: 16px;
`

const RotateButton = styled.button`
  justify-self: end;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: rgba(43, 43, 43, 0.96);
  color: #fff;
  font-size: 24px;
`
