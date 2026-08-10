import styled from 'styled-components'

const Card = styled.div`
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: ${({ $padding }) => $padding || '16px'};
`

export default Card
