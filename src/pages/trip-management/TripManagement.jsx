import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../../components/common/Card'
import Header from '../../components/layout/Header'
import NavBar from '../../components/layout/NavBar'

const segment = {
  name: '파리 · 베르사유',
  period: '2024.11.03 – 11.10',
  duration: '8일간의 구간',
  pinRange: '핀 1 – 핀 7',
}

const settings = [
  { label: '구간 이름', value: segment.name },
  { label: '여행 기간', value: '11.03 – 11.10' },
  { label: '포함 핀 범위', value: segment.pinRange },
]

const metrics = [
  { label: '선택된 핀', value: '12' },
  { label: '연결된 사진', value: '2' },
]

const includedPins = [
  {
    id: 1,
    label: '핀 1',
    title: '파리 에펠탑 근처',
    meta: '11.03 오전 10:24 · 사진 8장',
  },
  {
    id: 2,
    label: '핀 2',
    title: '루브르 박물관 앞',
    meta: '11.04 오후 2:11 · 사진 6장',
  },
  {
    id: 3,
    label: '핀 3',
    title: '몽마르트르 언덕',
    meta: '11.05 오전 11:05 · 사진 11장',
  },
  {
    id: 5,
    label: '핀 5',
    title: '베르사유 궁전 정원',
    meta: '11.08 오전 9:30 · 사진 7장',
  },
]

const TripManagement = () => {
  return (
    <PageSurface>
      <Header
        to="/archive"
        height="104px"
        topPadding="58px"
        barHeight="24px"
        rightContent={<EditLink to="/trip-management/edit">구간 편집</EditLink>}
      />

      <TripManagementWrapper>
        <SegmentIdentity>
          <SegmentText>
            <SegmentTitle>{segment.name}</SegmentTitle>
            <SegmentMeta>
              {segment.period} · {segment.duration}
            </SegmentMeta>
          </SegmentText>
        </SegmentIdentity>

        <SettingsCard>
          {settings.map((item, index) => (
            <React.Fragment key={item.label}>
              <SettingRow>
                <SettingLabel>{item.label}</SettingLabel>
                <SettingValue>{item.value}</SettingValue>
              </SettingRow>
              {index < settings.length - 1 ? <Divider /> : null}
            </React.Fragment>
          ))}
        </SettingsCard>

        <StatsGrid aria-label="구간 요약">
          {metrics.map((metric) => (
            <MetricCard key={metric.label}>
              <MetricValue>{metric.value}</MetricValue>
              <MetricLabel>{metric.label}</MetricLabel>
            </MetricCard>
          ))}
        </StatsGrid>

        <PinSection>
          <SectionHeader>
            <SectionTitle>포함된 핀 기록</SectionTitle>
            <SectionMeta>시간순</SectionMeta>
          </SectionHeader>

          <PinList>
            {includedPins.map((pin) => (
              <PinCard key={pin.id}>
                <PinNumber>{pin.label}</PinNumber>
                <PinText>
                  <PinTitle>{pin.title}</PinTitle>
                  <PinMeta>{pin.meta}</PinMeta>
                </PinText>
              </PinCard>
            ))}
          </PinList>
        </PinSection>
      </TripManagementWrapper>

      <NavBar activeOverride="archive" />
    </PageSurface>
  )
}

export default TripManagement

const EditLink = styled(Link)`
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
  text-decoration: none;
  white-space: nowrap;
`

const PageSurface = styled.div`
  width: 100%;
  min-height: 100vh;
`

const TripManagementWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: calc(100vh - 104px);
  margin: 0 auto;
  padding: 0 24px 99px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: var(--Text-Primary);
`

const SegmentIdentity = styled.section`
  width: 100%;
  display: flex;
  align-items: center;
`

const SegmentText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const SegmentTitle = styled.h2`
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
`

const SegmentMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const SettingsCard = styled(Card)`
  border: 0;
  border-radius: 16px;
  padding: 4px 16px;
  background: var(--Surface-Base);
`

const SettingRow = styled.div`
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 10px;
`

const SettingLabel = styled.p`
  flex: 1;
  min-width: 0;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const SettingValue = styled.p`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: var(--Border-Default);
  opacity: 0.7;
`

const StatsGrid = styled.section`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`

const MetricCard = styled(Card)`
  min-height: 65px;
  border: 0;
  border-radius: 8px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: var(--Surface-Base);
  box-shadow: var(--Effect-Chip);
  text-align: center;
`

const MetricValue = styled.p`
  color: #1f2937;
  font: var(--text-ui-h3);
`

const MetricLabel = styled.p`
  color: #6b7280;
  font: var(--text-ui-nav);
`

const PinSection = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const SectionHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
`

const SectionTitle = styled.h3`
  flex: 1;
  min-width: 0;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const SectionMeta = styled.p`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const PinList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const PinCard = styled(Card)`
  min-height: 70px;
  border: 0;
  border-radius: 12px;
  padding: 11px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--Surface-Base);
`

const PinNumber = styled.p`
  width: 30px;
  flex: 0 0 30px;
  color: var(--Secondary-Taupe);
  font: var(--text-ui-nav);
`

const PinText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const PinTitle = styled.p`
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const PinMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`
