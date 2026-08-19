import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { createGlobalStyle } from 'styled-components'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import { MAX_PIN_PHOTOS } from '../../features/pins/photoUploadQueue'
import PhotoPreviewOverlay, {
  PreviewDeleteButton,
} from '../../components/common/PhotoPreviewOverlay'
import cameraFlipIcon from '../../assets/icons/camera-flip.svg'
import { linkProduct } from '../../features/products/productApi'
import useRecordDraftStore from '../../features/pins/useRecordDraftStore'
import {
  forgetRememberedPermissionGrant,
  rememberPermissionGranted,
} from '../../features/permissions/devicePermissions'

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
  width: { ideal: 1920 },
  height: { ideal: 1080 },
}

const BACK_CAMERA = 'environment'
const FRONT_CAMERA = 'user'

const JPEG_QUALITY = 0.92

/* 배율 버튼에 올릴 값. 기기가 지원하는 범위 안의 것만 쓴다.
   0.5 는 후면 광각을 여는 기기에서만 나타난다. */
const ZOOM_STEPS = [0.5, 1, 2]

/* 손짓으로 당길 수 있는 상한. 기기는 더 열어 주기도 하지만 그 위로는 센서에서
   잘라낸 영역이 너무 작아져 알아보기 어렵다. */
const MAX_ZOOM = 9

/** `1x`, `2.4x` 처럼 다듬는다. 소수 첫째 자리까지만 본다. */
const formatZoom = (value) => `${Number(value.toFixed(1))}x`

// 저장 비율 3:4 고정. 뷰파인더도 같은 비율이라 보이는 그대로 찍힌다.
const CAPTURE_RATIO = 3 / 4

// 개발 모드의 StrictMode 재마운트에서도 같은 NFC 연결 요청을 중복 호출하지 않는다.
const requestedTagLinks = new Set()

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
  const [searchParams] = useSearchParams()
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const storedPhotos = useRecordDraftStore((draft) => draft.photos)
  const hasResolvedLocation = useRecordDraftStore(
    (draft) => draft.hasResolvedLocation,
  )
  const setTagId = useRecordDraftStore((draft) => draft.setTagId)
  const setPhotos = useRecordDraftStore((draft) => draft.setPhotos)
  const setCoordinates = useRecordDraftStore((draft) => draft.setCoordinates)
  const clearCoordinates = useRecordDraftStore(
    (draft) => draft.clearCoordinates,
  )
  const clearDraft = useRecordDraftStore((draft) => draft.clearDraft)

  const queryTagId = (
    searchParams.get('tagId') ??
    searchParams.get('tag_id') ??
    ''
  ).trim()

  const [shots, setShots] = useState(() => storedPhotos)
  const [previewId, setPreviewId] = useState(null)
  const [status, setStatus] = useState('starting')
  const [errorMessage, setErrorMessage] = useState('')
  const [facingMode, setFacingMode] = useState(BACK_CAMERA)
  /* 기기가 배율을 지원할 때만 채워진다. 못 하면 버튼도 손짓도 없다. */
  const [zoomSteps, setZoomSteps] = useState([])
  const [zoom, setZoom] = useState(1)
  /** 지금 카메라가 받아주는 범위. 상한은 `MAX_ZOOM` 으로 한 번 더 누른다. */
  const zoomRangeRef = useRef(null)
  const zoomRef = useRef(1)
  const pinchRef = useRef(null)
  const zoomFrameRef = useRef(0)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)
  /** 빠르게 여러 번 전환했을 때 늦게 도착한 스트림을 버리기 위한 표식 */
  const streamRequestRef = useRef(0)

  const isFrontCamera = facingMode === FRONT_CAMERA

  const previewIndex = shots.findIndex((shot) => shot.id === previewId)
  const previewShot = previewIndex === -1 ? null : shots[previewIndex]

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    const requestId = streamRequestRef.current + 1
    streamRequestRef.current = requestId

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
        video: { ...VIDEO_CONSTRAINTS, facingMode: { ideal: facingMode } },
        audio: false,
      })

      rememberPermissionGranted('camera')

      // 여는 사이에 카메라를 또 바꿨으면 방금 연 것은 버린다.
      if (requestId !== streamRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream

      /*
       * 배율은 기기가 처리한다. 잘라 쓰는 게 아니라 렌즈를 바꾸거나 센서 단계에서
       * 당기므로 화질이 그대로다. 카메라마다 지원 범위가 달라 열 때마다 다시 본다.
       */
      const [videoTrack] = stream.getVideoTracks()
      const zoomRange = videoTrack?.getCapabilities?.().zoom

      const range = zoomRange
        ? { min: zoomRange.min, max: Math.min(zoomRange.max, MAX_ZOOM) }
        : null

      zoomRangeRef.current = range
      zoomRef.current = 1
      setZoom(1)
      setZoomSteps(
        range
          ? ZOOM_STEPS.filter(
              (step) => step >= range.min && step <= range.max,
            )
          : [],
      )

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setStatus('ready')
    } catch (error) {
      if (requestId !== streamRequestRef.current) return

      setStatus('error')

      if (error.name === 'NotAllowedError') {
        forgetRememberedPermissionGrant('camera')
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
  }, [facingMode])

  /* 카메라를 바꾸면 정리 후 다시 열린다. 둘을 동시에 열어두지 않는다. */
  useEffect(() => {
    startCamera()

    return () => {
      stopStream()
    }
  }, [startCamera, stopStream])

  useEffect(() => {
    const tagId = queryTagId || null
    setTagId(tagId)

    if (!tagId || requestedTagLinks.has(tagId)) return

    requestedTagLinks.add(tagId)
    void linkProduct(tagId)
      .catch(() => {
        // 자동 등록 실패는 촬영을 막지 않는다.
      })
      .finally(() => {
        // StrictMode의 같은 순간 중복만 막고, 다음 태깅에서는 실패 여부와 관계없이
        // 다시 서버 상태를 확인할 수 있게 요청 표시를 해제한다.
        requestedTagLinks.delete(tagId)
      })
  }, [queryTagId, setTagId])

  /* 좌표를 못 받으면 표시를 세우지 않아, 촬영 화면에 다시 들어올 때마다
     새로 물어본다. 실내에서 실패한 뒤 밖에 나가 이어 찍는 경우가 있다. */
  useEffect(() => {
    if (hasResolvedLocation) return

    if (!navigator.geolocation) {
      clearCoordinates()
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      },
      // 촬영은 계속할 수 있다. 저장 화면에서 위치를 다시 찾으면 된다.
      () => clearCoordinates(),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }, [clearCoordinates, hasResolvedLocation, setCoordinates])

  /**
   * 배율을 기기에 넘긴다.
   *
   * 핀치는 손가락이 움직이는 내내 불리므로 실제 요청은 한 프레임에 한 번만
   * 보낸다. 매번 보내면 카메라가 따라오지 못해 화면이 끊긴다.
   */
  const applyZoom = useCallback((value) => {
    const range = zoomRangeRef.current
    if (!range) return

    const next = Math.min(range.max, Math.max(range.min, value))

    zoomRef.current = next
    setZoom(next)

    if (zoomFrameRef.current) return

    zoomFrameRef.current = requestAnimationFrame(() => {
      zoomFrameRef.current = 0

      const [track] = streamRef.current?.getVideoTracks() ?? []
      if (!track) return

      // 못 바꿔도 촬영은 그대로 할 수 있다.
      track
        .applyConstraints({ advanced: [{ zoom: zoomRef.current }] })
        .catch(() => {})
    })
  }, [])

  /* 손가락 두 개 사이 거리. 벌리면 커지고 오므리면 작아진다. */
  const touchGap = (touches) =>
    Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    )

  const handlePinchStart = (event) => {
    if (event.touches.length !== 2 || !zoomRangeRef.current) return

    pinchRef.current = {
      gap: touchGap(event.touches),
      startZoom: zoomRef.current,
    }
  }

  const handlePinchMove = (event) => {
    const pinch = pinchRef.current
    if (!pinch || event.touches.length !== 2) return

    const gap = touchGap(event.touches)
    if (!gap) return

    applyZoom(pinch.startZoom * (gap / pinch.gap))
  }

  const handlePinchEnd = () => {
    pinchRef.current = null
  }

  /* 켜진 것으로 볼 단계. 지금 배율보다 크지 않은 것 중 가장 큰 값이다. */
  const activeZoomStep = zoomSteps.reduce(
    (best, step) => (step <= zoom + 0.001 ? step : best),
    zoomSteps[0],
  )

  const handleFlipCamera = () => {
    setFacingMode((current) =>
      current === BACK_CAMERA ? FRONT_CAMERA : BACK_CAMERA,
    )
  }

  const handleShutter = () => {
    const video = videoRef.current
    if (!video || status !== 'ready' || shots.length >= MAX_PIN_PHOTOS) return

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

        setShots((prev) => {
          if (prev.length >= MAX_PIN_PHOTOS) return prev

          return [
            ...prev,
            {
              id: crypto.randomUUID?.() ?? `${Date.now()}-${blob.size}`,
              url: URL.createObjectURL(blob),
              file: new File([blob], `orte-${Date.now()}.jpg`, {
                type: blob.type,
                lastModified: Date.now(),
              }),
              capturedAt: new Date().toISOString(),
            },
          ]
        })
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

  const discardAndLeave = () => {
    setIsConfirmingClose(false)
    stopStream()
    clearDraft()
    shots.forEach((shot) => URL.revokeObjectURL(shot.url))
    navigate('/', { replace: true })
  }

  /* 찍은 사진이 있으면 한 번 묻는다. 브라우저 기본 확인창(`window.confirm`)은
     기기·상황에 따라 뜨지 않는 일이 있어 앱 안의 확인 시트를 쓴다. */
  const handleClose = () => {
    if (shots.length === 0) {
      discardAndLeave()
      return
    }

    setIsConfirmingClose(true)
  }

  const handleDone = () => {
    if (shots.length === 0) return

    stopStream()
    setPhotos(shots)
    navigate('/record/pin-saved')
  }

  return (
    <CaptureShell>
      <DarkSafeArea />

      <ViewfinderArea>
        <ViewfinderSpacer aria-hidden="true" />

        <Viewfinder
          onTouchStart={handlePinchStart}
          onTouchMove={handlePinchMove}
          onTouchEnd={handlePinchEnd}
          onTouchCancel={handlePinchEnd}
        >
          <Preview
            ref={videoRef}
            $mirrored={isFrontCamera}
            playsInline
            muted
            autoPlay
          />
          <ViewfinderTint aria-hidden="true" />
          <GridLine $vertical style={{ left: '33.333%' }} aria-hidden="true" />
          <GridLine $vertical style={{ left: '66.666%' }} aria-hidden="true" />
          <GridLine style={{ top: '33.333%' }} aria-hidden="true" />
          <GridLine style={{ top: '66.666%' }} aria-hidden="true" />

          {zoomSteps.length > 1 && (
            <ZoomBar role="group" aria-label="배율">
              {zoomSteps.map((step) => {
                /* 지금 배율 이하의 가장 큰 단계가 켜진다. 손짓으로 2.4배가 되면
                   2x 버튼이 켜지고 글자가 그 값으로 바뀐다. */
                const isActive = step === activeZoomStep

                return (
                  <ZoomButton
                    key={step}
                    type="button"
                    $active={isActive}
                    aria-pressed={isActive}
                    aria-label={`${step}배`}
                    onClick={() => applyZoom(step)}
                  >
                    {isActive ? formatZoom(zoom) : formatZoom(step)}
                  </ZoomButton>
                )
              })}
            </ZoomBar>
          )}

          <FlipButton
            type="button"
            aria-label={
              isFrontCamera ? '후면 카메라로 전환' : '전면 카메라로 전환'
            }
            onClick={handleFlipCamera}
            disabled={status === 'starting'}
          >
            <FlipIcon src={cameraFlipIcon} alt="" aria-hidden="true" />
          </FlipButton>
        </Viewfinder>

        <PhotoLimitSlot>
          <PhotoLimitStatus role="status">
            사진 {shots.length}/{MAX_PIN_PHOTOS}장
            {shots.length < MAX_PIN_PHOTOS
              ? ` · ${MAX_PIN_PHOTOS - shots.length}장 더 촬영할 수 있어요`
              : ' · 최대 사진 수에 도달했어요'}
          </PhotoLimitStatus>
        </PhotoLimitSlot>

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
          <TextButton type="button" onClick={handleClose}>
            닫기
          </TextButton>

          <Shutter
            type="button"
            aria-label="촬영"
            onClick={handleShutter}
            disabled={status !== 'ready' || shots.length >= MAX_PIN_PHOTOS}
          />

          <TextButton
            type="button"
            $accent
            onClick={handleDone}
            disabled={shots.length === 0}
          >
            완료
          </TextButton>
        </ControlRow>
      </BottomPanel>

      {previewShot && (
        <PhotoPreviewOverlay
          photos={shots}
          index={previewIndex}
          onIndexChange={(nextIndex) => setPreviewId(shots[nextIndex].id)}
          onClose={() => setPreviewId(null)}
        >
          <PreviewDeleteButton onClick={handleRemovePreview} />
        </PhotoPreviewOverlay>
      )}
      <ConfirmationModal
        open={isConfirmingClose}
        title="촬영을 그만둘까요?"
        confirmLabel="사진 지우고 나가기"
        onConfirm={discardAndLeave}
        onCancel={() => setIsConfirmingClose(false)}
      >
        <CloseWarning>
          지금까지 찍은 {shots.length}장이 모두 사라져요. 되돌릴 수 없습니다.
        </CloseWarning>
      </ConfirmationModal>
    </CaptureShell>
  )
}

export default MultiCapture

/* 하단 패널의 확정 높이. 뷰파인더가 남은 공간을 채우므로 구성을 바꾸면 함께 고친다.
   66(썸네일) + 15(간격) + 72(컨트롤) + 20(아래 여백)
   시안은 45 지만 화면이 짧을 때 뷰파인더가 너무 줄어 조금 좁혔다. */
const BOTTOM_PANEL_HEIGHT = '173px'

/* 뷰파인더와 썸네일 사이의 최소 간격. 남는 높이가 있으면 위아래로 나뉘어
   이보다 벌어지고, 화면이 짧으면 뷰파인더가 줄어 이 간격을 지킨다.
   장수 문구가 이 사이 공간의 한가운데에 놓인다. 시안은 39. */
const VIEWFINDER_GAP = '15px'

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
  display: flex;
  flex-direction: column;
  align-items: center;
`

/* 뷰파인더 위쪽 몫. 아래 문구 자리와 같은 비율로 늘어나 뷰파인더가 가운데 온다. */
const ViewfinderSpacer = styled.div`
  flex: 1 1 0;
  min-height: 0;
`

/* 뷰파인더와 썸네일 사이를 통째로 차지해, 그 한가운데에 문구를 둔다.
   위쪽 몫과 같은 비율로 늘어나되 최소 간격만큼을 더 갖는다. 그래서 남는
   높이가 얼마든 문구는 늘 두 영역 사이 정중앙에 온다. */
const PhotoLimitSlot = styled.div`
  flex: 1 0 ${VIEWFINDER_GAP};
  align-self: stretch;
  display: flex;
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
  /* 두 손가락 손짓을 브라우저에 넘기지 않는다. 넘기면 화면 자체가 확대된다. */
  touch-action: none;
  /* 시안의 빈 뷰파인더 색은 #9c9c9c 지만, 폭이 소수점이라 영상이 채우고 남은
     0.x px 이 밝은 테두리처럼 보인다. 화면 배경색과 맞춰 눈에 띄지 않게 한다. */
  background: var(--Text-Primary);
`

/*
 * 전면 카메라는 거울처럼 좌우를 뒤집어 보여준다. 그래야 손을 드는 방향이 맞다.
 * 저장되는 사진은 뒤집지 않는다(애플 기본 카메라와 같다).
 */
const Preview = styled.video`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transform: ${({ $mirrored }) => ($mirrored ? 'scaleX(-1)' : 'none')};
`

const ViewfinderTint = styled.div`
  position: absolute;
  inset: 0;
  background: rgb(20 17 16 / 12%);
`

/* 뷰파인더 왼쪽 아래. 전환 버튼이 오른쪽 아래라 좌우로 나뉜다.
   큰 배율이 위로 오도록 세로로 세운다. */
/* 뷰파인더 아래쪽 가운데. 오른쪽 아래 전환 버튼과는 겹치지 않는 폭이다. */
const ZoomBar = styled.div`
  position: absolute;
  z-index: 4;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px;
  display: flex;
  gap: 4px;
  border-radius: 22px;
  background: rgb(0 0 0 / 40%);
`

/* `2.4x` 까지 들어갈 만한 원으로 크기를 고정한다. 글자에 맞춰 늘리면 소수점이
   붙고 떨어질 때마다 버튼이 커졌다 작아지며 줄 전체가 흔들린다. */
const ZoomButton = styled.button`
  width: 36px;
  height: 36px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? 'rgb(255 255 255 / 92%)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--Text-Primary)' : '#fff')};
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
`

const CloseWarning = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
`

const GridLine = styled.span`
  position: absolute;
  background: rgb(255 255 255 / 14%);
  ${({ $vertical }) =>
    $vertical
      ? 'top: 0; bottom: 0; width: 1px;'
      : 'left: 0; right: 0; height: 1px;'}
`

const FlipButton = styled.button`
  position: absolute;
  z-index: 1;
  right: 8px;
  bottom: 8px;
  width: 40px;
  height: 40px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgb(36 28 22 / 60%);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const FlipIcon = styled.img`
  width: 22px;
  height: 22px;
  display: block;
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
  padding: 0 24px calc(20px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
`

const PhotoLimitStatus = styled.p`
  margin: 0;
  color: var(--Surface-Base);
  font: var(--text-ui-caption);
  text-align: center;
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
  margin-top: 15px;
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

