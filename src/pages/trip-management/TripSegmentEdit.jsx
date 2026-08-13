import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Header from '../../components/layout/Header'
import checkboxCheckedIcon from '../../assets/icons/trip-checkbox-checked.svg'
import editBackIcon from '../../assets/icons/trip-edit-back.svg'
import selectChevronIcon from '../../assets/icons/trip-select-chevron.svg'

const dateOptions = [
  '2024.11.03',
  '2024.11.04',
  '2024.11.05',
  '2024.11.06',
  '2024.11.07',
  '2024.11.08',
  '2024.11.09',
  '2024.11.10',
]

const pinOptions = [
  { value: 'pin-1', label: '핀 1 · 파리 에펠탑 근처' },
  { value: 'pin-2', label: '핀 2 · 루브르 박물관 앞' },
  { value: 'pin-3', label: '핀 3 · 몽마르트르 언덕' },
  { value: 'pin-4', label: '핀 4 · 센 강변 산책로' },
  { value: 'pin-7', label: '핀 7 · 베르사유 궁전 정원' },
]

const pins = [
  {
    id: 1,
    label: '핀 1',
    title: '파리 에펠탑 근처',
    meta: '11.03 오전 10:24 · 사진 8장',
    checked: true,
  },
  {
    id: 2,
    label: '핀 2',
    title: '루브르 박물관 앞',
    meta: '11.04 오후 2:11 · 사진 6장',
    checked: true,
  },
  {
    id: 3,
    label: '핀 3',
    title: '몽마르트르 언덕',
    meta: '11.05 오전 11:05 · 사진 11장',
    checked: true,
  },
  {
    id: 4,
    label: '핀 4',
    title: '센 강변 산책로',
    meta: '11.06 오후 3:48 · 사진 5장',
    checked: true,
  },
  {
    id: 5,
    label: '핀 5',
    title: '베르사유 궁전 정원',
    meta: '11.08 오전 9:30 · 사진 7장',
    checked: true,
  },
]

const TripSegmentEdit = () => {
  return (
    <PageSurface>
      <Header
        to="/trip-management"
        title="구간 편집"
        height="136px"
        topPadding="58px"
        barHeight="50px"
        borderBottom
        iconSrc={editBackIcon}
        iconWidth="20px"
        iconHeight="14px"
      />

      <TripSegmentEditWrapper>
        <InfoSection>
          <SectionTitle>구간 정보</SectionTitle>

          <FieldGroup>
            <FieldLabel htmlFor="segmentName">구간 이름</FieldLabel>
            <TextInput id="segmentName" type="text" aria-label="구간 이름" />
          </FieldGroup>

          <DateGrid>
            <FieldGroup>
              <FieldLabel htmlFor="startDate">시작일</FieldLabel>
              <SelectShell>
                <Select id="startDate" defaultValue="2024.11.03">
                  {dateOptions.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </Select>
                <ChevronIcon src={selectChevronIcon} alt="" aria-hidden="true" />
              </SelectShell>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="endDate">종료일</FieldLabel>
              <SelectShell>
                <Select id="endDate" defaultValue="2024.11.10">
                  {dateOptions.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </Select>
                <ChevronIcon src={selectChevronIcon} alt="" aria-hidden="true" />
              </SelectShell>
            </FieldGroup>
          </DateGrid>
        </InfoSection>

        <EditSection>
          <RangeSection>
            <SectionTitle>포함 핀 범위</SectionTitle>
            <SectionDescription>
              범위를 바꾸면 아래 목록이 자동으로 다시 선택돼요
            </SectionDescription>

            <RangeSelectRow>
              <RangeLabel>첫 번째 핀</RangeLabel>
              <RangeValue>{pinOptions[0].label}</RangeValue>
              <RangeSelect
                id="firstPin"
                defaultValue="pin-1"
                aria-label="첫 번째 핀"
              >
                {pinOptions.map((pin) => (
                  <option key={pin.value} value={pin.value}>
                    {pin.label}
                  </option>
                ))}
              </RangeSelect>
              <ChevronIcon src={selectChevronIcon} alt="" aria-hidden="true" />
            </RangeSelectRow>

            <RangeSelectRow>
              <RangeLabel>마지막 핀</RangeLabel>
              <RangeValue>{pinOptions[4].label}</RangeValue>
              <RangeSelect
                id="lastPin"
                defaultValue="pin-7"
                aria-label="마지막 핀"
              >
                {pinOptions.map((pin) => (
                  <option key={pin.value} value={pin.value}>
                    {pin.label}
                  </option>
                ))}
              </RangeSelect>
              <ChevronIcon src={selectChevronIcon} alt="" aria-hidden="true" />
            </RangeSelectRow>
          </RangeSection>

          <PinSection>
            <ListHeader>
              <ListTitle>핀 목록</ListTitle>
              <ListMeta>5개 중 5개 선택</ListMeta>
            </ListHeader>

            <PinAndResult>
              <PinList>
                {pins.map((pin) => (
                  <PinRow key={pin.id}>
                    <PinNumber>{pin.label}</PinNumber>
                    <PinText>
                      <PinTitle>{pin.title}</PinTitle>
                      <PinMeta>{pin.meta}</PinMeta>
                    </PinText>
                    <PinCheckboxWrap>
                      <PinCheckbox
                        type="checkbox"
                        defaultChecked={pin.checked}
                        aria-label={`${pin.title} 선택`}
                      />
                      <PinCheckboxVisual aria-hidden="true">
                        <PinCheckboxIcon src={checkboxCheckedIcon} alt="" />
                      </PinCheckboxVisual>
                    </PinCheckboxWrap>
                  </PinRow>
                ))}
              </PinList>

              <ResultCard>
                <ResultRow>
                  <ResultLabel>선택한 핀</ResultLabel>
                  <ResultValue>5개</ResultValue>
                </ResultRow>
                <ResultDivider />
                <ResultRow>
                  <ResultLabel>연결된 사진</ResultLabel>
                  <ResultValue>37장</ResultValue>
                </ResultRow>
              </ResultCard>
            </PinAndResult>
          </PinSection>
        </EditSection>

        <Footer>
          <SaveButton as={Link} to="/trip-management">
            변경사항 저장
          </SaveButton>
        </Footer>
      </TripSegmentEditWrapper>
    </PageSurface>
  )
}

export default TripSegmentEdit

const PageSurface = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--Background-Base);
`

const TripSegmentEditWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: calc(100vh - 136px);
  margin: 0 auto;
  padding: 0 24px 36px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  background: var(--Background-Base);
  color: var(--Text-Primary);
`

const InfoSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 15px;
`

const EditSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 25px;
`

const RangeSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PinSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const SectionTitle = styled.h2`
  color: var(--Text-Primary);
  font: var(--text-ui-h3);
`

const SectionDescription = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const FieldGroup = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
`

const FieldLabel = styled.label`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const TextInput = styled.input`
  width: 100%;
  height: 45px;
  border: 1.5px solid var(--Border-Strong);
  border-radius: 10px;
  padding: 0 15px;
  color: var(--Text-Primary);
  background: var(--Background-Base);
  font: var(--text-ui-label);
  outline: none;

  &:focus {
    border-color: var(--Primary-Cognac);
  }
`

const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`

const SelectShell = styled.div`
  position: relative;
  width: 100%;
  height: 45px;
`

const Select = styled.select`
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 12px;
  padding: 0 38px 0 14px;
  color: var(--Text-Primary);
  background: var(--Surface-Base);
  font: var(--text-ui-label);
  appearance: none;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 1.5px var(--Border-Strong);
  }
`

const RangeSelectRow = styled(Card)`
  position: relative;
  width: 100%;
  height: 45px;
  border: 0;
  border-radius: 12px;
  padding: 0 36px 0 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--Surface-Base);
`

const RangeLabel = styled.label`
  width: 66px;
  flex: 0 0 66px;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const RangeValue = styled.p`
  min-width: 0;
  flex: 1;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const RangeSelect = styled.select`
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  color: transparent;
  opacity: 0;
  appearance: none;
  cursor: pointer;
  outline: none;
`

const ChevronIcon = styled.img`
  position: absolute;
  top: 50%;
  right: 14px;
  width: 11.5px;
  height: 6.5px;
  display: block;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 2;
`

const ListHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
`

const ListTitle = styled.h3`
  flex: 1;
  min-width: 0;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
`

const ListMeta = styled.p`
  flex: 0 0 auto;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const PinAndResult = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
`

const PinList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const PinRow = styled.label`
  width: 100%;
  min-height: 70px;
  border-radius: 12px;
  padding: 11px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--Surface-Base);
  cursor: pointer;
  transition:
    opacity 160ms ease,
    background-color 160ms ease;

  &:has(input:not(:checked)) {
    background: var(--Surface-Base);
    opacity: 0.5;
  }
`

const PinNumber = styled.p`
  width: 30px;
  flex: 0 0 30px;
  color: var(--Secondary-Taupe);
  font: var(--text-ui-nav);
`

const PinText = styled.div`
  min-width: 0;
  flex: 1;
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

const PinCheckboxWrap = styled.span`
  position: relative;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  cursor: inherit;
`

const PinCheckbox = styled.input`
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;

  &:checked + span {
    border-color: transparent;
  }

  &:checked + span img {
    opacity: 1;
  }

  &:focus-visible + span {
    outline: 2px solid var(--Primary-Cognac);
    outline-offset: 2px;
  }
`

const PinCheckboxVisual = styled.span`
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border: 1.5px solid var(--Border-Strong);
  border-radius: 6px;
  background: transparent;
  pointer-events: none;
  transition:
    border-color 160ms ease;
`

const PinCheckboxIcon = styled.img`
  position: absolute;
  inset: 0;
  width: 22px;
  height: 22px;
  display: block;
  opacity: 0;
  transition: opacity 160ms ease;
`

const ResultCard = styled(Card)`
  border: 0;
  border-radius: 14px;
  padding: 4px 16px;
  background: rgb(181 118 59 / 9%);
`

const ResultRow = styled.div`
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const ResultLabel = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

const ResultValue = styled.p`
  color: var(--Primary-Cognac);
  font: var(--text-ui-label);
`

const ResultDivider = styled.div`
  width: 100%;
  height: 1px;
  background: var(--Primary-Cognac);
  opacity: 0.2;
`

const Footer = styled.footer`
  width: 100%;
  display: flex;
  justify-content: center;
`

const SaveButton = styled(Button)`
  height: 52px;
  border: 0;
  border-radius: 26px;
  color: var(--Text-Inverse);
  background: var(--Primary-Cognac);
  font: var(--text-ui-button);
  text-decoration: none;
`
