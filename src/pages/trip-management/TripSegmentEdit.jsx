import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'

const dateOptions = [
  '2024.11.01',
  '2024.11.02',
  '2024.11.03',
  '2024.11.04',
  '2024.11.05',
]

const pinOptions = [
  '핀 #1 · 고토 아라시야마',
  '핀 #2 · 후시미 이나리',
  '핀 #3 · 기온 거리',
  '핀 #4 · 철학의 길',
  '핀 #5 · 난젠지',
]

const pinList = [
  {
    id: 1,
    title: '핀 #1 · 고토 아라시야마',
    meta: '2024.11.01 오전 10:24 · 사진',
    checked: true,
  },
  {
    id: 2,
    title: '핀 #2 · 후시미 이나리',
    meta: '2024.11.01 오후 2:11 · 사진',
    checked: true,
  },
  {
    id: 3,
    title: '핀 #3 · 기온 거리',
    meta: '2024.11.02 오전 11:05 · 사진',
    checked: true,
  },
  {
    id: 4,
    title: '핀 #4 · 철학의 길',
    meta: '2024.11.02 오후 3:48 · 사진',
    checked: false,
  },
  {
    id: 5,
    title: '핀 #5 · 난젠지',
    meta: '2024.11.03 오전 9:30 · 사진',
    checked: true,
  },
]

const TripSegmentEdit = () => {
  return (
    <>
      <PageHeader>
        <BackLink to="/trip-management" aria-label="여행 구간 관리 화면으로 돌아가기">
          &lt;
        </BackLink>
        <HeaderTitle>구간 상세·편집 화면</HeaderTitle>
      </PageHeader>

      <TripSegmentEditWrapper>
        <FormSection>
          <FieldGroup>
            <Label htmlFor="segmentName">구간 이름</Label>
            <TextInput id="segmentName" type="text" />
          </FieldGroup>

          <FormGroupTitle>여행 기간</FormGroupTitle>
          <TwoColumnGrid>
            <FieldGroup>
              <Label htmlFor="startDate">시작일</Label>
              <Select id="startDate" defaultValue="">
                <option value="" disabled>
                  Select...
                </option>
                {dateOptions.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </Select>
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="endDate">종료일</Label>
              <Select id="endDate" defaultValue="">
                <option value="" disabled>
                  Select...
                </option>
                {dateOptions.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </TwoColumnGrid>
        </FormSection>

        <FormSection>
          <FormGroupTitle>포함 핀 범위</FormGroupTitle>
          <TwoColumnGrid>
            <FieldGroup>
              <Label htmlFor="firstPin">첫 번째 핀</Label>
              <Select id="firstPin" defaultValue="">
                <option value="" disabled>
                  Select...
                </option>
                {pinOptions.map((pin) => (
                  <option key={pin} value={pin}>
                    {pin}
                  </option>
                ))}
              </Select>
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="lastPin">마지막 핀</Label>
              <Select id="lastPin" defaultValue="">
                <option value="" disabled>
                  Select...
                </option>
                {pinOptions.map((pin) => (
                  <option key={pin} value={pin}>
                    {pin}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </TwoColumnGrid>
        </FormSection>

        <FormSection>
          <SectionTitle>핀 목록</SectionTitle>
          <PinList>
            {pinList.map((pin) => (
              <Card key={pin.id} $padding="12px">
                <PinItem>
                  <PinText>
                    <PinTitle>{pin.title}</PinTitle>
                    <PinMeta>{pin.meta}</PinMeta>
                  </PinText>
                  <Checkbox
                    type="checkbox"
                    defaultChecked={pin.checked}
                    aria-label={`${pin.title} 선택`}
                  />
                </PinItem>
              </Card>
            ))}
          </PinList>
        </FormSection>

        <SummaryCard $padding="12px">
          <SummaryRow>
            <SummaryLabel>선택한 핀</SummaryLabel>
            <SummaryValue>4개</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>연결된 사진</SummaryLabel>
            <SummaryValue>19장</SummaryValue>
          </SummaryRow>
        </SummaryCard>

        <ActionArea>
          <SaveButton as={Link} to='/trip-management'>변경사항 저장</SaveButton>
        </ActionArea>
      </TripSegmentEditWrapper>
    </>
  )
}

export default TripSegmentEdit

const PageHeader = styled.header`
  width: 100%;
  height: 50px;
  border: 1px solid #ddd;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
`

const BackLink = styled(Link)`
  width: 40px;
  height: 100%;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 12px;
  text-decoration: none;
  font-size: 22px;
  line-height: 1;
`

const HeaderTitle = styled.h1`
  color: #111827;
  font-size: 16px;
  font-weight: 700;
`

const TripSegmentEditWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 74px 24px 32px;
`

const FormSection = styled.section`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const FormGroupTitle = styled.h2`
  color: #111827;
  font-size: 14px;
  font-weight: 600;
`

const SectionTitle = styled.h2`
  color: #111827;
  font-size: 14px;
  font-weight: 600;
`

const FieldGroup = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  color: #111827;
  font-size: 13px;
`

const TextInput = styled.input`
  width: 100%;
  height: 34px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 10px;
  color: #111827;
  background: #fff;
  font-size: 14px;
`

const Select = styled.select`
  width: 100%;
  height: 34px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 10px;
  color: #6b7280;
  background: #fff;
  font-size: 13px;
`

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`

const PinList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PinItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const PinText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const PinTitle = styled.p`
  color: #111827;
  font-size: 13px;
  font-weight: 600;
`

const PinMeta = styled.p`
  color: #555;
  font-size: 12px;
`

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  accent-color: #111827;
`

const SummaryCard = styled(Card)`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const SummaryLabel = styled.span`
  color: #555;
  font-size: 12px;
`

const SummaryValue = styled.strong`
  color: #111827;
  font-size: 13px;
  font-weight: 600;
`

const ActionArea = styled.div`
  margin-top: 14px;
  width: 124px;
`

const SaveButton = styled(Button)`
  min-height: 34px;
  border-color: #111827;
  background: #111827;
  color: #fff;
  font-size: 13px;
`
