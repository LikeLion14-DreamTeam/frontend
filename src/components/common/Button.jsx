import styled, { css } from 'styled-components'

const variantStyles = {
  primary: css`
    color: var(--Text-Inverse);
    background: var(--Primary-Cognac);
    border: none;

    &:disabled {
      color: var(--State-Disbaled-Text);
      background: var(--State-Disabled-Fill);
    }
  `,

secondary: css`
    color: var(--Primary-Cognac);
    background: transparent;
    border: 1px solid var(--Primary-Cognac);

    &:disabled {
      color: var(--State-Disabled-Text);
      border: 1px solid var(--Border-Default);
    }
  `,

  ghost: css`
    color: var(--Text-Secondary);
    background: transparent;
    border: none;

    &:disabled {
      color: var(--State-Disabled-Text);
    }
  `
}

const Button = styled.button`
  display: flex;
  width: 100%;
  height: 52px;
  justify-content: center;
  align-items: center;
  gap: 8px;

  border: 1px solid transparent;
  border-radius: 26px;
  cursor: pointer;

  ${({ $variant }) => variantStyles[$variant] ?? variantStyles.primary}
`

export default Button
