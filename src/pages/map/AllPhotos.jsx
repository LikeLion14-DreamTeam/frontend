import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import backIcon from '../../assets/icons/Back.svg'
import { getPin, getPinPhotos } from '../../features/pins/pinApi'

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

        <AddNearbyButton
          type="button"
          aria-disabled="true"
          aria-label="주변 사진 추가 (준비 중)"
        >
          주변 사진 추가
        </AddNearbyButton>
      </Toolbar>

      <Heading>
        <Title>이 장소의 사진</Title>
        {pin && (
          <Meta>
            {title} · {formatDate(pin.tagged_at)} · {photos.length}장
          </Meta>
        )}
      </Heading>

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
                  aria-posinset={index + 1}
                  aria-setsize={photos.length}
                >
                  <PhotoImage
                    src={photo.file_path}
                    alt={`${index + 1}번째 사진`}
                  />
                </PhotoTile>
              ))}
            </PhotoStrip>
          </PhotoGroup>
        </PhotoGroups>
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
  padding: 58px 0 40px 24px;
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

const AddNearbyButton = styled.button`
  height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-button);
  cursor: default;
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

const PhotoStrip = styled.div`
  width: calc(100vw - 24px);
  max-width: 378px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  touch-action: pan-x;

  &::-webkit-scrollbar {
    display: none;
  }

`

/* 공용 Tile 은 선택용 버튼이라 사진을 담을 수 없어, 같은 크기·모양으로 따로 둔다. */
const PhotoTile = styled.div`
  width: 111.333px;
  height: 124px;
  flex: 0 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: var(--Map-Land);
  scroll-snap-align: start;
  scroll-snap-stop: always;
`

const PhotoImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const StateMessage = styled.p`
  padding: 40px 24px 40px 0;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  word-break: keep-all;
`
