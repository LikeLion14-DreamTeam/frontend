import React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import HomeIcon from '../../assets/icons/HomeIcon'
import MapIcon from '../../assets/icons/MapIcon'
import ArchiveIcon from '../../assets/icons/ArchiveIcon'
import MyPageIcon from '../../assets/icons/MyPageIcon'

const NavBar = () => {
  return (
    <NavWrapper>
      <NavContent to="/"><HomeIcon />홈</NavContent>
      <NavContent to="/map"><MapIcon />지도</NavContent>
      <NavContent to="/archive"><ArchiveIcon />아카이브</NavContent>
      <NavContent to="/mypage"><MyPageIcon />마이페이지</NavContent>
    </NavWrapper>
  )
}

export default NavBar

const NavWrapper = styled.nav`
  width: 100%;
  height: 75px;
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
  width: 25%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  text-align: center;
  text-decoration: none;
  color: #000;
  font-size: 11px;

  &.active {
    font-weight: 700;
    text-decoration: underline;
  }
`
