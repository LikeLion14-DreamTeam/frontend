import React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

const NavBar = () => {
  return (
    <NavWrapper>
      <NavContent to="/">홈</NavContent>
      <NavContent to="/record">기록</NavContent>
      <NavContent to="/recommendation">추천</NavContent>
      <NavContent to="/archive">아카이브</NavContent>
      <NavContent to="/trip">여행</NavContent>
    </NavWrapper>
  )
}

export default NavBar

const NavWrapper = styled.nav`
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  border: 1px solid #ddd;
  background: #fff;
  z-index: 10;
`

const NavContent = styled(NavLink)`
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  text-decoration: none;
  color: #000;

  &.active {
    font-weight: 700;
    text-decoration: underline;
  }
`
