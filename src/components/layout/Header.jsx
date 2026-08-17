import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import BackIcon from '../../assets/icons/Back.svg'

const Header = ({
  to = '/',
  /* 돌아갈 곳이 없는 화면에서는 false. 높이는 그대로 두고 버튼만 감춘다. */
  showBack = true,
  title,
  rightContent,
  iconSrc = BackIcon,
  iconWidth = '9px',
  iconHeight = '16px',
  ariaLabel = '뒤로가기',
  height = '116px',
  topPadding = '72px',
  barHeight = '24px',
  borderBottom = false,
}) => {
  return (
    <HeaderWrapper
      $barHeight={barHeight}
      $borderBottom={borderBottom}
      $height={height}
      $topPadding={topPadding}
    >
      {showBack ? (
        <BackLink
          $barHeight={barHeight}
          $topPadding={topPadding}
          to={to}
          aria-label={ariaLabel}
        >
          <BackImage
            $height={iconHeight}
            $width={iconWidth}
            src={iconSrc}
            alt=""
            aria-hidden="true"
          />
        </BackLink>
      ) : null}
      {title ? (
        <TitleSlot $barHeight={barHeight} $topPadding={topPadding}>
          <HeaderTitle>{title}</HeaderTitle>
        </TitleSlot>
      ) : null}
      {rightContent ? (
        <RightSlot $barHeight={barHeight} $topPadding={topPadding}>
          {rightContent}
        </RightSlot>
      ) : null}
    </HeaderWrapper>
  )
}

export default Header

const HeaderWrapper = styled.header`
  position: relative;
  width: 100%;
  max-width: 450px;
  height: calc(${({ $height }) => $height} - var(--design-safe-top));
  margin: 0 auto;
  padding: calc(${({ $topPadding }) => $topPadding} - var(--design-safe-top))
    24px 0;
  display: flex;

  &::after {
    content: ${({ $borderBottom }) => ($borderBottom ? "''" : 'none')};
    position: absolute;
    left: 0;
    right: 0;
    top: calc(
      ${({ $topPadding }) => $topPadding} - var(--design-safe-top) +
        ${({ $barHeight }) => $barHeight} - 1px
    );
    height: 1px;
    background: #d0d0d0;
  }
`

const BackLink = styled(Link)`
  position: absolute;
  left: 24px;
  top: calc(${({ $topPadding }) => $topPadding} - var(--design-safe-top));
  width: 24px;
  height: ${({ $barHeight }) => $barHeight};
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  text-decoration: none;
`

const BackImage = styled.img`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
  display: block;
  object-fit: contain;
`

const TitleSlot = styled.div`
  position: absolute;
  left: 64px;
  right: 64px;
  top: calc(${({ $topPadding }) => $topPadding} - var(--design-safe-top));
  height: ${({ $barHeight }) => $barHeight};
  display: flex;
  align-items: center;
  justify-content: center;
`

const HeaderTitle = styled.h1`
  color: #1f2937;
  font: var(--text-ui-h3);
  text-align: center;
`

const RightSlot = styled.div`
  position: absolute;
  right: 24px;
  top: calc(${({ $topPadding }) => $topPadding} - var(--design-safe-top));
  height: ${({ $barHeight }) => $barHeight};
  display: inline-flex;
  align-items: center;
`
