import styled from 'styled-components'
import Button from '../../components/common/Button'
import GoogleMap from '../../components/common/GoogleMap'
import NavBar from '../../components/layout/NavBar'
import crosshairIcon from '../../assets/map/manual-pin-crosshair.svg'
import markerIcon from '../../assets/map/manual-pin-marker.svg'
import searchIcon from '../../assets/map/manual-pin-search.svg'
import { MAP_STYLES } from './mapStyles'

const BUKCHON_CENTER = { lat: 37.5796, lng: 126.9849 }

const ManualPinAdd = () => {
  return (
    <Page>
      <MapLayer>
        <GoogleMap
          center={BUKCHON_CENTER}
          zoom={16}
          height="100%"
          styles={MAP_STYLES}
          borderRadius="0"
          bordered={false}
          mapOptions={{
            clickableIcons: false,
            gestureHandling: 'greedy',
            keyboardShortcuts: false,
          }}
        />
      </MapLayer>

      <SearchBar>
        <SearchIcon src={searchIcon} alt="" aria-hidden="true" />
        <SearchInput
          type="search"
          aria-label="장소나 주소 검색"
          placeholder="장소나 주소로 검색"
        />
      </SearchBar>

      <Hint>지도를 움직여 위치를 맞춰주세요</Hint>

      <CenterMarker aria-hidden="true">
        <MarkerIcon src={markerIcon} alt="" />
        <CrosshairIcon src={crosshairIcon} alt="" />
      </CenterMarker>

      <AddressSheet>
        <SheetHandle aria-hidden="true" />
        <LocationLabel>선택한 위치</LocationLabel>
        <LocationTitle>북촌 한옥마을 입구</LocationTitle>
        <LocationMeta>서울 종로구 계동길 37&nbsp; · &nbsp;현재 지도 중심</LocationMeta>
        <ContinueButton type="button">이 위치로 계속</ContinueButton>
      </AddressSheet>

      <NavBar activeOverride="home" />
    </Page>
  )
}

export default ManualPinAdd

const Page = styled.main`
  position: relative;
  width: 100%;
  max-width: 450px;
  height: var(--app-viewport-height);
  min-height: 620px;
  margin: 0 auto;
  overflow: hidden;
  background: var(--Map-Base);
`

const MapLayer = styled.div`
  position: absolute;
  inset: 0;
`

const SearchBar = styled.div`
  position: absolute;
  z-index: 4;
  top: 50px;
  right: 24px;
  left: 24px;
  height: 44px;
  padding: 11px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  border-radius: 22px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Card);
`

const SearchIcon = styled.img`
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
`

const SearchInput = styled.input`
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--State-Disabled-Text);
  font: var(--text-ui-label);

  &::placeholder {
    color: var(--State-Disabled-Text);
    opacity: 1;
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
`

const Hint = styled.p`
  position: absolute;
  z-index: 4;
  top: 110px;
  left: 50%;
  padding: 7px 12px;
  border-radius: 14px;
  background: rgb(36 28 22 / 68%);
  color: var(--Text-Inverse);
  font: var(--text-ui-nav);
  white-space: nowrap;
  transform: translateX(-50%);
`

const CenterMarker = styled.div`
  position: absolute;
  z-index: 3;
  top: calc(50% - 65px);
  left: 50%;
  width: 54px;
  height: 66px;
  transform: translateX(-50%);
  pointer-events: none;
`

const MarkerIcon = styled.img`
  position: absolute;
  inset: 0;
  width: 54px;
  height: 66px;
`

const CrosshairIcon = styled.img`
  position: absolute;
  top: 54px;
  left: 50%;
  width: 16px;
  height: 11px;
  transform: translateX(-50%);
`

const AddressSheet = styled.section`
  position: absolute;
  z-index: 8;
  right: 0;
  bottom: 75px;
  left: 0;
  height: 191px;
  overflow: hidden;
  border-radius: 22px 22px 0 0;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Bottom-Sheet);
`

const SheetHandle = styled.div`
  position: absolute;
  top: 10px;
  left: 50%;
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: rgb(181 161 140 / 50%);
  transform: translateX(-50%);
`

const LocationLabel = styled.p`
  position: absolute;
  top: 32px;
  left: 24px;
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
`

const LocationTitle = styled.h1`
  position: absolute;
  top: 52px;
  left: 24px;
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
`

const LocationMeta = styled.p`
  position: absolute;
  top: 81px;
  left: 24px;
  color: var(--Text-Secondary);
  font: var(--text-ui-label);
  white-space: nowrap;
`

const ContinueButton = styled(Button)`
  position: absolute;
  top: 118px;
  right: 24px;
  left: 24px;
  width: auto;
  height: 54px;
  color: var(--Text-Inverse);
  background: var(--Primary-Cognac);
  font: var(--text-ui-button);
`
