import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { createGlobalStyle } from 'styled-components'
import trashIcon from '../../assets/icons/capture-trash.svg'
import closeIcon from '../../assets/icons/capture-close.svg'

/**
 * 연속 촬영 화면 (피그마 `8 사진 촬영 화면`, `8.1 사진 촬영 세부`)
 *
 * `<input capture>` 로 OS 카메라 앱을 여는 방식은 구조상 한 번에 한 장만 돌아온다.
 * 이 화면은 getUserMedia 로 앱 안에 카메라를 직접 띄우고, 셔터를 누를 때마다
 * 현재 프레임을 canvas 로 캡처해 쌓는다.
 *
 * 제약: HTTPS 환경에서만 동작하고(로컬은 localhost 만), canvas 캡처라 EXIF 가 없다.
 * 촬영 위치·시각은 나중에 Geolocation API 와 촬영 시각으로 직접 채워야 한다.
 */

// 촬영 해상도 요청값. 기기가 지원하지 않으면 근접한 값으로 대체된다.
const VIDEO_CONSTRAINTS = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
}

const JPEG_QUALITY = 0.92

// 저장 비율 3:4 고정. 뷰파인더도 같은 비율이라 보이는 그대로 찍힌다.
const CAPTURE_RATIO = 3 / 4

// TODO: NFC 태그·위치 연동 전까지 쓰는 임시 문구.
const TAG_CONTEXT = '경복궁 광화문 앞 · 태그 인식됨'

/** 상하단 안전영역을 화면 배경색과 맞춘다. 그 영역은 배경 "색상"만 따라간다. */
const DarkSafeArea = createGlobalStyle`
  html,
  body,
  #root {
    background-color: var(--Text-Primary);
  }
`

const MultiCapture = () => {
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
    // 뷰파인더가 object-fit: cover 라 화면에 보이던 영역과 동일하다.
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
            capturedAt: new Date().toISOString(),
          },
        ])
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  }

  /**
   * 삭제는 미리보기에서만 할 수 있다. 썸네일의 x 버튼은 크게 보려다 잘못 눌러
   * 지우는 일이 있어 시안에서 빠졌다.
   *
   * 지운 뒤에는 같은 자리의 다음 사진으로 넘어가고, 마지막 한 장이었으면 닫는다.
   */
  const handleRemovePreview = () => {
    const removed = shots[previewIndex]
    if (!removed) return

    URL.revokeObjectURL(removed.url)

    const remaining = shots.filter((shot) => shot.id !== removed.id)
    const next = remaining[previewIndex] ?? remaining[previewIndex - 1] ?? null

    setShots(remaining)
    setPreviewId(next?.id ?? null)
  }

  const handleDone = () => {
    stopStream()
    navigate(-1)
  }

  return (
    <CaptureShell>
      <DarkSafeArea />

      <ViewfinderArea>
        <Viewfinder>
          <Preview ref={videoRef} playsInline muted autoPlay />
          <ViewfinderTint aria-hidden="true" />
          <GridLine $vertical style={{ left: '33.333%' }} aria-hidden="true" />
          <GridLine $vertical style={{ left: '66.666%' }} aria-hidden="true" />
          <GridLine style={{ top: '33.333%' }} aria-hidden="true" />
          <GridLine style={{ top: '66.666%' }} aria-hidden="true" />

          <TagChip>{TAG_CONTEXT}</TagChip>
          <CountChip>{shots.length} 장</CountChip>
        </Viewfinder>

        {status !== 'ready' && (
          <StatusOverlay>
            {status === 'starting' ? (
              <StatusText>카메라를 여는 중...</StatusText>
            ) : (
              <>
                <StatusText>{errorMessage}</StatusText>
                <RetryButton type="button" onClick={startCamera}>
                  다시 시도
                </RetryButton>
              </>
            )}
          </StatusOverlay>
        )}
      </ViewfinderArea>

      <BottomPanel>
        <ThumbnailStrip aria-label="촬영한 사진">
          {shots.map((shot, index) => (
            <ThumbnailButton
              key={shot.id}
              type="button"
              aria-label={`${index + 1}번째 사진 크게 보기`}
              onClick={() => setPreviewId(shot.id)}
            >
              <ThumbnailImage src={shot.url} alt="" />
            </ThumbnailButton>
          ))}
        </ThumbnailStrip>

        <ControlRow>
          <TextButton type="button" onClick={handleDone}>
            닫기
          </TextButton>

          <Shutter
            type="button"
            aria-label="촬영"
            onClick={handleShutter}
            disabled={status !== 'ready'}
          />

          <TextButton type="button" $accent onClick={handleDone}>
            완료
          </TextButton>
        </ControlRow>
      </BottomPanel>

      {previewShot && (
        <PreviewLayer role="dialog" aria-label="사진 크게 보기">
          <PreviewClose
            type="button"
            aria-label="닫기"
            onClick={() => setPreviewId(null)}
          >
            <img src={closeIcon} alt="" aria-hidden="true" />
          </PreviewClose>

          <PreviewPhoto src={previewShot.url} alt="" />

          <PreviewIndex>
            <IndexCurrent>{previewIndex + 1}</IndexCurrent>
            <IndexSlash>/</IndexSlash>
            <IndexTotal>{shots.length}</IndexTotal>
          </PreviewIndex>

          <PreviewActions>
            <PreviewDeleteButton type="button" onClick={handleRemovePreview}>
              <img src={trashIcon} alt="" aria-hidden="true" />
              삭제
            </PreviewDeleteButton>
          </PreviewActions>
        </PreviewLayer>
      )}
    </CaptureShell>
  )
}

export default MultiCapture

/* 하단 패널의 확정 높이. 뷰파인더가 남은 공간을 채우므로 구성을 바꾸면 함께 고친다.
   66(썸네일) + 34(간격) + 72(컨트롤) + 58(아래 여백)
   시안은 45 지만 화면이 짧을 때 뷰파인더가 너무 줄어 조금 좁혔다. */
const BOTTOM_PANEL_HEIGHT = '230px'

/* 뷰파인더와 썸네일 사이의 최소 간격. 남는 높이가 있으면 위아래로 나뉘어
   이보다 벌어지고, 화면이 짧으면 뷰파인더가 줄어 이 간격을 지킨다.
   시안은 39. */
const VIEWFINDER_GAP = '30px'

const CaptureShell = styled.main`
  width: 100%;
  max-width: 450px;
  /* 스크롤 없이 한 화면에 들어가도록 높이를 고정한다. */
  height: var(--app-viewport-height);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--Text-Primary);
`

const ViewfinderArea = styled.section`
  position: relative;
  flex: 1;
  min-height: 0;
  padding-bottom: ${VIEWFINDER_GAP};
  display: flex;
  /* 남는 높이를 위아래로 나눠 뷰파인더를 가운데 둔다. */
  align-items: center;
  justify-content: center;
`

/* 3:4 고정. 폭이 넘칠 때를 대비해 남은 세로 공간에서 역산한 값과 100% 중 작은 쪽을 쓴다. */
const Viewfinder = styled.div`
  position: relative;
  width: min(
    100%,
    calc(
      (
          var(--app-viewport-height) - ${BOTTOM_PANEL_HEIGHT} -
            ${VIEWFINDER_GAP} - env(safe-area-inset-bottom)
        ) * 3 / 4
    )
  );
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #9c9c9c;
`

const Preview = styled.video`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const ViewfinderTint = styled.div`
  position: absolute;
  inset: 0;
  background: rgb(20 17 16 / 12%);
`

const GridLine = styled.span`
  position: absolute;
  background: rgb(255 255 255 / 14%);
  ${({ $vertical }) =>
    $vertical
      ? 'top: 0; bottom: 0; width: 1px;'
      : 'left: 0; right: 0; height: 1px;'}
`

/* 뷰파인더 모서리 기준 위치. 화면이 짧아 뷰파인더가 줄어도 칩이 함께 따라간다. */
const chipBase = `
  position: absolute;
  z-index: 1;
  top: 11px;
  display: inline-flex;
  align-items: center;
  background: rgb(36 28 22 / 60%);
  font: var(--text-ui-label);
  white-space: nowrap;
`

const TagChip = styled.span`
  ${chipBase}
  left: 8px;
  padding: 7px 14px 7px 11px;
  border-radius: 16px;
  color: rgb(242 233 220 / 92%);
`

const CountChip = styled.span`
  ${chipBase}
  right: 8px;
  padding: 6px 11px;
  border-radius: 20px;
  color: #f2e9dc;
`

const StatusOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: rgb(20 17 16 / 72%);
  text-align: center;
`

const StatusText = styled.p`
  color: #f2e9dc;
  font: var(--text-ui-body-m);
  word-break: keep-all;
`

const RetryButton = styled.button`
  min-height: 40px;
  padding: 0 20px;
  border: 1px solid rgb(242 233 220 / 40%);
  border-radius: 999px;
  background: transparent;
  color: #f2e9dc;
  font: var(--text-ui-button);
  cursor: pointer;
`

const BottomPanel = styled.section`
  flex: 0 0 auto;
  height: calc(${BOTTOM_PANEL_HEIGHT} + env(safe-area-inset-bottom));
  padding: 0 24px calc(58px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
`

/* 첫 장은 본문 여백(24)에 맞춰 시작하지만, 넘기면 화면 끝까지 흘러가며 잘린다.
   패널의 좌우 여백을 음수 마진으로 상쇄하고 같은 값을 스크롤 영역 안쪽에 준다. */
const ThumbnailStrip = styled.div`
  flex: 0 0 66px;
  height: 66px;
  margin: 0 -24px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 9px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

const ThumbnailButton = styled.button`
  flex: 0 0 auto;
  width: 66px;
  height: 66px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: #fff9f1;
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

const ControlRow = styled.div`
  flex: 0 0 72px;
  height: 72px;
  margin-top: 34px;
  /* 패널 좌우 여백 24 + 30 = 시안의 54px */
  padding: 0 30px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`

const TextButton = styled.button`
  justify-self: ${({ $accent }) => ($accent ? 'end' : 'start')};
  padding: 8px 0;
  border: 0;
  background: none;
  color: ${({ $accent }) => ($accent ? 'var(--Accent-Gold)' : 'rgb(242 233 220 / 80%)')};
  font-size: 15px;
  font-weight: ${({ $accent }) => ($accent ? 500 : 400)};
  cursor: pointer;
`

const Shutter = styled.button`
  position: relative;
  width: 72px;
  height: 72px;
  padding: 0;
  border: 2.5px solid rgb(242 233 220 / 85%);
  border-radius: 999px;
  background: none;
  cursor: pointer;

  /* 안쪽 원 58px */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 58px;
    height: 58px;
    border-radius: 999px;
    background: #f2e9dc;
    transform: translate(-50%, -50%);
  }

  &:active::after {
    background: #cdc4b6;
  }

  &:disabled {
    border-color: rgb(242 233 220 / 30%);
    cursor: not-allowed;
  }

  &:disabled::after {
    background: rgb(242 233 220 / 30%);
  }
`

const PreviewLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--Text-Primary);
`

const PreviewClose = styled.button`
  position: absolute;
  top: 0;
  right: 20px;
  z-index: 1;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;

  img {
    width: 40px;
    height: 40px;
    display: block;
  }
`

const PreviewPhoto = styled.img`
  width: 100%;
  margin-top: 59px;
  aspect-ratio: 3 / 4;
  display: block;
  object-fit: cover;
  background: #d5d5d5;
`

const PreviewIndex = styled.p`
  margin-top: 35px;
  display: flex;
  align-items: baseline;
  gap: 7px;
`

const IndexCurrent = styled.span`
  color: #f2e9dc;
  font: var(--text-ui-body-l);
`

const IndexSlash = styled.span`
  color: rgb(242 233 220 / 35%);
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
`

const IndexTotal = styled.span`
  color: rgb(242 233 220 / 60%);
  font: var(--text-ui-body-l);
`

const PreviewActions = styled.div`
  margin-top: 35px;
  display: flex;
  align-items: center;
`

const PreviewDeleteButton = styled.button`
  padding: 13px 22px 13px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgb(242 233 220 / 35%);
  border-radius: 24px;
  background: none;
  color: rgb(242 233 220 / 85%);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  img {
    width: 16px;
    height: 15px;
    display: block;
  }
`
