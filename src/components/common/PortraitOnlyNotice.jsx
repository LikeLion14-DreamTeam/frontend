import { createPortal } from 'react-dom'
import styled from 'styled-components'
import useIsLandscape from '../../hooks/useIsLandscape'

/**
 * 세로 전용 화면을 가로에서 열었을 때 덮는 안내.
 *
 * 이 앱은 촬영 화면을 빼면 모두 세로를 기준으로 짜여 있다. 가로로 든 채
 * 넘어오면 배치가 무너지는데, 그 모습은 "고장 났다" 로 읽히지 "돌려야겠다" 로
 * 읽히지 않는다. 무너진 화면을 보여주는 대신 무엇을 하면 되는지 알린다.
 *
 * 화면 전체를 덮어야 해서 body 에 직접 붙인다. 부모의 자리나 겹침 순서에
 * 영향을 받지 않는다.
 */
const PortraitOnlyNotice = () => {
  const isLandscape = useIsLandscape()

  if (!isLandscape) return null

  return createPortal(
    <Layer role="alert">
      <Icon aria-hidden="true" />
      <Title>화면을 세로로 돌려주세요</Title>
      <Description>이 화면은 세로로 볼 때만 제대로 보여요.</Description>
    </Layer>,
    document.body,
  )
}

export default PortraitOnlyNotice

const Layer = styled.div`
  position: fixed;
  z-index: 200;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  background: var(--Background-Base);
  text-align: center;
`

/* 세로로 선 기기 모양. 아이콘 파일을 따로 두지 않고 테두리로만 그린다. */
const Icon = styled.div`
  width: 42px;
  height: 66px;
  border: 3px solid var(--Text-Primary);
  border-radius: 8px;
`

const Title = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
  word-break: keep-all;
`

const Description = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  word-break: keep-all;
`
