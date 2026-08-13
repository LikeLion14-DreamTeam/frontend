import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

/**
 * 연속 촬영 테스트 화면.
 *
 * 기존 `/record/camera` 는 <input capture> 로 OS 카메라 앱을 여는 방식이라
 * 구조상 한 번에 한 장만 돌아온다. 이 화면은 getUserMedia 로 앱 안에 카메라를
 * 직접 띄우고, 셔터를 누를 때마다 현재 프레임을 canvas 로 캡처해 쌓는다.
 *
 * 확인 후 실제 촬영 플로우에 반영할지 결정한다.
 */

// 촬영 해상도 요청값. 기기가 지원하지 않으면 근접한 값으로 대체된다.
const VIDEO_CONSTRAINTS = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
}

const JPEG_QUALITY = 0.92

// 저장 비율 3:4 고정. 미리보기 프레임도 같은 비율이라 보이는 그대로 찍힌다.
const CAPTURE_RATIO = 3 / 4

const MultiCaptureTest = () => {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const shotsRef = useRef([])

  const [shots, setShots] = useState([])
  const [previewId, setPreviewId] = useState(null)
  const [status, setStatus] = useState('starting')
  const [errorMessage, setErrorMessage] = useState('')

  const previewIndex = shots.findIndex((shot) => shot.id === previewId)
  const previewShot = previewIndex === -1 ? null : shots[previewIndex]

  // 미리보기에 쓰는 objectURL 은 해제 시점을 놓치면 메모리에 남는다.
  shotsRef.current = shots

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    setStatus('starting')
    setErrorMessage('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setErrorMessage(
        '이 브라우저는 카메라 접근을 지원하지 않습니다. HTTPS 환경인지 확인해주세요.',
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setStatus('ready')
    } catch (error) {
      setStatus('error')

      if (error.name === 'NotAllowedError') {
        setErrorMessage(
          '카메라 권한이 거부되었습니다. 설정에서 허용한 뒤 다시 시도해주세요.',
        )
        return
      }
      if (error.name === 'NotFoundError') {
        setErrorMessage('사용할 수 있는 카메라를 찾지 못했습니다.')
        return
      }
      setErrorMessage(`카메라를 열지 못했습니다. (${error.name})`)
    }
  }, [])

  useEffect(() => {
    startCamera()

    return () => {
      stopStream()
      shotsRef.current.forEach((shot) => URL.revokeObjectURL(shot.url))
    }
  }, [startCamera, stopStream])

  const handleShutter = () => {
    const video = videoRef.current
    if (!video || status !== 'ready') return

    // 원본 프레임에서 3:4 영역만 가운데 기준으로 잘라낸다.
    // 미리보기가 object-fit: cover 라 화면에 보이던 영역과 동일하다.
    const sourceWidth = video.videoWidth
    const sourceHeight = video.videoHeight
    const isSourceWider = sourceWidth / sourceHeight > CAPTURE_RATIO

    const cropWidth = isSourceWider ? sourceHeight * CAPTURE_RATIO : sourceWidth
    const cropHeight = isSourceWider ? sourceHeight : sourceWidth / CAPTURE_RATIO
    const cropX = (sourceWidth - cropWidth) / 2
    const cropY = (sourceHeight - cropHeight) / 2

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(cropWidth)
    canvas.height = Math.round(cropHeight)
    canvas
      .getContext('2d')
      .drawImage(
        video,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      )

    canvas.toBlob(
      (blob) => {
        if (!blob) return

        setShots((prev) => [
          ...prev,
          {
            id: `${prev.length}-${blob.size}`,
            url: URL.createObjectURL(blob),
            size: blob.size,
            width: canvas.width,
            height: canvas.height,
            capturedAt: new Date().toISOString(),
          },
        ])
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  }

  const handleRemove = (id) => {
    setShots((prev) => {
      const target = prev.find((shot) => shot.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((shot) => shot.id !== id)
    })

    if (previewId === id) {
      setPreviewId(null)
    }
  }

  const handleDone = () => {
    stopStream()
    navigate(-1)
  }

  return (
    <CaptureShell>
      <PreviewArea>
        <PreviewFrame>
          <Preview ref={videoRef} playsInline muted autoPlay />
        </PreviewFrame>

        {status !== 'ready' && (
          <Overlay>
            {status === 'starting' ? (
              <OverlayText>카메라를 여는 중...</OverlayText>
            ) : (
              <>
                <OverlayText>{errorMessage}</OverlayText>
                <RetryButton type="button" onClick={startCamera}>
                  다시 시도
                </RetryButton>
              </>
            )}
          </Overlay>
        )}

        <ShotCount>{shots.length}장</ShotCount>
      </PreviewArea>

      <BottomPanel>
        <ThumbnailStrip aria-label="촬영한 사진">
          {shots.length === 0 && <EmptyHint>셔터를 눌러 촬영하세요</EmptyHint>}
          {shots.map((shot, index) => (
            <Thumbnail key={shot.id}>
              <ThumbnailButton
                type="button"
                aria-label={`${index + 1}번째 사진 미리보기`}
                onClick={() => setPreviewId(shot.id)}
              >
                <ThumbnailImage src={shot.url} alt="" />
              </ThumbnailButton>
              <RemoveButton
                type="button"
                aria-label="이 사진 삭제"
                onClick={() => handleRemove(shot.id)}
              >
                ×
              </RemoveButton>
            </Thumbnail>
          ))}
        </ThumbnailStrip>

        <ControlRow>
          <SideButton type="button" onClick={handleDone}>
            닫기
          </SideButton>

          <Shutter
            type="button"
            aria-label="촬영"
            onClick={handleShutter}
            disabled={status !== 'ready'}
          />

          <SideButton type="button" onClick={handleDone} $primary>
            완료
          </SideButton>
        </ControlRow>

        {/* 높이가 흔들리면 미리보기 프레임 계산이 어긋나므로 항상 렌더한다. */}
        <DebugInfo>
          {shots.length > 0
            ? `마지막 촬영 ${shots.at(-1).width}×${shots.at(-1).height} · ${Math.round(shots.at(-1).size / 1024)}KB`
            : ''}
        </DebugInfo>
      </BottomPanel>

      {previewShot && (
        <PreviewOverlay
          role="dialog"
          aria-label="사진 미리보기"
          onClick={() => setPreviewId(null)}
        >
          <PreviewImage src={previewShot.url} alt="" />
          <PreviewClose type="button" aria-label="미리보기 닫기">
            ×
          </PreviewClose>
          <PreviewMeta>
            {previewIndex + 1} / {shots.length} · {previewShot.width}×
            {previewShot.height} · {Math.round(previewShot.size / 1024)}KB
          </PreviewMeta>
        </PreviewOverlay>
      )}
    </CaptureShell>
  )
}

export default MultiCaptureTest

/* 하단 패널의 확정 높이. 미리보기 프레임 크기를 여기서 역산하므로,
   패널 구성을 바꾸면 이 값도 함께 고쳐야 한다.
   12(위 여백) + 64(썸네일) + 10 + 68(셔터) + 10 + 18(정보) + 12(아래 여백) */
const BOTTOM_PANEL_HEIGHT = '194px'

const CaptureShell = styled.main`
  width: 100%;
  max-width: 450px;
  /* 스크롤 없이 한 화면에 들어가도록 높이를 고정한다. */
  height: var(--app-viewport-height);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #000;
  color: #fff;
  font-family: var(--font-sans);
`

const PreviewArea = styled.section`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
`

/* 3:4 고정 프레임. 남는 위아래는 검은 여백이 되고, 기기 높이에 따라 여백 크기가 달라진다.
   폭이 넘칠 때를 대비해 남은 세로 공간에서 역산한 값과 100% 중 작은 쪽을 쓴다. */
const PreviewFrame = styled.div`
  position: relative;
  width: min(
    100%,
    calc(
      (
          var(--app-viewport-height) - ${BOTTOM_PANEL_HEIGHT} -
            env(safe-area-inset-bottom)
        ) * 3 / 4
    )
  );
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #111;
`

const Preview = styled.video`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: rgb(0 0 0 / 70%);
  text-align: center;
`

const OverlayText = styled.p`
  font: var(--text-ui-body-m);
  word-break: keep-all;
`

const RetryButton = styled.button`
  min-height: 40px;
  padding: 0 20px;
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font: var(--text-ui-button);
  cursor: pointer;
`

const ShotCount = styled.span`
  position: absolute;
  top: calc(16px + env(safe-area-inset-top));
  right: 16px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgb(0 0 0 / 55%);
  font: var(--text-ui-caption);
`

const BottomPanel = styled.section`
  flex: 0 0 auto;
  height: calc(${BOTTOM_PANEL_HEIGHT} + env(safe-area-inset-bottom));
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #000;
`

const ThumbnailStrip = styled.div`
  flex: 0 0 64px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
`

const EmptyHint = styled.p`
  color: #8a8a8a;
  font: var(--text-ui-caption);
`

const Thumbnail = styled.div`
  position: relative;
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
`

const ThumbnailButton = styled.button`
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: none;
  overflow: hidden;
  cursor: pointer;
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  /* iOS에서 길게 눌렀을 때 시스템 메뉴가 뜨지 않도록 한다. */
  -webkit-touch-callout: none;
  pointer-events: none;
`

const PreviewOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(0 0 0 / 92%);
`

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  display: block;
  object-fit: contain;
`

const PreviewClose = styled.button`
  position: absolute;
  top: calc(12px + env(safe-area-inset-top));
  right: 16px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: rgb(255 255 255 / 15%);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
`

const PreviewMeta = styled.p`
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(16px + env(safe-area-inset-bottom));
  color: #b9b9b9;
  font: var(--text-ui-caption);
  text-align: center;
`

const RemoveButton = styled.button`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: rgb(0 0 0 / 80%);
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
`

const ControlRow = styled.div`
  flex: 0 0 68px;
  height: 68px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`

const Shutter = styled.button`
  width: 68px;
  height: 68px;
  border: 4px solid rgb(255 255 255 / 85%);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;

  &:active {
    background: #d0d0d0;
  }

  &:disabled {
    border-color: rgb(255 255 255 / 30%);
    background: #555;
    cursor: not-allowed;
  }
`

const SideButton = styled.button`
  justify-self: ${({ $primary }) => ($primary ? 'end' : 'start')};
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: ${({ $primary }) => ($primary ? '#fff' : 'transparent')};
  color: ${({ $primary }) => ($primary ? '#111' : '#fff')};
  font: var(--text-ui-button);
  cursor: pointer;
`

const DebugInfo = styled.p`
  flex: 0 0 18px;
  height: 18px;
  color: #8a8a8a;
  font: var(--text-ui-caption);
  line-height: 18px;
  text-align: center;
`
