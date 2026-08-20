import React from 'react'
import styled from 'styled-components'

/**
 * A/B 취향 온보딩의 사진 카드 (피그마 `Choice`)
 *
 *   <Choice label="A" selected={picked === 'A'} onClick={() => setPicked('A')} />
 *   <Choice label="B" selected={picked === 'B'} onClick={() => setPicked('B')} />
 *
 * - `label` — 카드 아래 태그 문구.
 * - `selected` — 선택 여부. 사진 박스 테두리와 태그만 반전되며 사진 색상은 유지된다.
 * - 폭은 부모가 정하고 사진 박스는 171:320 비율을 유지한다. 두 장을 나란히 놓을 때는
 *   부모에 `grid-template-columns: 1fr 1fr; gap: 12px` 를 준다.
 *   (피그마 402px 화면 기준 본문 354 = 171 + 12 + 171)
 * - `src`를 전달하면 사진을 채우고, 없거나 로딩에 실패하면 기본 배경을 표시한다.
 */
const Choice = ({ label, selected = false, src, alt = '', ...rest }) => {
  return (
    <ChoiceButton type="button" aria-pressed={selected} {...rest}>
      <Photo $selected={selected}>
        {src && (
          <PhotoImage
            key={src}
            src={src}
            alt={alt}
            onError={(event) => {
              event.currentTarget.hidden = true
            }}
          />
        )}
      </Photo>
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

  &:disabled {
    cursor: default;
  }
`

const Photo = styled.div`
  width: 100%;
  /* 피그마 402px 화면 기준 171 x 320. 폭이 변해도 비율을 유지한다. */
  aspect-ratio: 171 / 320;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? 'var(--Primary-Pressed)' : 'transparent'};
  background: var(--Map-Land);
`

const PhotoImage = styled.img`
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
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
