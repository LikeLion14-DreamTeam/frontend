import React from 'react'
import styled from 'styled-components'

/**
 * A/B 취향 온보딩의 사진 카드 (피그마 `Choice`)
 *
 *   <Choice label="A" selected={picked === 'A'} onClick={() => setPicked('A')} />
 *   <Choice label="B" selected={picked === 'B'} onClick={() => setPicked('B')} />
 *
 * - `label` — 카드 아래 태그 문구.
 * - `selected` — 선택 여부. 사진 박스에 코냑 테두리·틴트가 깔리고 태그가 반전된다.
 * - 폭은 부모가 정한다. 두 장을 나란히 놓을 때는 부모에
 *   `grid-template-columns: 1fr 1fr; gap: 12px` 를 준다.
 * - 사진은 아직 안 받는다. 넣게 되면 `Photo` 안에 `<img>` 를 두고
 *   틴트를 그 위 레이어로 올려야 한다.
 */
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
