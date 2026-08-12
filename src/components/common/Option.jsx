import React from 'react'
import styled from 'styled-components'
import checkIcon from '../../assets/icons/check-circle.svg'

/**
 * 객관식 선택지 (피그마 `Option`)
 *
 *   <Option
 *     selected={picked === option}
 *     onClick={() => setPicked(option)}
 *   >
 *     풍경과 도시 전경
 *   </Option>
 *
 * - `selected` — 선택 여부. 배경·테두리·글자색과 오른쪽 체크 아이콘이 함께 바뀐다.
 * - 라벨은 `children` 으로 넘긴다.
 * - `onClick` 등 나머지 prop은 내부 `<button>` 으로 그대로 전달된다.
 * - 폭은 부모를 꽉 채운다(100%). 목록으로 쓸 때는 부모에 세로 `gap` 을 준다.
 */
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
  height: 54px;
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
