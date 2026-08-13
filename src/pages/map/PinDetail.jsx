import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Marker } from '@vis.gl/react-google-maps'
import GoogleMap from '../../components/common/GoogleMap'
import activePinIcon from '../../assets/map/map-pin-active.svg'
import backIcon from '../../assets/map/detail-back.svg'
import openMapIcon from '../../assets/map/open-map.svg'
import photoAddIcon from '../../assets/map/photo-add.svg'
import refreshIcon from '../../assets/map/refresh.svg'
import voicePlayIcon from '../../assets/map/voice-play.svg'
import { MAP_STYLES } from './mapStyles'

const PIN_POSITION = { lat: 37.576, lng: 126.9769 }

const waveHeights = [
  5, 9, 14, 7, 17, 11, 6, 15, 19, 9, 5, 12, 17, 8, 11, 5, 10, 15,
  7, 13, 9, 6, 11, 16, 8, 12, 6, 14, 9, 5, 11, 17, 7, 10, 15, 8,
  13, 6, 12, 18, 9, 7, 14, 11, 5, 16, 8, 12, 10, 6, 15, 9, 7, 13,
  11, 6,
]

const PinDetail = () => {
  const navigate = useNavigate()
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <Page>
      <MapHero>
        <GoogleMap
          center={PIN_POSITION}
          zoom={15.5}
          height="100%"
          styles={MAP_STYLES}
          borderRadius="0"
          bordered={false}
          mapOptions={{ clickableIcons: false, keyboardShortcuts: false }}
        >
          <Marker
            position={PIN_POSITION}
            icon={activePinIcon}
            title="경복궁 광화문 앞"
          />
        </GoogleMap>

        <BackButton type="button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <img src={backIcon} alt="" />
        </BackButton>

        <JourneyChip>서울 여정 · 12개 핀 중 3번째</JourneyChip>
        <OpenMapButton type="button" onClick={() => navigate('/map')}>
          <img src={openMapIcon} alt="" />
          지도에서 보기
        </OpenMapButton>
      </MapHero>

      <DetailSheet>
        <SheetHandle aria-hidden="true" />

        <DetailContent>
          <PinIntro>
            <HeadingGroup>
              <PinTitle>경복궁 광화문 앞</PinTitle>
              <PinMeta>서울 종로구 세종로&nbsp;&nbsp;·&nbsp;&nbsp;2025.06.14 오전 10:32</PinMeta>
            </HeadingGroup>

            <Memo>
              <MemoRule />
              <MemoBody>
                <MemoText>
                  오래된 돌담을 따라 걷다가, 해가 드는 순간에 멈춰 섰다.
                  다음엔 이른 아침에 다시 오기로.
                </MemoText>
                <VoiceBar>
                  <PlayButton
                    type="button"
                    aria-label={isPlaying ? '음성 일시정지' : '음성 재생'}
                    aria-pressed={isPlaying}
                    onClick={() => setIsPlaying((playing) => !playing)}
                  >
                    <img src={voicePlayIcon} alt="" />
                  </PlayButton>
                  <Waveform aria-hidden="true">
                    {waveHeights.map((height, index) => (
                      <Wave
                        key={`${height}-${index}`}
                        $height={height}
                        $played={index < (isPlaying ? 32 : 18)}
                      />
                    ))}
                  </Waveform>
                  <Duration>00:18</Duration>
                </VoiceBar>
              </MemoBody>
            </Memo>
          </PinIntro>

          <PhotosSection>
            <SectionHeading>
              <EditorialTitle>PHOTOS</EditorialTitle>
              <HeadingLine />
              <TextAction
                type="button"
                onClick={() => navigate('./photos')}
              >
                모두 보기
              </TextAction>
            </SectionHeading>

            <PhotoGrid>
              <Photo $tone="main" />
              <PhotoStack>
                <Photo $tone="light" />
                <Photo $tone="dark">
                  <PhotoOverlay />
                  <PhotoCount>+5</PhotoCount>
                </Photo>
              </PhotoStack>
            </PhotoGrid>
          </PhotosSection>

          <SuggestedSection>
            <SuggestedHeading>
              <SuggestedTitle>
                <EditorialTitle>SUGGESTED</EditorialTitle>
                <SuggestedCount>3</SuggestedCount>
              </SuggestedTitle>
              <HeadingLine />
              <RefreshButton type="button">
                <img src={refreshIcon} alt="" />
                재추천
              </RefreshButton>
            </SuggestedHeading>
            <SuggestedDescription>
              AI가 이 장소 주변, 같은 시간대에 찍은 사진 중에서 골랐어요
            </SuggestedDescription>

            <SuggestedGrid>
              {['soft', 'warm', 'main'].map((tone) => (
                <SuggestedPhoto key={tone} $tone={tone}>
                  <AddButton type="button" aria-label="추천 사진 추가">
                    <img src={photoAddIcon} alt="" />
                  </AddButton>
                </SuggestedPhoto>
              ))}
            </SuggestedGrid>
          </SuggestedSection>
        </DetailContent>
      </DetailSheet>
    </Page>
  )
}

export default PinDetail

const Page = styled.main`
  width: 100%;
  max-width: 450px;
  height: var(--app-viewport-height);
  margin: 0 auto;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--Background-Base);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

const MapHero = styled.section`
  position: relative;
  height: 348px;
  overflow: hidden;
  background: var(--Map-Base);
`

const BackButton = styled.button`
  position: absolute;
  z-index: 3;
  top: 58px;
  left: 24px;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  img {
    width: 40px;
    height: 40px;
    display: block;
  }
`

const JourneyChip = styled.span`
  position: absolute;
  z-index: 3;
  bottom: 59px;
  left: 20px;
  padding: 7px 12px;
  border-radius: 14px;
  background: rgb(42 37 34 / 60%);
  box-shadow: var(--Effect-Chip);
  color: var(--Text-Inverse);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const OpenMapButton = styled.button`
  position: absolute;
  z-index: 3;
  right: 22px;
  bottom: 59px;
  padding: 7px 12px;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 14px;
  background: rgb(255 253 249 / 95%);
  box-shadow: var(--Effect-Chip);
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  white-space: nowrap;
  cursor: pointer;

  img {
    width: 15px;
    height: 15px;
    display: block;
  }
`

const DetailSheet = styled.section`
  position: relative;
  z-index: 2;
  min-height: 719px;
  margin-top: -31px;
  border-radius: 30px 30px 0 0;
  background: var(--Background-Base);
  box-shadow: var(--Effect-Bottom-Sheet);
`

const SheetHandle = styled.div`
  position: absolute;
  top: 13px;
  left: 50%;
  width: 54px;
  height: 4px;
  border-radius: 2px;
  background: rgb(181 161 140 / 50%);
  transform: translateX(-50%);
`

const DetailContent = styled.div`
  padding: 60px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 38px;
`

const PinIntro = styled.section`
  width: 100%;
  max-width: 354px;
  display: flex;
  flex-direction: column;
  gap: 22px;
`

const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PinTitle = styled.h1`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
`

const PinMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const Memo = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px;
`

const MemoRule = styled.div`
  width: 2px;
  min-height: 72px;
  flex: 0 0 auto;
  background: var(--Accent-Gold);
`

const MemoBody = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const MemoText = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-body-m);
`

const VoiceBar = styled.div`
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
`

const PlayButton = styled.button`
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  img {
    width: 22px;
    height: 22px;
    display: block;
  }
`

const Waveform = styled.span`
  min-width: 0;
  height: 24px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
`

const Wave = styled.span`
  width: 2px;
  height: ${({ $height }) => `${$height}px`};
  flex: 0 0 2px;
  border-radius: 1px;
  background: ${({ $played }) =>
    $played ? 'var(--Primary-Cognac)' : 'rgb(181 161 140 / 45%)'};
`

const Duration = styled.span`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font-family: var(--font-sans);
  font-size: 10px;
  line-height: 18px;
`

const PhotosSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`

const EditorialTitle = styled.h2`
  color: var(--Text-Primary);
  font: var(--text-editorial-brand);
  letter-spacing: 1.44px;
  white-space: nowrap;
`

const HeadingLine = styled.span`
  min-width: 20px;
  height: 1px;
  flex: 1;
  background: var(--Border-Default);
`

const TextAction = styled.button`
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  white-space: nowrap;
  cursor: pointer;
`

const PhotoGrid = styled.div`
  width: 100%;
  height: 164px;
  display: grid;
  grid-template-columns: minmax(0, 1.85fr) minmax(0, 1fr);
  gap: 6px;
`

const toneBackgrounds = {
  main: 'linear-gradient(180deg, #d6b591 0%, #8b6242 100%)',
  light: 'linear-gradient(180deg, #e3c49e 0%, #a87952 100%)',
  dark: 'linear-gradient(180deg, #b38a65 0%, #6b4d38 100%)',
  soft: 'linear-gradient(180deg, #eed9b6 0%, #b98a5c 100%)',
  warm: 'linear-gradient(180deg, #e9c89a 0%, #a9784e 100%)',
}

const Photo = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  background: ${({ $tone }) => toneBackgrounds[$tone]};
`

const PhotoStack = styled.div`
  min-width: 0;
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 6px;
`

const PhotoOverlay = styled.span`
  position: absolute;
  inset: 0;
  background: rgb(36 28 22 / 55%);
`

const PhotoCount = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--Background-Base);
  font: var(--text-editorial-brand);
  letter-spacing: 1.44px;
`

const SuggestedSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SuggestedHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
`

const SuggestedTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
`

const SuggestedCount = styled.span`
  color: var(--Accent-Gold);
  font: var(--text-editorial-brand);
  letter-spacing: 0.24px;
`

const RefreshButton = styled.button`
  flex: 0 0 auto;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  white-space: nowrap;
  cursor: pointer;

  img {
    width: 15px;
    height: 15px;
    display: block;
  }
`

const SuggestedDescription = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

const SuggestedGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`

const SuggestedPhoto = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 12px;
  background: ${({ $tone }) => toneBackgrounds[$tone]};
`

const AddButton = styled.button`
  position: absolute;
  right: 1px;
  bottom: -1px;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 38px;
    height: 38px;
    display: block;
  }
`
