import React from 'react'
import styled from 'styled-components'

const Choice = ({ label, selected = false, ...rest }) => {
  return (
    <ChoiceButton type="button" aria-pressed={selected} {...rest}>
      <Photo $selected={selected} />
      <Tag $selected={selected}>{label}</Tag>
    </ChoiceButton>
  )
}

export default Choice

const ChoiceButton = styled.button`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
`

const Photo = styled.div`
  width: 100%;
  height: 320px;
  border-radius: 16px;
  border: ${({ $selected }) =>
    $selected ? '1px solid var(--Primary-Pressed)' : 'none'};
  background: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(rgb(181 118 59 / 9%), rgb(181 118 59 / 9%)), var(--Map-Land)'
      : 'var(--Map-Land)'};
`

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 12px;
  font: var(--text-ui-label);
  white-space: nowrap;
  border: ${({ $selected }) =>
    $selected ? 'none' : '1px solid var(--Border-Default)'};
  background: ${({ $selected }) =>
    $selected ? 'var(--Primary-Pressed)' : 'var(--Surface-Base)'};
  color: ${({ $selected }) =>
    $selected ? 'var(--Text-Inverse)' : 'var(--Text-Secondary)'};
`
