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
 * - 폭은 부모가 정하고 111.33:124 비율을 유지한다. 3열 그리드로 쓸 때는 부모에
 *   `grid-template-columns: repeat(3, 1fr); column-gap: 10px` 를 준다.
 *   (피그마 402px 화면 기준 본문 354 = 111.33 x 3 + 10 x 2)
 * - 세로 간격은 402px 무드보드 화면이 아직 없어 미확정이다. 적용 시 피그마에서 확인할 것.
 */
const Tile = ({
  selected = false,
  interactive = true,
  src,
  alt = '',
  crossOrigin,
  ...rest
}) => {
  return (
    <TileButton
      as={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      $interactive={interactive}
      $selected={selected}
      aria-pressed={interactive ? selected : undefined}
      {...rest}
    >
      {src && (
        <TileImage
          key={src}
          src={src}
          alt={alt}
          crossOrigin={crossOrigin}
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      )}
      {selected && <CheckIcon src={checkIcon} alt="" />}
    </TileButton>
  )
}

export default Tile

const TileButton = styled.button`
  position: relative;
  width: 100%;
  /* 피그마 402px 화면 기준 111.33 x 124. 폭이 변해도 비율을 유지한다. */
  aspect-ratio: 111.33 / 124;
  overflow: hidden;
  padding: 0;
  border-radius: 12px;
  cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'default')};
  border: ${({ $selected }) =>
    $selected
      ? '2px solid var(--Primary-Cognac)'
      : '1px solid var(--Border-Default)'};
  background: var(--Map-Land);

  &:disabled {
    cursor: default;
  }

  &::after {
    position: absolute;
    inset: 0;
    z-index: 1;
    content: '';
    background: ${({ $selected }) =>
      $selected ? 'rgb(181 118 59 / 18%)' : 'transparent'};
    pointer-events: none;
  }
`

const TileImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
`

const CheckIcon = styled.img`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  width: 24px;
  height: 24px;
  display: block;
`
