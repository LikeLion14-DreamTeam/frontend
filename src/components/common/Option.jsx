import React from 'react'
import styled from 'styled-components'
import checkIcon from '../../assets/icons/check-circle.svg'

const Option = ({ selected = false, children, ...rest }) => {
  return (
    <OptionButton type="button" $selected={selected} aria-pressed={selected} {...rest}>
      <OptionLabel>{children}</OptionLabel>
      {selected ? <CheckIcon src={checkIcon} alt="" /> : <EmptyCheck />}
    </OptionButton>
  )
}

export default Option

const OptionButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border: ${({ $selected }) =>
    $selected
      ? '1.5px solid var(--Primary-Cognac)'
      : '1px solid var(--Border-Default)'};
  border-radius: 14px;
  background: ${({ $selected }) =>
    $selected ? 'rgb(181 118 59 / 9%)' : 'var(--Surface-Base)'};
  color: ${({ $selected }) =>
    $selected ? 'var(--Text-Primary)' : 'var(--Text-Secondary)'};
  cursor: pointer;
`

const OptionLabel = styled.span`
  flex: 1;
  font: var(--text-ui-body-l);
  text-align: left;
  word-break: break-word;
`

const CheckIcon = styled.img`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: block;
`

const EmptyCheck = styled.span`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 1px solid var(--Border-Default);
  border-radius: 50%;
  background: var(--Background-Base);
`
