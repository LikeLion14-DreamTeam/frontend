import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import arrowIcon from '../../assets/story-share/arrow.svg'
import closeIcon from '../../assets/story-share/close.svg'
import downloadIcon from '../../assets/story-share/download.svg'
import shareIcon from '../../assets/story-share/share.svg'
import { getPhotobook } from '../../features/photobooks/photobookApi'
import SnapSheet from '../../components/common/SnapSheet'

const STORY_WIDTH = 1080
const STORY_HEIGHT = 1920
const SHEET_COLLAPSED_OFFSET = 236

/* 도시·국가는 한글로 오는데 Cormorant Garamond 에는 한글 글자가 없어,
   지금까지는 기기 기본 글꼴로 떨어져 그려졌다. 뒤에 서비스 한글 글꼴을
   붙여 두면 글자마다 알아서 갈라져 한글만 이쪽으로 그려진다. */
const SERIF = '"Cormorant Garamond", "Noto Sans KR"'
const SANS = '"Noto Sans KR"'

const templates = [
  { id: 'story2', name: '프린트', count: 3 },
  { id: 'story1', name: '폴라로이드', count: 4 },
  { id: 'story0', name: '커버', count: 1 },
  { id: 'story4', name: '그리드', count: 4 },
  { id: 'story5', name: '쿼드', count: 4 },
  { id: 'story6', name: '프레임', count: 2 },
  { id: 'story7', name: '패스포트', count: 3 },
  { id: 'story8', name: '스트립', count: 4 },
  { id: 'story3', name: '아치', count: 3 },
]

const pad2 = (value) => String(value).padStart(2, '0')

const parseDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value) => {
  const date = parseDate(value)
  return date
    ? `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
    : ''
}

const formatEditorialDate = (value) => {
  const date = parseDate(value)
  if (!date) return ''
  const month = new Intl.DateTimeFormat('en', { month: 'short' })
    .format(date)
    .toUpperCase()
  return `${date.getDate()} ${month} ${date.getFullYear()}`
}

const shuffle = (items) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

const drawCoverImage = (ctx, image, x, y, width, height) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  ctx.drawImage(
    image,
    (image.naturalWidth - sourceWidth) / 2,
    (image.naturalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  )
}

const withShadow = (ctx, callback, blur = 36, y = 16) => {
  ctx.save()
  ctx.shadowColor = 'rgba(20, 15, 10, 0.42)'
  ctx.shadowBlur = blur
  ctx.shadowOffsetY = y
  callback()
  ctx.restore()
}

const drawPolaroid = (ctx, image, x, y, width = 470, height = 666) => {
  withShadow(ctx, () => {
    ctx.fillStyle = '#f7f1e8'
    ctx.fillRect(x, y, width, height)
    drawCoverImage(ctx, image, x + 24, y + 24, width - 48, height - 104)
  })
}

const drawPrint = (ctx, image, x, y, rotation) => {
  const width = 720
  const height = 394
  ctx.save()
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  withShadow(ctx, () => {
    ctx.fillStyle = '#f5efe2'
    ctx.fillRect(-width / 2, -height / 2, width, height)
    drawCoverImage(ctx, image, -width / 2 + 32, -height / 2 + 32, width - 64, height - 64)
  })
  ctx.restore()
}

const fillRoundedRect = (ctx, x, y, width, height, radius, color) => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
}

/* 목록 화면에서 이름이 빈 핀을 이 문구로 채워 보여준다. 화면에서는 자리를
   메우는 값이지만 내보내기 제목으로 크게 박히면 이름처럼 읽혀 걸러낸다. */
const PLACEHOLDER_NAMES = ['이름 없는 장소', '이름 없는 도시']

const withoutPlaceholder = (name) => {
  const trimmed = (name ?? '').trim()
  return PLACEHOLDER_NAMES.includes(trimmed) ? '' : trimmed
}

const setText = (ctx, { color, font, align = 'left', spacing = 0 }) => {
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.letterSpacing = `${spacing}px`
}

const drawTemplate = (canvas, templateId, images, pin) => {
  const ctx = canvas.getContext('2d')
  canvas.width = STORY_WIDTH
  canvas.height = STORY_HEIGHT
  /* 도시명이 없으면 장소명으로 대신한다. 둘 다 없으면 제목 줄을 그리지
     않는다. 없는 지명을 지어내면 다른 곳 이야기가 되어 버린다. */
  const title = (
    withoutPlaceholder(pin.cityName) ||
    withoutPlaceholder(pin.placeName) ||
    ''
  ).toUpperCase()
  /* 6.2 가 도시 묶음에 실어 주는 값. 없으면 국가 줄도 그리지 않는다. */
  const country = (pin.countryName ?? '').trim().toUpperCase()
  const date = formatEditorialDate(pin.recordedAt)

  if (templateId === 'story0') {
    drawCoverImage(ctx, images[0], 0, 0, 1080, 1920)
    const overlay = ctx.createLinearGradient(0, 0, 0, 1920)
    overlay.addColorStop(0, 'rgba(20, 15, 13, 0.5)')
    overlay.addColorStop(0.45, 'rgba(20, 15, 13, 0.12)')
    overlay.addColorStop(1, 'rgba(20, 15, 13, 0.82)')
    ctx.fillStyle = overlay
    ctx.fillRect(0, 0, 1080, 1920)
    ctx.strokeStyle = 'rgba(233, 217, 188, 0.72)'
    ctx.lineWidth = 2
    ctx.strokeRect(56, 278, 968, 1364)
    setText(ctx, { color: '#e9d9bc', font: `600 30px ${SERIF}`, align: 'center', spacing: 8 })
    if (country) ctx.fillText(country, 540, 1154)
    setText(ctx, { color: '#f7f1e8', font: `600 192px ${SERIF}`, align: 'center', spacing: 8 })
    if (title) ctx.fillText(title, 540, 1200)
    ctx.fillStyle = '#c5a15b'
    ctx.fillRect(500, 1452, 80, 2)
    setText(ctx, { color: 'rgba(247,241,232,.72)', font: `400 34px ${SANS}`, align: 'center' })
    ctx.fillText(formatDate(pin.recordedAt), 540, 1494)
    return
  }

  if (templateId === 'story1') {
    ctx.fillStyle = '#1e1613'
    ctx.fillRect(0, 0, 1080, 1920)
    drawPolaroid(ctx, images[0], 48, 428)
    drawPolaroid(ctx, images[1], 560, 120)
    drawPolaroid(ctx, images[2], 48, 1132)
    drawPolaroid(ctx, images[3], 560, 824)
    setText(ctx, { color: '#f7f1e8', font: `600 120px ${SERIF}`, spacing: 2 })
    if (title) ctx.fillText(title, 48, 166)
    setText(ctx, { color: '#f2eee2', font: `600 40px ${SERIF}`, spacing: 8 })
    ctx.fillText(date, 48, 290)
    return
  }

  if (templateId === 'story2') {
    ctx.fillStyle = '#2e3a2e'
    ctx.fillRect(0, 0, 1080, 1920)
    setText(ctx, { color: '#f2eee2', font: `600 124px ${SERIF}`, spacing: 2.5 })
    ctx.fillText('This Journey', 222, 168)
    drawPrint(ctx, images[0], 116, 468, 2.28)
    drawPrint(ctx, images[1], 260, 782, -2.41)
    drawPrint(ctx, images[2], 124, 1142, 1.5)
    ctx.fillStyle = '#151c15'
    ctx.fillRect(0, 1758, 1080, 162)
    setText(ctx, { color: '#f2eee2', font: `600 40px ${SERIF}`, align: 'center', spacing: 8 })
    ctx.fillText(date, 540, 1812)
    return
  }

  if (templateId === 'story3') {
    ctx.fillStyle = '#8e8377'
    ctx.fillRect(0, 0, 1080, 1920)
    fillRoundedRect(ctx, 128, 336, 440, 660, [220, 220, 0, 0], 'rgba(237,228,214,.55)')
    fillRoundedRect(ctx, 536, 524, 416, 640, [208, 208, 0, 0], 'rgba(237,228,214,.4)')
    withShadow(ctx, () => drawCoverImage(ctx, images[0], 516, 428, 400, 534))
    withShadow(ctx, () => drawCoverImage(ctx, images[1], 124, 640, 380, 506))
    withShadow(ctx, () => drawCoverImage(ctx, images[2], 336, 940, 432, 576))
    setText(ctx, { color: '#f7f1e8', font: `600 124px ${SERIF}`, spacing: 2.5 })
    ctx.fillText('Travel', 108, 292)
    ctx.fillText('journey', 176, 412)
    setText(ctx, { color: '#f7f1e8', font: `600 30px ${SERIF}`, align: 'center', spacing: 6.6 })
    ctx.fillText(date, 540, 1564)
    return
  }

  if (templateId === 'story4') {
    ctx.fillStyle = '#f2e9da'
    ctx.fillRect(0, 0, 1080, 1920)
    ;[[86, 434], [550, 434], [86, 1046], [550, 1046]].forEach(([x, y], index) =>
      drawCoverImage(ctx, images[index], x, y, 444, 592),
    )
    setText(ctx, { color: '#b5763b', font: `600 28px ${SERIF}`, align: 'center', spacing: 6.7 })
    ctx.fillText(country ? `${country} · ${date}` : date, 540, 216)
    setText(ctx, { color: '#241c16', font: `600 88px ${SERIF}`, align: 'center', spacing: 8.8 })
    if (title) ctx.fillText(title, 540, 250)
    return
  }

  if (templateId === 'story5') {
    ctx.fillStyle = '#1e1613'
    ctx.fillRect(0, 0, 1080, 1920)
    ;[[0, 216], [554, 216], [0, 942], [554, 942]].forEach(([x, y], index) =>
      drawCoverImage(ctx, images[index], x, y, 526, 700),
    )
    return
  }

  if (templateId === 'story6') {
    drawCoverImage(ctx, images[0], 0, 0, 1080, 1920)
    drawPolaroid(ctx, images[1], 98, 1258, 378, 534)
    return
  }

  if (templateId === 'story7') {
    ctx.fillStyle = '#efe7da'
    ctx.fillRect(0, 0, 1080, 1920)
    ;[[80, 350, 920, 704], [80, 1078, 452, 448], [548, 1078, 452, 448]].forEach(([x, y, width, height], index) => {
      fillRoundedRect(ctx, x, y, width, height, 8, '#fffdf9')
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(x, y, width, height, 8)
      ctx.clip()
      drawCoverImage(ctx, images[index], x, y, width, height)
      ctx.restore()
    })
    setText(ctx, { color: '#b5763b', font: `600 34px ${SERIF}`, align: 'right' })
    ctx.fillText('✦', 1000, 1610)
    return
  }

  ctx.fillStyle = '#1e1613'
  ctx.fillRect(0, 0, 1080, 1920)
  ;[192, 584, 978, 1374].forEach((y, index) =>
    drawCoverImage(ctx, images[index], 102, y, 876, index === 0 || index === 3 ? 356 : 358),
  )
}

const canvasToBlob = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지를 만들지 못했습니다.'))), 'image/png'),
  )

const normalizeLoadedPin = (rawPin) => ({
  id: rawPin.pin_id,
  placeName: rawPin.place_name?.trim() || '이름 없는 장소',
  cityName: rawPin.__cityName?.trim() || '',
  countryName: rawPin.__countryName?.trim() || '',
  recordedAt: rawPin.tagged_at,
  photos: (rawPin.photos ?? [])
    .map((photo) => ({ url: typeof photo === 'string' ? photo : photo.url ?? photo.photo_url ?? photo.file_path }))
    .filter((photo) => Boolean(photo.url)),
})

const PinStoryShare = () => {
  const { tripID, pinID } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const templateListRef = useRef(null)
  const objectUrlRef = useRef('')
  const [pin, setPin] = useState(state?.pin ?? null)
  const [selectedId, setSelectedId] = useState('story0')
  const [photoOrder, setPhotoOrder] = useState([])
  const [previewUrl, setPreviewUrl] = useState('')
  const [thumbnails, setThumbnails] = useState({})
  const [isRendering, setIsRendering] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedIndex = templates.findIndex((template) => template.id === selectedId)
  const selectedTemplate = templates[selectedIndex] ?? templates[2]
  const photos = useMemo(
    () => (pin?.photos ?? []).map((photo) => (typeof photo === 'string' ? photo : photo.url)).filter(Boolean),
    [pin],
  )

  useEffect(() => {
    if (pin) return
    let ignore = false
    getPhotobook(tripID)
      .then((book) => {
        const found = book.cities
          ?.flatMap((city) =>
            (city.pins ?? []).map((item) => ({
              ...item,
              __cityName: city.city,
              __countryName: city.country_name,
            })),
          )
          .find((item) => String(item.pin_id) === String(pinID))
        if (!found) throw new Error('핀을 찾을 수 없습니다.')
        if (!ignore) setPin(normalizeLoadedPin(found))
      })
      .catch((error) => !ignore && setErrorMessage(error.message ?? '핀을 불러오지 못했습니다.'))
    return () => { ignore = true }
  }, [pin, pinID, tripID])

  useEffect(() => {
    if (photos.length) setPhotoOrder(shuffle(photos))
  }, [photos])

  useEffect(() => {
    if (!pin || !photoOrder.length) return
    let ignore = false
    setIsRendering(true)
    setErrorMessage('')
    Promise.all([document.fonts?.ready ?? Promise.resolve(), ...photoOrder.map(loadImage)])
      .then(async ([, ...images]) => {
        if (ignore) return
        drawTemplate(canvasRef.current, selectedId, images.slice(0, selectedTemplate.count), pin)
        const blob = await canvasToBlob(canvasRef.current)
        if (ignore) return
        const nextUrl = URL.createObjectURL(blob)
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = nextUrl
        setPreviewUrl(nextUrl)

        const nextThumbnails = {}
        const thumbnailSource = document.createElement('canvas')
        const thumbnailCanvas = document.createElement('canvas')
        thumbnailCanvas.width = 150
        thumbnailCanvas.height = 267
        const thumbnailContext = thumbnailCanvas.getContext('2d')
        for (const template of templates) {
          const thumbnailImages = Array.from(
            { length: template.count },
            (_, index) => images[index % images.length],
          )
          drawTemplate(thumbnailSource, template.id, thumbnailImages, pin)
          thumbnailContext.clearRect(0, 0, 150, 267)
          thumbnailContext.drawImage(thumbnailSource, 0, 0, 150, 267)
          nextThumbnails[template.id] = thumbnailCanvas.toDataURL('image/jpeg', 0.72)
        }
        if (ignore) return
        setThumbnails(nextThumbnails)
      })
      .catch(() => !ignore && setErrorMessage('사진을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'))
      .finally(() => !ignore && setIsRendering(false))
    return () => { ignore = true }
  }, [photoOrder, pin, selectedId, selectedTemplate.count])

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const selectTemplate = (template) => {
    if (template.count > photos.length || template.id === selectedId) return
    setSelectedId(template.id)
    setPhotoOrder(shuffle(photos))
  }

  const moveTemplate = (direction) => {
    let nextIndex = selectedIndex + direction
    while (nextIndex >= 0 && nextIndex < templates.length && templates[nextIndex].count > photos.length) {
      nextIndex += direction
    }
    if (nextIndex < 0 || nextIndex >= templates.length) return
    selectTemplate(templates[nextIndex])
    const list = templateListRef.current
    const item = list?.children[nextIndex]
    if (list && item) {
      list.scrollTo({
        left: item.offsetLeft - list.clientWidth / 2 + item.clientWidth / 2,
        behavior: 'smooth',
      })
    }
  }

  const saveImage = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `${pin?.placeName || 'pin'}-story.png`
    link.click()
  }

  const shareStory = async () => {
    if (!previewUrl) return
    try {
      const blob = await fetch(previewUrl).then((response) => response.blob())
      const file = new File([blob], `${pin?.placeName || 'pin'}-story.png`, { type: 'image/png' })
      if (!navigator.canShare?.({ files: [file] })) {
        saveImage()
        setErrorMessage('공유를 지원하지 않는 브라우저라 이미지를 저장했습니다.')
        return
      }
      await navigator.share({ files: [file], title: '스토리로 공유' })
    } catch (error) {
      if (error.name !== 'AbortError') setErrorMessage('공유 화면을 열지 못했습니다.')
    }
  }

  const canMovePrevious = templates.slice(0, selectedIndex).some((template) => template.count <= photos.length)
  const canMoveNext = templates.slice(selectedIndex + 1).some((template) => template.count <= photos.length)

  return (
    <Page>
      <TopBar>
        <CloseButton type="button" onClick={() => navigate(-1)} aria-label="내보내기 닫기">
          <img src={closeIcon} alt="" />
        </CloseButton>
        <Title>이 핀 내보내기</Title>
        <ShareButton type="button" onClick={shareStory} disabled={!previewUrl || isRendering} aria-label="스토리로 공유">
          <img src={shareIcon} alt="" />
        </ShareButton>
      </TopBar>

      <PreviewStage>
        <ArrowButton type="button" $side="left" disabled={!canMovePrevious} onClick={() => moveTemplate(-1)} aria-label="이전 템플릿"><img src={arrowIcon} alt="" /></ArrowButton>
        <PreviewFrame $loading={isRendering}>
          {previewUrl ? <PreviewImage src={previewUrl} alt={`${selectedTemplate.name} 스토리 미리보기`} crossOrigin="anonymous" /> : <PreviewState>{errorMessage || '불러오는 중...'}</PreviewState>}
        </PreviewFrame>
        <ArrowButton type="button" $side="right" disabled={!canMoveNext} onClick={() => moveTemplate(1)} aria-label="다음 템플릿"><img src={arrowIcon} alt="" /></ArrowButton>
        <canvas ref={canvasRef} hidden />
      </PreviewStage>

      <TemplateSheet
        ariaLabel="템플릿 선택창"
        centered
        collapsedOffset={SHEET_COLLAPSED_OFFSET}
        height={310}
        snapThreshold={72}
        title="템플릿 선택"
      >
          <TemplateScroller ref={templateListRef}>
            {templates.map((template) => {
              const disabled = template.count > photos.length
              return (
                <TemplateButton
                  key={template.id}
                  type="button"
                  $selected={template.id === selectedId}
                  disabled={disabled}
                  onClick={() => selectTemplate(template)}
                  aria-label={`${template.name} 템플릿${disabled ? `, 사진 ${template.count}장 필요` : ''}`}
                >
                  {thumbnails[template.id] ? <Thumbnail src={thumbnails[template.id]} alt="" crossOrigin="anonymous" /> : <ThumbnailSkeleton />}
                  {disabled ? <DisabledOverlay /> : null}
                </TemplateButton>
              )
            })}
          </TemplateScroller>
          <SaveButton type="button" onClick={saveImage} disabled={!previewUrl || isRendering}>
            <DownloadIcon src={downloadIcon} alt="" />
            이 장만 이미지로 저장
          </SaveButton>
          {errorMessage ? <Notice role="alert">{errorMessage}</Notice> : null}
      </TemplateSheet>
    </Page>
  )
}

export default PinStoryShare

const Page = styled.main`
  width: 100%;
  height: var(--app-viewport-height);
  min-height: 720px;
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--Text-Primary);
  color: var(--Text-Inverse);
`

const TopBar = styled.header`
  width: min(100%, 402px);
  height: 112px;
  margin: 0 auto;
  padding: 54px 24px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 3;
`

const Title = styled.h1`
  font: var(--text-ui-h3);
  font-weight: 500;
`

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  img { width: 40px; height: 40px; display: block; }
`

const ShareButton = styled.button`
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  img { width: 40px; height: 40px; display: block; }
  &:disabled { opacity: 0.4; cursor: default; }
`

const PreviewStage = styled.section`
  width: min(100%, 402px);
  height: 514px;
  margin: 0 auto;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 24px;

  @media (max-height: 820px) {
    transform: scale(0.88);
    transform-origin: top center;
  }
`

const PreviewFrame = styled.div`
  width: 276px;
  height: 491px;
  border-radius: 20px;
  overflow: hidden;
  background: #1e1613;
  box-shadow: var(--Effect-Card);
  opacity: ${({ $loading }) => ($loading ? 0.72 : 1)};
  transition: opacity 160ms ease;
`

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const PreviewState = styled.p`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  color: var(--Secondary-Taupe);
  font: var(--text-ui-body-m);
  text-align: center;
`

const ArrowButton = styled.button`
  width: 48px;
  height: 64px;
  position: absolute;
  top: 226px;
  ${({ $side }) => ($side === 'left' ? 'left: 0;' : 'right: 0;')}
  z-index: 2;
  padding: 0 0 6px;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 14px;
    height: 25px;
    display: block;
    margin: auto;
    ${({ $side }) => $side === 'right' && 'transform: rotate(180deg);'}
  }

  &:disabled { opacity: 0.2; cursor: default; }
`

/* 402 로 묶어 두면 그보다 넓은 기기에서 좌우가 뜬다. 시트는 화면 아래에
   붙는 것이라 가장자리까지 닿아야 해서 앱 공통 상한(450)까지 늘린다. */
const TemplateSheet = styled(SnapSheet)`
  width: min(100%, 450px);
  left: 50%;
  z-index: 4;
  padding: 0 0 20px;
  background: var(--Background-Paper);
  color: var(--Text-Primary);
`

const TemplateScroller = styled.div`
  height: 144px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 24px 12px;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;

  &::-webkit-scrollbar { display: none; }
`

const TemplateButton = styled.button`
  width: 75px;
  height: 132px;
  flex: 0 0 75px;
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: #1e1613;
  cursor: pointer;
  scroll-snap-align: center;
  ${({ $selected }) => $selected && css`
    outline: 3px solid var(--Accent-Gold);
    outline-offset: -3px;
  `}

  &:disabled { cursor: not-allowed; }
`

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const ThumbnailSkeleton = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #695e54, #30251d);
`

const DisabledOverlay = styled.span`
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 50%);
`

const SaveButton = styled.button`
  width: calc(100% - 48px);
  height: 54px;
  margin: 3px 24px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 11px;
  border: 0;
  border-radius: 27px;
  background: transparent;
  color: var(--Text-Secondary);
  font: var(--text-ui-button);
  cursor: pointer;

  &:disabled { opacity: 0.45; cursor: default; }
`

const DownloadIcon = styled.img`
  width: 20px;
  height: 19px;
  display: block;
`

const Notice = styled.p`
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 6px;
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  text-align: center;
`
