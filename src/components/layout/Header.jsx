import React from 'react'
import styled from 'styled-components'

const Header = ({ children }) => {
  return (
    <HeaderTitle>{children}</HeaderTitle>
  )
}

export default Header

const HeaderTitle = styled.h1`
  width: 100%;
  height: 50px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 16px;
  line-height: 48px;
  text-align: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
`
