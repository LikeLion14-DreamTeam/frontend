import React from 'react'
import styled from 'styled-components'
import checkIcon from '../../assets/icons/check-circle-24.svg'

/**
 * 무드보드 온보딩의 사진 타일 (피그마 `Tile`)
 *
 *   <Tile
 *     selected={selected.includes(photo)}
 *     onClick={() => handleSelect(photo)}
 *   />
 *
 * - `selected` — 선택 여부. 코냑 테두리·틴트가 깔리고 우상단에 체크 아이콘이 붙는다.
 * - 폭은 부모가 정한다. 3열 그리드로 쓸 때는 부모에
 *   `grid-template-columns: repeat(3, 1fr); column-gap: 6px; row-gap: 12px` 를 준다.
 * - 높이 124px는 피그마 컴포넌트 정의값이다. 무드보드 화면의 타일은 116px이라
 *   8px 차이가 난다. 어느 쪽이 맞는지 확정 전이므로 적용 시 확인할 것.
 */
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
