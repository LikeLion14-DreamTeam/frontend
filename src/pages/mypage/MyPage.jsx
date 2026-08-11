import React, { useState } from 'react'
import styled from 'styled-components'
import NavBar from '../../components/layout/NavBar'

const stats = [
  { label: '태깅 횟수', value: 12 },
  { label: '완료 여정', value: 2 },
  { label: '방문 도시', value: 4 },
]

const preferenceItems = [
  { id: 'brightness', left: '밝은', right: '어두운', value: 30 },
  { id: 'tone', left: '선명한', right: '차분한', value: 76 },
  { id: 'temperature', left: '웜', right: '쿨', value: 22 },
  { id: 'density', left: '여백 많은', right: '꽉 찬', value: 26 },
  { id: 'crop', left: '클로즈업', right: '넓게', value: 83 },
  { id: 'angle', left: '정면', right: '뒷모습·옆모습', value: 56 },
]

const products = [
  { id: 1, name: '비세토스 백팩', count: '9회 태깅' },
  { id: 2, name: '로고 참 키링', count: '3회 태깅' },
]

const MyPage = () => {
  const [preferences, setPreferences] = useState(
    preferenceItems.reduce((acc, item) => {
      acc[item.id] = item.value
      return acc
    }, {}),
  )

  const handlePreferenceChange = (id, value) => {
    setPreferences((prev) => ({
      ...prev,
      [id]: Number(value),
    }))
  }

  return (
    <>
      <PageShell>
        <PageHeader>마이페이지</PageHeader>

        <ProfileSection>
          <Avatar aria-hidden="true" />
          <ProfileText>
            <UserName>대왕김치만두</UserName>
            <AccountType>Google 계정</AccountType>
          </ProfileText>
        </ProfileSection>

        <StatsGrid>
          {stats.map((stat) => (
            <StatCard key={stat.label}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>

        <PreferenceCard>
          <SectionHeader>
            <SectionTitle>취향 프로필</SectionTitle>
            <TextButton type="button">재학습</TextButton>
          </SectionHeader>

          <PreferenceList>
            {preferenceItems.map((item) => (
              <PreferenceRow key={item.id}>
                <PreferenceLabels>
                  <span>{item.left}</span>
                  <span>{item.right}</span>
                </PreferenceLabels>
                <PreferenceSlider
                  type="range"
                  min="0"
                  max="100"
                  value={preferences[item.id]}
                  aria-label={`${item.left}와 ${item.right} 취향 조절`}
                  onChange={(event) => handlePreferenceChange(item.id, event.target.value)}
                />
              </PreferenceRow>
            ))}
          </PreferenceList>
        </PreferenceCard>

        <Section>
          <SectionTitle>내 MCM 제품</SectionTitle>
          <ProductList>
            {products.map((product) => (
              <ProductItem key={product.id}>
                <ProductName>{product.name}</ProductName>
                <ProductCount>{product.count}</ProductCount>
              </ProductItem>
            ))}
          </ProductList>
          <TagButton type="button">+ 새 제품 태그하기</TagButton>
        </Section>

        <Section>
          <SectionTitle>계정</SectionTitle>
          <SettingList>
            <SettingItem>
              <span>위치 권한</span>
              <SettingState>허용됨</SettingState>
            </SettingItem>
            <LogoutButton type="button">로그아웃</LogoutButton>
          </SettingList>
        </Section>
      </PageShell>

      <NavBar />
    </>
  )
}

export default MyPage

const PageShell = styled.main`
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 0 24px 104px;
  background: #fff;
  color: #1f2937;
  font-family: var(--font-sans);
`

const PageHeader = styled.h1`
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 16px;
  font-weight: 500;
`

const ProfileSection = styled.section`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 0 16px;
`

const Avatar = styled.div`
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  border-radius: 50%;
  background: #d9dee6;
`

const ProfileText = styled.div`
  min-width: 0;
`

const UserName = styled.p`
  color: #111827;
  font-size: 18px;
  font-weight: 700;
`

const AccountType = styled.p`
  margin-top: 4px;
  color: #6b7280;
  font-size: 14px;
`

const StatsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`

const StatCard = styled.article`
  min-height: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f8fafc;
`

const StatValue = styled.strong`
  color: #111827;
  font-size: 24px;
  line-height: 1;
`

const StatLabel = styled.span`
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
`

const PreferenceCard = styled.section`
  margin-top: 28px;
  border-radius: 8px;
  padding: 18px 16px 16px;
  background: #f8fafc;
`

const Section = styled.section`
  margin-top: 28px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const SectionTitle = styled.h2`
  color: #111827;
  font-size: 16px;
  font-weight: 700;
`

const TextButton = styled.button`
  border: 0;
  background: transparent;
  color: #2f80ed;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
`

const PreferenceList = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const PreferenceRow = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const PreferenceLabels = styled.div`
  display: flex;
  justify-content: space-between;
  color: #8a8a82;
  font-size: 12px;
`

const PreferenceSlider = styled.input`
  width: 100%;
  height: 18px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 999px;
    background: #e3e1d8;
  }

  &::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
    margin-top: -5px;
    appearance: none;
    border: 0;
    border-radius: 50%;
    background: #0f73b7;
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 999px;
    background: #e3e1d8;
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: #0f73b7;
  }

  &:focus-visible {
    outline: 2px solid #2f80ed;
    outline-offset: 4px;
  }
`

const ProductList = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ProductItem = styled.article`
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 8px;
  padding: 0 16px;
  background: #f8fafc;
`

const ProductName = styled.p`
  min-width: 0;
  color: #1f2937;
  font-size: 15px;
`

const ProductCount = styled.span`
  flex: 0 0 auto;
  color: #6b7280;
  font-size: 13px;
`

const TagButton = styled.button`
  width: 100%;
  min-height: 48px;
  margin-top: 10px;
  border: 0;
  background: transparent;
  color: #6b7280;
  font-size: 15px;
  cursor: pointer;
`

const SettingList = styled.div`
  margin-top: 12px;
  border-top: 1px solid #e5e7eb;
`

const SettingItem = styled.div`
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
  font-size: 15px;
`

const SettingState = styled.span`
  color: #6b7280;
  font-size: 13px;
`

const LogoutButton = styled.button`
  width: 100%;
  min-height: 50px;
  border: 0;
  border-bottom: 1px solid #e5e7eb;
  background: transparent;
  color: #9f1d1d;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
`
