import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import exifr from 'exifr'
import Tile from '../../components/common/Tile'
import backIcon from '../../assets/icons/Back.svg'
import { uploadPhoto } from '../../api/uploads'
import {
  addPinPhotos,
  deletePhoto,
  getPin,
  getPinPhotos,
} from '../../features/pins/pinApi'

const REJECT_REASONS = {
  OUT_OF_RADIUS: '1km 밖에서 촬영됨',
  MISSING_COORDINATES: '위치 정보 없음',
}

/**
 * 갤러리 사진의 촬영 좌표·시각을 EXIF 에서 읽는다.
 *
 * 공유·메신저를 거친 사진은 위치 정보가 지워진 경우가 많다. 그런 사진은
 * 좌표 없이 보내고 서버가 MISSING_COORDINATES 로 걸러낸다.
 */
const readPhotoMeta = async (file) => {
  const [gps, exif] = await Promise.all([
    exifr.gps(file).catch(() => null),
    exifr.parse(file, ['DateTimeOriginal']).catch(() => null),
  ])

  const capturedAt = exif?.DateTimeOriginal ?? new Date(file.lastModified)

  return {
    latitude: gps?.latitude ?? null,
    longitude: gps?.longitude ?? null,
    captured_at: capturedAt.toISOString(),
  }
}

// 핀 상세를 거치지 않고 들어왔을 때를 위한 기본값.
const FALLBACK_PIN_ID = 101

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const formatDate = (isoString) =>
  isoString ? dateFormatter.format(new Date(isoString)).replace(/\.$/, '') : ''

const formatTime = (isoString) =>
  isoString ? timeFormatter.format(new Date(isoString)) : ''

const AllPhotos = () => {
  const navigate = useNavigate()
  const { pinID = FALLBACK_PIN_ID } = useParams()

  const [pin, setPin] = useState(null)
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [addResult, setAddResult] = useState(null)
  const [addError, setAddError] = useState('')

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [pinData, photoList] = await Promise.all([
          getPin(pinID),
          getPinPhotos(pinID),
        ])

        if (ignore) return

        setPin(pinData)
        setPhotos(photoList.photos)
      } catch (error) {
        if (!ignore) setErrorMessage(error.message)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [pinID])

  const title = pin?.place_name || pin?.address || '이름 없는 장소'
  // 5.5: 이미 종료된 여행의 핀에는 사진을 추가할 수 없다.
  const canAddPhotos = pin?.segment_id === null

  const exitSelectMode = () => {
    setIsSelectMode(false)
    setSelectedIds([])
    setIsConfirmingDelete(false)
  }

  const toggleSelected = (photoId) => {
    setSelectedIds((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId],
    )
  }

  const handleDeleteSelected = async () => {
    setIsDeleting(true)
    setAddError('')

    try {
      // 5.7 은 사진 하나씩 지운다. 선택한 만큼 순서대로 호출한다.
      for (const photoId of selectedIds) {
        await deletePhoto(photoId)
      }

      const photoList = await getPinPhotos(pinID)
      setPhotos(photoList.photos)
      exitSelectMode()
    } catch (error) {
      setAddError(error.message)
      setIsConfirmingDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) return

    setIsUploading(true)
    setAddError('')
    setAddResult(null)

    try {
      // 파일마다 사전 서명 URL 을 받아 올리고, EXIF 에서 좌표·시각을 읽어 붙인다.
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const [fileId, meta] = await Promise.all([
            uploadPhoto(file),
            readPhotoMeta(file),
          ])

          return { file_id: fileId, ...meta }
        }),
      )

      const result = await addPinPhotos(pinID, uploaded)
      setAddResult(result)

      const photoList = await getPinPhotos(pinID)
      setPhotos(photoList.photos)
    } catch (error) {
      setAddError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Page>
      <Toolbar>
        <BackButton
          type="button"
          aria-label="핀 상세로 돌아가기"
          onClick={() => navigate(-1)}
        >
          <img src={backIcon} alt="" />
        </BackButton>

        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
        />

        <ToolbarActions>
          {isSelectMode ? (
            <ToolbarButton type="button" onClick={exitSelectMode}>
              취소
            </ToolbarButton>
          ) : (
            <>
              <ToolbarButton
                type="button"
                onClick={() => setIsSelectMode(true)}
                disabled={photos.length === 0}
              >
                선택
              </ToolbarButton>

              <AddNearbyButton
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAddPhotos || isUploading}
                aria-label={
                  canAddPhotos
                    ? '주변 사진 추가'
                    : '종료된 여행의 핀에는 사진을 추가할 수 없습니다'
                }
              >
                {isUploading ? '추가 중...' : '주변 사진 추가'}
              </AddNearbyButton>
            </>
          )}
        </ToolbarActions>
      </Toolbar>

      <Heading>
        <Title>이 장소의 사진</Title>
        {pin && (
          <Meta>
            {title} · {formatDate(pin.tagged_at)} · {photos.length}장
          </Meta>
        )}
      </Heading>

      {addError && <StateMessage role="alert">{addError}</StateMessage>}

      {addResult && (
        <AddResult role="status">
          {addResult.added.length > 0 && (
            <ResultLine>사진 {addResult.added.length}장을 추가했어요.</ResultLine>
          )}
          {addResult.rejected.length > 0 && (
            <ResultLine>
              {addResult.rejected.length}장은 추가하지 못했어요 ·{' '}
              {[
                ...new Set(
                  addResult.rejected.map(
                    ({ reason }) => REJECT_REASONS[reason] ?? reason,
                  ),
                ),
              ].join(', ')}
            </ResultLine>
          )}
        </AddResult>
      )}

      {isLoading && <StateMessage>불러오는 중...</StateMessage>}

      {!isLoading && errorMessage && (
        <StateMessage role="alert">{errorMessage}</StateMessage>
      )}

      {!isLoading && !errorMessage && photos.length === 0 && (
        <StateMessage>아직 사진이 없습니다.</StateMessage>
      )}

      {/* 명세 0-1 에 따라 태깅 세션 개념이 없어 한 핀의 사진이 하나의 묶음이다.
          기능명세 5.3 은 세션별로 나눠 보여주지만 응답에 세션 정보가 없다. */}
      {!isLoading && !errorMessage && photos.length > 0 && (
        <PhotoGroups>
          <PhotoGroup>
            <GroupHeading>
              <Time>{formatTime(photos[0].captured_at)}</Time>
              <Rule />
              <Count>{photos.length}장</Count>
            </GroupHeading>

            <PhotoStrip
              role="region"
              aria-roledescription="carousel"
              aria-label={`사진 ${photos.length}장`}
            >
              {photos.map((photo, index) => (
                <PhotoTile
                  key={photo.photo_id}
                  interactive={isSelectMode}
                  selected={selectedIds.includes(photo.photo_id)}
                  onClick={
                    isSelectMode
                      ? () => toggleSelected(photo.photo_id)
                      : undefined
                  }
                  src={photo.file_path}
                  alt={`${index + 1}번째 사진`}
                  aria-posinset={index + 1}
                  aria-setsize={photos.length}
                />
              ))}
            </PhotoStrip>
          </PhotoGroup>
        </PhotoGroups>
      )}

      {isSelectMode && (
        <SelectionBar>
          <SelectionCount>{selectedIds.length}장 선택됨</SelectionCount>

          {isConfirmingDelete ? (
            <>
              {/* 대표사진이 지워지면 서버가 남은 사진에서 대체 1장을 채운다. */}
              <ConfirmText>
                선택한 사진을 삭제할까요? 되돌릴 수 없고, 대표사진이 포함돼
                있으면 추천이 다시 계산됩니다.
              </ConfirmText>
              <DeleteButton
                type="button"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </DeleteButton>
            </>
          ) : (
            <DeleteButton
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={selectedIds.length === 0}
            >
              삭제
            </DeleteButton>
          )}
        </SelectionBar>
      )}
    </Page>
  )
}

export default AllPhotos

const Page = styled.main`
  width: 100%;
  max-width: 402px;
  height: var(--app-viewport-height);
  margin: 0 auto;
  padding: 58px 24px 40px;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--Background-Base);
  color: var(--Text-Primary);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

const Toolbar = styled.header`
  position: relative;
  width: 354px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`

const BackButton = styled.button`
  position: absolute;
  top: 0;
  left: -14px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 9px;
    height: 16px;
    display: block;
  }
`

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const ToolbarButton = styled.button`
  height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Text-Secondary);
  font: var(--text-ui-button);
  cursor: pointer;

  &:disabled {
    color: var(--State-Disabled-Text);
    cursor: not-allowed;
  }
`

const AddNearbyButton = styled.button`
  height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-button);
  cursor: pointer;

  &:disabled {
    color: var(--State-Disabled-Text);
    cursor: not-allowed;
  }
`

const Heading = styled.div`
  width: 354px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Title = styled.h1`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
`

const Meta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  white-space: nowrap;
`

const PhotoGroups = styled.div`
  width: 354px;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 30px;
`

const PhotoGroup = styled.section`
  width: 354px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const GroupHeading = styled.div`
  width: 354px;
  height: 18px;
  display: flex;
  align-items: center;
  gap: 11px;
`

const Time = styled.h2`
  width: 70px;
  flex: 0 0 auto;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const Rule = styled.span`
  height: 1px;
  flex: 1;
  background: var(--Border-Default);
`

const Count = styled.span`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-label);
  white-space: nowrap;
`

/* 첫 장과 마지막 장은 본문 여백(24)에 맞춰 서지만, 넘기는 동안에는 화면 좌우
   끝까지 흘러가며 잘린다. 페이지의 좌우 여백을 음수 마진으로 상쇄하고 같은 값을
   스크롤 영역 안쪽에 준다.
   scroll-padding 이 없으면 스냅이 첫 장을 화면 끝(0)으로 당겨버린다. */
const PhotoStrip = styled.div`
  width: 100vw;
  max-width: 402px;
  margin: 0 -24px;
  padding: 0 24px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scroll-padding-left: 24px;
  scrollbar-width: none;
  touch-action: pan-x;

  &::-webkit-scrollbar {
    display: none;
  }
`

const PhotoTile = styled(Tile)`
  width: 111.333px;
  flex: 0 0 auto;
  scroll-snap-align: start;
  scroll-snap-stop: always;
`

const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`

const AddResult = styled.div`
  margin: 0 24px 12px 0;
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--Surface-Base);
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ResultLine = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const SelectionBar = styled.div`
  position: sticky;
  bottom: 0;
  width: 354px;
  margin-top: 30px;
  border: 1px solid var(--Primary-Cognac);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgb(181 118 59 / 9%);
`

const SelectionCount = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const ConfirmText = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  word-break: keep-all;
`

const DeleteButton = styled.button`
  min-height: 44px;
  border: 0;
  border-radius: 22px;
  background: var(--Primary-Cognac);
  color: var(--Text-Inverse);
  font: var(--text-ui-button);
  cursor: pointer;

  &:disabled {
    background: var(--State-Disabled-Fill);
    color: var(--State-Disabled-Text);
    cursor: not-allowed;
  }
`

const StateMessage = styled.p`
  padding: 40px 24px 40px 0;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  word-break: keep-all;
`
