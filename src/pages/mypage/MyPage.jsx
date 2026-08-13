import React from 'react'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import NavBar from '../../components/layout/NavBar'
import addIcon from '../../assets/icons/mypage/add.svg'
import briefcaseIcon from '../../assets/icons/mypage/briefcase.svg'
import chevronRightIcon from '../../assets/icons/mypage/chevron-right.svg'
import closeIcon from '../../assets/icons/mypage/close.png'
import keyIcon from '../../assets/icons/mypage/key.svg'
import refreshIcon from '../../assets/icons/mypage/refresh.svg'
import userIcon from '../../assets/icons/mypage/user.svg'

const stats = [
  { label: '태깅 횟수', value: 12 },
  { label: '완료 여정', value: 2 },
  { label: '방문 도시', value: 4 },
]

const preferences = [
  { id: 'brightness', left: '밝은', right: '어두운', value: 29 },
  { id: 'subject', left: '인물', right: '풍경', value: 74 },
  { id: 'motion', left: '정적', right: '동적', value: 41 },
  { id: 'distance', left: '근접', right: '원경', value: 68 },
  { id: 'temperature', left: '따뜻한', right: '차가운', value: 23 },
  { id: 'complexity', left: '단순', right: '복잡', value: 56 },
]

const products = [
  { id: 1, name: '비세토스 백팩', count: '9회 태깅', icon: briefcaseIcon },
  { id: 2, name: '로고 참 키링', count: '3회 태깅', icon: keyIcon },
]

const settings = [
  { label: '위치 권한', state: '허용됨' },
  { label: '카메라 권한', state: '허용됨' },
  { label: '알림', state: '켜짐' },
]

const MyPage = () => {
  const handlePreferenceInput = (event) => {
    const slider = event.currentTarget
    const value = Number(slider.value)

    slider.style.setProperty('--slider-progress', `${value}%`)
    slider.setAttribute('aria-valuetext', `${Math.round(value)}점`)
  }

  return (
    <PageShell>
      <Content>
        <ProfileSection aria-label="프로필">
          <Avatar>
            <AvatarIcon src={userIcon} alt="" aria-hidden="true" />
          </Avatar>
          <ProfileText>
            <UserName>곽효석</UserName>
            <AccountType>Google 계정으로 연결됨</AccountType>
          </ProfileText>
        </ProfileSection>

        <StatsGrid aria-label="활동 통계">
          {stats.map((stat) => (
            <StatCard key={stat.label}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>

        <Panel>
          <SectionHeader>
            <SectionTitle>취향 프로필</SectionTitle>
            <RelearnButton type="button">
              재학습
              <RefreshIcon src={refreshIcon} alt="" aria-hidden="true" />
            </RelearnButton>
          </SectionHeader>

          <PreferenceList>
            {preferences.map((preference) => (
              <PreferenceItem key={preference.id}>
                <PreferenceLabels>
                  <span>{preference.left}</span>
                  <span>{preference.right}</span>
                </PreferenceLabels>
                <PreferenceSlider
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={preference.value}
                  style={{
                    '--slider-progress': `${preference.value}%`,
                  }}
                  aria-label={`${preference.left}에서 ${preference.right} 사이의 취향 값`}
                  aria-valuetext={`${preference.value}점`}
                  onInput={handlePreferenceInput}
                />
              </PreferenceItem>
            ))}
          </PreferenceList>
        </Panel>

        <Panel>
          <SectionHeader>
            <SectionTitle>내 MCM 제품</SectionTitle>
            <ProductTotal>{products.length}개</ProductTotal>
          </SectionHeader>

          <ProductList>
            {products.map((product) => (
              <ProductItem key={product.id}>
                <ProductIdentity>
                  <ProductIcon src={product.icon} alt="" aria-hidden="true" />
                  <ProductName>{product.name}</ProductName>
                </ProductIdentity>
                <ProductMeta>
                  <ProductCount>{product.count}</ProductCount>
                  <RemoveButton type="button" aria-label={`${product.name} 삭제`}>
                    <RemoveIcon src={closeIcon} alt="" aria-hidden="true" />
                  </RemoveButton>
                </ProductMeta>
              </ProductItem>
            ))}
          </ProductList>

          <TagButton type="button" $variant="secondary">
            <AddIcon src={addIcon} alt="" aria-hidden="true" />
            새 제품 태그하기
          </TagButton>
        </Panel>

        <AccountPanel aria-label="설정">
          {settings.map((setting) => (
            <SettingRow type="button" key={setting.label}>
              <SettingLabel>{setting.label}</SettingLabel>
              <SettingState>{setting.state}</SettingState>
              <ChevronIcon src={chevronRightIcon} alt="" aria-hidden="true" />
            </SettingRow>
          ))}
          <SettingRow type="button">
            <LogoutLabel>로그아웃</LogoutLabel>
            <ChevronIcon src={chevronRightIcon} alt="" aria-hidden="true" />
          </SettingRow>
        </AccountPanel>
      </Content>

      <NavigationBoundary>
        <NavBar />
      </NavigationBoundary>
    </PageShell>
  )
}

export default MyPage

const PageShell = styled.main`
  width: 100%;
  max-width: 402px;
  height: 100vh;
  margin: 0 auto;
  overflow-y: auto;
  scrollbar-width: none;
  background: var(--Background-Base);
  color: var(--Text-Primary);

  &::-webkit-scrollbar {
    display: none;
  }
`

const Content = styled.div`
  width: 100%;
  max-width: 402px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 24px 115px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--Background-Base);
`

const ProfileSection = styled.section`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 15px;
`

const Avatar = styled.div`
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: #e7d7c6;
  overflow: hidden;
`

const AvatarIcon = styled.img`
  width: 36px;
  height: 36px;
  display: block;
`

const ProfileText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
`

const UserName = styled.h1`
  color: #1f2937;
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
`

const AccountType = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const StatsGrid = styled.section`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`

const StatCard = styled.article`
  min-width: 0;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 8px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);
  text-align: center;
`

const StatValue = styled.strong`
  color: #1f2937;
  font: var(--text-ui-h3);
`

const StatLabel = styled.span`
  color: #6b7280;
  font: var(--text-ui-nav);
  white-space: nowrap;
`

const Panel = styled.section`
  width: 100%;
  padding: 25px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: 16px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);
  overflow: hidden;
`

const SectionHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const SectionTitle = styled.h2`
  min-width: 0;
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
`

const RelearnButton = styled.button`
  flex: 0 0 auto;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 3px;
    border-radius: 3px;
  }
`

const RefreshIcon = styled.img`
  width: 13px;
  height: 13px;
  display: block;
`

const PreferenceList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const PreferenceItem = styled.label`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`

const PreferenceLabels = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  color: var(--Text-Secondary);
  font: 400 11px/18px var(--font-sans);
`

const PreferenceSlider = styled.input`
  width: 100%;
  height: 20px;
  margin: 0;
  padding: 0;
  display: block;
  -webkit-appearance: none;
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  touch-action: none;

  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 1px;
    background: linear-gradient(
      to right,
      rgb(181 118 59 / 50%) 0 var(--slider-progress),
      var(--Border-Default) var(--slider-progress) 100%
    );
  }

  &::-webkit-slider-thumb {
    width: 10px;
    height: 10px;
    margin-top: -4.5px;
    -webkit-appearance: none;
    appearance: none;
    border: 0;
    border-radius: 50%;
    background: var(--Primary-Cognac);
  }

  &::-moz-range-track {
    width: 100%;
    height: 1px;
    border: 0;
    background: linear-gradient(
      to right,
      rgb(181 118 59 / 50%) 0 var(--slider-progress),
      var(--Border-Default) var(--slider-progress) 100%
    );
  }

  &::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border: 0;
    border-radius: 50%;
    background: var(--Primary-Cognac);
  }

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 3px;
    border-radius: 5px;
  }
`

const ProductTotal = styled.span`
  flex: 0 0 auto;
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
`

const ProductList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const ProductItem = styled.article`
  width: 100%;
  min-height: 38px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 8px;
  background: var(--Background-Base);
`

const ProductIdentity = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`

const ProductIcon = styled.img`
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: block;
`

const ProductName = styled.p`
  min-width: 0;
  overflow: hidden;
  color: #1f2937;
  font: 400 13px/18px var(--font-sans);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ProductMeta = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 11px;
`

const ProductCount = styled.span`
  color: #6b7280;
  font: var(--text-ui-nav);
  white-space: nowrap;
`

const RemoveButton = styled.button`
  width: 16px;
  height: 16px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 2px;
    border-radius: 2px;
  }
`

const RemoveIcon = styled.img`
  width: 16px;
  height: 16px;
  display: block;
  object-fit: cover;
`

const TagButton = styled(Button)`
  height: 44px;
  border-color: rgb(181 118 59 / 50%);
  border-radius: 22px;
  color: var(--Primary-Cognac);
  background: transparent;
  font: var(--text-ui-button);

  &:hover {
    border-color: var(--Primary-Cognac);
  }

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 3px;
  }
`

const AddIcon = styled.img`
  width: 12px;
  height: 12px;
  display: block;
`

const AccountPanel = styled.section`
  width: 100%;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);
  overflow: hidden;
`

const SettingRow = styled.button`
  width: 100%;
  min-height: 47px;
  padding: 14px 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 0;
  border-bottom: 1px solid rgb(222 211 198 / 70%);
  background: transparent;
  color: var(--Text-Primary);
  text-align: left;
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }

  &:focus-visible {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: -2px;
  }
`

const SettingLabel = styled.span`
  min-width: 0;
  flex: 1 1 auto;
  font: var(--text-ui-label);
`

const SettingState = styled.span`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const LogoutLabel = styled(SettingLabel)`
  color: var(--Text-Secondary);
`

const ChevronIcon = styled.img`
  width: 5px;
  height: 10px;
  flex: 0 0 5px;
  display: block;
`

const NavigationBoundary = styled.div`
  nav {
    width: min(100%, 402px);
    left: 50%;
    transform: translateX(-50%);
  }
`
