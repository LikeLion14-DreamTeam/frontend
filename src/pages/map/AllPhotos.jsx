import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
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

// 핀 상세를 거치지 않고 들어왔을 때를 위한 기본값.
const FALLBACK_PIN_ID = 101

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const formatDate = (isoString) =>
  isoString ? dateFormatter.format(new Date(isoString)).replace(/\.$/, '') : ''

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
      const result = await addNearbyPhotos(pinID, files)
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

      {addError && <StateMessage role="alert">{addError}</StateMessage>}

      {addResult && (
        <AddResult role="status">
          {addResult.added.length > 0 && (
            <ResultLine>사진 {addResult.added.length}장을 추가했어요.</ResultLine>
          )}
          {addResult.rejected.length > 0 && (
            <ResultLine>
              {addResult.rejected.length}장은 추가하지 못했어요 ·{' '}
              {describeRejected(addResult.rejected)}
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

      {!isLoading && !errorMessage && photos.length > 0 && (
        <PhotoGrid role="list" aria-label={`사진 ${photos.length}장`}>
          {photos.map((photo, index) => (
            <PhotoTile
              key={photo.photo_id}
              role="listitem"
              interactive={isSelectMode}
              selected={selectedIds.includes(photo.photo_id)}
              onClick={
                isSelectMode ? () => toggleSelected(photo.photo_id) : undefined
              }
              src={photo.file_path}
              alt={`${index + 1}번째 사진`}
              aria-posinset={index + 1}
              aria-setsize={photos.length}
            />
          ))}
        </PhotoGrid>
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

const PhotoGrid = styled.div`
  width: 354px;
  margin-top: 40px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
`

const PhotoTile = styled(Tile)`
  width: 100%;
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
