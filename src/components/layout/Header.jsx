import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import BackIcon from '../../assets/icons/Back.svg'

// 사용법: <Header to="/돌아갈-경로" />
const Header = ({ to = '/' }) => {
  return (
    <HeaderWrapper>
      <BackLink to={to} aria-label="뒤로가기">
        <BackImage src={BackIcon} alt="" aria-hidden="true" />
      </BackLink>
    </HeaderWrapper>
  )
}

export default Header

const HeaderWrapper = styled.header`
  width: 100%;
  max-width: 450px;
  height: 116px;
  margin: 0 auto;
  padding: 72px 24px 0;
`

const BackLink = styled(Link)`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: flex-start;
  justify-content: flex-start;
  text-decoration: none;
`

const BackImage = styled.img`
  width: 9px;
  height: 16px;
  display: block;
`
