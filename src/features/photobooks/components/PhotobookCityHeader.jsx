import styled from 'styled-components'

const PhotobookCityHeader = ({ className, city, pinCount = 0 }) => {
  return (
    <Header className={className}>
      <HeaderRow>
        <City>{city}</City>
        <PinCount>핀 {pinCount}</PinCount>
      </HeaderRow>
      <Divider />
    </Header>
  )
}

export default PhotobookCityHeader

const Header = styled.header`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const HeaderRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const City = styled.h2`
  color: var(--Text-Primary);
  font: var(--text-editorial-h1);
  letter-spacing: 0.32px;
  text-transform: uppercase;
`

const PinCount = styled.p`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const Divider = styled.span`
  width: 100%;
  height: 1px;
  display: block;
  background: var(--Border-Default);
`
