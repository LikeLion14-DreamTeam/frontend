import React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import archiveActiveIcon from '../../assets/icons/nav-archive-active.svg'
import archiveInactiveIcon from '../../assets/icons/nav-archive-inactive.svg'
import homeActiveIcon from '../../assets/icons/nav-home-active.svg'
import homeInactiveIcon from '../../assets/icons/nav-home-inactive.svg'
import mapActiveIcon from '../../assets/icons/nav-map-active.svg'
import mapInactiveIcon from '../../assets/icons/nav-map-inactive.svg'
import myActiveIcon from '../../assets/icons/nav-my-active.svg'
import myInactiveIcon from '../../assets/icons/nav-my-inactive.svg'

const navItems = [
  {
    to: '/',
    label: '홈',
    activeIcon: homeActiveIcon,
    inactiveIcon: homeInactiveIcon,
    end: true,
  },
  {
    to: '/map',
    label: '지도',
    activeIcon: mapActiveIcon,
    inactiveIcon: mapInactiveIcon,
  },
  {
    to: '/archive',
    label: '아카이브',
    activeIcon: archiveActiveIcon,
    inactiveIcon: archiveInactiveIcon,
  },
  {
    to: '/mypage',
    label: '마이페이지',
    activeIcon: myActiveIcon,
    inactiveIcon: myInactiveIcon,
  },
]

const NavBar = () => {
  return (
    <NavWrapper>
      {navItems.map((item) => (
        <NavContent key={item.to} to={item.to} end={item.end}>
          {({ isActive }) => (
            <>
              <NavIcon
                src={isActive ? item.activeIcon : item.inactiveIcon}
                alt=""
                aria-hidden="true"
              />
              <NavLabel>{item.label}</NavLabel>
            </>
          )}
        </NavContent>
      ))}
    </NavWrapper>
  )
}

export default NavBar

const NavWrapper = styled.nav`
  width: 100%;
  height: 75px;
  position: fixed;
  bottom: 0;
  left: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--Border-Default);
  background: var(--Surface-Base);
  z-index: 10;
`

const NavContent = styled(NavLink)`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  text-align: center;
  text-decoration: none;
  color: var(--Text-Secondary);

  &.active {
    color: var(--Primary-Cognac);
  }
`

const NavIcon = styled.img`
  width: 24px;
  height: 24px;
  display: block;
  object-fit: contain;
  pointer-events: none;
`

const NavLabel = styled.span`
  color: currentColor;
  font: var(--text-ui-nav);
  white-space: nowrap;
  word-break: break-word;
`
