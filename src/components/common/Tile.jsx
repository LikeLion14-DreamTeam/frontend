import React from 'react'
import styled from 'styled-components'
import checkIcon from '../../assets/icons/check-circle-24.svg'

const Tile = ({ selected = false, ...rest }) => {
  return (
    <TileButton type="button" $selected={selected} aria-pressed={selected} {...rest}>
      {selected && <CheckIcon src={checkIcon} alt="" />}
    </TileButton>
  )
}

export default Tile

const TileButton = styled.button`
  position: relative;
  width: 100%;
  height: 124px;
  padding: 0;
  border-radius: 12px;
  cursor: pointer;
  border: ${({ $selected }) =>
    $selected
      ? '2px solid var(--Primary-Cognac)'
      : '1px solid var(--Border-Default)'};
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(rgb(181 118 59 / 18%), rgb(181 118 59 / 18%)), var(--Map-Land)'
      : 'var(--Map-Land)'};
`

const CheckIcon = styled.img`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  display: block;
`
