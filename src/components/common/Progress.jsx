import React from 'react'
import styled from 'styled-components'

/**
 * 온보딩 진행도 (피그마 `Progress`)
 *
 *   <Progress current={3} total={5} />
 *
 * - `current` — 현재 단계(1부터). 이 개수만큼 막대가 채워진다.
 * - `total` — 전체 단계. 막대 개수가 되며, 남는 폭을 균등하게 나눠 갖는다.
 * - 폭은 부모를 꽉 채운다.
 */
const Progress = ({ current, total }) => {
  const steps = Array.from({ length: total }, (_, index) => index + 1)

  return (
    <ProgressWrapper>
      <Bar role="presentation">
        {steps.map((step) => (
          <Segment key={step} $filled={step <= current} />
        ))}
      </Bar>
      <Meta>
        {current} / {total}
      </Meta>
    </ProgressWrapper>
  )
}

export default Progress

const ProgressWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Bar = styled.div`
  display: flex;
  gap: 4px;
`

const Segment = styled.span`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${({ $filled }) =>
    $filled ? 'var(--Primary-Cognac)' : 'var(--Border-Default)'};
`

const Meta = styled.p`
  font: var(--text-ui-caption);
  color: var(--Primary-Cognac);
  text-align: right;
`
