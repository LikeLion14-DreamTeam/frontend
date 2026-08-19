import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import PhotoPreviewOverlay from '../../components/common/PhotoPreviewOverlay'
import PhotoUploadStatus from '../../components/common/PhotoUploadStatus'
import Tile from '../../components/common/Tile'
import backIcon from '../../assets/icons/Back.svg'
import {
  deletePhoto,
  getPin,
  getPinPhotos,
} from '../../features/pins/pinApi'
import {
  addNearbyPhotos,
  describeRejected,
} from '../../features/pins/nearbyPhotos'
import {
  PHOTO_UPLOAD_BATCH_SIZE,
  getRemainingPhotoCapacity,
} from '../../features/pins/photoUploadQueue'

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

/* 나중에 추가한 사진은 다른 날에 찍혔을 수 있다. 시간만 보이면 묶음끼리
   구분되지 않아 날짜를 앞에 붙인다. */
const formatDateTime = (isoString) =>
  isoString ? `${formatDate(isoString)} ${formatTime(isoString)}` : ''

/**
 * 사진 추가 결과를 한 줄로 옮긴다.
 *
 * 안내 칸의 높이가 고정이라 줄이 늘어나면 안 된다. 성공·실패를 가운뎃점으로 잇는다.
 */
const describeAddResult = ({ added, rejected }) => {
  const lines = []

  if (added.length > 0) lines.push(`${added.length}장을 추가했어요`)
  if (rejected.length > 0) {
    lines.push(`${rejected.length}장 실패 · ${describeRejected(rejected)}`)
  }

  return lines.join(' · ')
}

/** 찍힌 때. 없거나 읽을 수 없으면 0 으로 봐서 맨 앞에 모은다. */
const capturedTime = (photo) => {
  const time = new Date(photo.captured_at).getTime()
  return Number.isNaN(time) ? 0 : time
}

/** 이만큼 벌어지면 다른 때에 찍은 것으로 보고 묶음을 나눈다. */
const SESSION_GAP_MS = 30 * 60 * 1000

/**
 * 찍힌 때가 가까운 사진끼리 묶는다.
 *
 * 응답에는 촬영 세션 정보가 없어(명세 0-1) 시간 간격으로 나눈다. 나중에 주변
 * 사진을 추가하면 찍힌 때가 멀리 떨어져 있어 별도의 묶음이 된다.
 *
 * @returns `[{ startedAt, offset, photos }]` — `offset` 은 전체에서 몇 번째부터인지
 */
const groupByCaptureTime = (photos) => {
  const sorted = [...photos].sort((a, b) => capturedTime(a) - capturedTime(b))

  return sorted.reduce((groups, photo) => {
    const lastGroup = groups.at(-1)
    const lastPhoto = lastGroup?.photos.at(-1)

    if (lastPhoto && capturedTime(photo) - capturedTime(lastPhoto) <= SESSION_GAP_MS) {
      lastGroup.photos.push(photo)
    } else {
      groups.push({
        startedAt: photo.captured_at,
        offset: lastGroup ? lastGroup.offset + lastGroup.photos.length : 0,
        photos: [photo],
      })
    }

    return groups
  }, [])
}

const AllPhotos = () => {
  const navigate = useNavigate()
  const { pinID = FALLBACK_PIN_ID } = useParams()

  const [pin, setPin] = useState(null)
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [addResult, setAddResult] = useState(null)
  const [addError, setAddError] = useState('')

  /** 크게 보고 있는 사진의 자리. 없으면 -1 */
  const [previewIndex, setPreviewIndex] = useState(-1)
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

  const groups = useMemo(() => groupByCaptureTime(photos), [photos])

  /* 크게 보기는 묶음을 넘나들며 넘길 수 있어야 해서, 화면에 보이는 순서대로
     펼친 목록을 따로 둔다. 타일의 자리는 묶음의 `offset` 을 더해 구한다. */
  const orderedPhotos = useMemo(
    () => groups.flatMap((group) => group.photos),
    [groups],
  )

  const title = pin?.place_name || pin?.address || '이름 없는 장소'

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
    const uploadableCount = Math.min(
      files.length,
      getRemainingPhotoCapacity(photos.length),
    )
    setUploadProgress(
      uploadableCount > 0
        ? {
            phase: 'upload',
            completed: 0,
            total: uploadableCount,
            batchIndex: 1,
            totalBatches: Math.ceil(uploadableCount / PHOTO_UPLOAD_BATCH_SIZE),
          }
        : null,
    )

    try {
      const result = await addNearbyPhotos(pinID, files, {
        currentPhotoCount: photos.length,
        onProgress: setUploadProgress,
      })
      setAddResult(result)

      const photoList = await getPinPhotos(pinID)
      setPhotos(photoList.photos)
    } catch (error) {
      setAddError(error.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
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
            <>
              <ToolbarButton type="button" onClick={exitSelectMode}>
                취소
              </ToolbarButton>
              <DeleteSelectionButton
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={selectedIds.length === 0}
              >
                {selectedIds.length}장 삭제
              </DeleteSelectionButton>
            </>
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
                disabled={isUploading}
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

      {/* 안내가 떠도 아래가 밀리지 않도록 자리를 늘 비워둔다. */}
      <NoticeSlot>
        {isUploading && <PhotoUploadStatus progress={uploadProgress} />}
        {addError && <Notice role="alert">{addError}</Notice>}

        {!isUploading && !addError && addResult && (
          <Notice role="status">{describeAddResult(addResult)}</Notice>
        )}
      </NoticeSlot>

      {isLoading && <StateMessage>불러오는 중...</StateMessage>}

      {!isLoading && errorMessage && (
        <StateMessage role="alert">{errorMessage}</StateMessage>
      )}

      {!isLoading && !errorMessage && photos.length === 0 && (
        <StateMessage>아직 사진이 없습니다.</StateMessage>
      )}

      {!isLoading && !errorMessage && photos.length > 0 && (
        <PhotoGroups>
          {groups.map((group) => (
            <PhotoGroup key={group.startedAt ?? group.offset}>
              <GroupHeading>
                <Time>{formatDateTime(group.startedAt)}</Time>
                <Rule />
                <Count>{group.photos.length}장</Count>
              </GroupHeading>

              <PhotoStrip
                role="region"
                aria-roledescription="carousel"
                aria-label={`${formatDateTime(group.startedAt)} 사진 ${group.photos.length}장`}
              >
                {group.photos.map((photo, index) => (
                  <PhotoTile
                    key={photo.photo_id}
                    interactive
                    selected={selectedIds.includes(photo.photo_id)}
                    onClick={
                      isSelectMode
                        ? () => toggleSelected(photo.photo_id)
                        : () => setPreviewIndex(group.offset + index)
                    }
                    src={photo.file_path}
                    alt={`${index + 1}번째 사진`}
                    crossOrigin="anonymous"
                    aria-posinset={index + 1}
                    aria-setsize={group.photos.length}
                  />
                ))}
              </PhotoStrip>
            </PhotoGroup>
          ))}
        </PhotoGroups>
      )}

      <ConfirmationModal
        open={isConfirmingDelete}
        title={`선택한 사진 ${selectedIds.length}장을 삭제할까요?`}
        confirmLabel={isDeleting ? '삭제 중...' : `${selectedIds.length}장 삭제하기`}
        confirmDisabled={isDeleting}
        cancelDisabled={isDeleting}
        onConfirm={handleDeleteSelected}
        onCancel={() => setIsConfirmingDelete(false)}
      >
        {/* 대표사진이 지워지면 서버가 남은 사진에서 대체 1장을 채운다. */}
        <DeleteConfirmText>
          되돌릴 수 없고, 대표사진이 포함돼 있으면 추천이 다시 계산됩니다.
        </DeleteConfirmText>
      </ConfirmationModal>

      {/* 선택 모드에서는 고르는 게 우선이라 크게 보기를 띄우지 않는다. */}
      {!isSelectMode && previewIndex >= 0 && (
        <PhotoPreviewOverlay
          photos={orderedPhotos.map((photo) => ({
            id: photo.photo_id,
            url: photo.file_path,
          }))}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(-1)}
        />
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

const DeleteSelectionButton = styled(ToolbarButton)`
  color: var(--Primary-Cognac);
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

/* 날짜까지 들어가 길이가 달라지므로 폭을 고정하지 않고 글에 맞춘다. */
const Time = styled.h2`
  flex: 0 0 auto;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  white-space: nowrap;
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

/* 원래 제목과 사진 사이에 있던 40px 여백을 그대로 안내 자리로 쓴다.
   안내가 없을 때는 빈 채로 남아 예전과 같은 간격이 된다. */
const NoticeSlot = styled.div`
  width: 354px;
  height: 40px;
  flex: 0 0 auto;
  /* 블록으로 두면 안내의 위쪽 여백이 부모 밖으로 collapse 돼 자리가 밀린다. */
  display: flex;
  flex-direction: column;
  justify-content: center;
`

/* 자리 높이에 맞춰 한 줄만 둔다. 긴 글은 잘라서 아래를 밀지 않게 한다.
   자리(40)보다 낮게 두면 남는 8px 이 위아래로 나뉜다. */
const Notice = styled.p`
  width: 100%;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 10px;
  padding: 0 12px;
  background: var(--Surface-Base);
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  /* 가운데 정렬을 flex 로 하면 말줄임이 먹지 않아 줄 높이로 맞춘다. */
  line-height: 32px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DeleteConfirmText = styled.p`
  color: var(--Text-Secondary);
  word-break: keep-all;
  font: var(--text-ui-body-m);
`

const StateMessage = styled.p`
  padding: 40px 24px 40px 0;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  word-break: keep-all;
`
