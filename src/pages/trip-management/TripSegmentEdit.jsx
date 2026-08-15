import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import Header from '../../components/layout/Header'
import checkboxCheckedIcon from '../../assets/icons/trip-checkbox-checked.svg'
import deleteWarningIcon from '../../assets/icons/trip-delete-warning.svg'
import editBackIcon from '../../assets/icons/trip-edit-back.svg'
import selectChevronIcon from '../../assets/icons/trip-select-chevron.svg'
import {
  deleteTrip,
  getTrip,
  getTripPins,
  updateTrip,
} from '../../features/trips/tripApi'

// 아직 포토북에서 넘어오는 경로가 없어 segmentId 가 비면 이 값을 쓴다.
const FALLBACK_SEGMENT_ID = 12

const pad2 = (value) => String(value).padStart(2, '0')

const formatDateValue = (isoString) => {
  if (!isoString) return ''

  const date = new Date(isoString)

  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

const formatDateRange = (startAt, endAt) => {
  const start = formatDateValue(startAt)
  const end = formatDateValue(endAt)

  if (!start) return end
  if (!end) return start

  const compactEnd = start.slice(0, 4) === end.slice(0, 4)
    ? end.slice(5)
    : end

  return `${start} – ${compactEnd}`
}

const getTripDeleteMeta = (trip) =>
  [
    formatDateRange(trip.start_at, trip.end_at),
    typeof trip.pin_count === 'number' ? `핀 ${trip.pin_count}개` : '',
    typeof trip.photo_count === 'number' ? `사진 ${trip.photo_count}장` : '',
    // TODO: API 명세 4.2 구간 상세 응답에 voice_memo_count가 추가되면
    // 백엔드 집계 값을 받아 삭제 대상 요약에 표시한다.
    typeof trip.voice_memo_count === 'number'
      ? `음성 ${trip.voice_memo_count}개`
      : '',
  ]
    .filter(Boolean)
    .join(' · ')

const pinTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const formatPinTime = (taggedAt) =>
  taggedAt ? pinTimeFormatter.format(new Date(taggedAt)) : ''

const TripSegmentEdit = () => {
  const navigate = useNavigate()
  const { segmentId = FALLBACK_SEGMENT_ID } = useParams()

  const [trip, setTrip] = useState(null)
  const [pins, setPins] = useState([])
  const [name, setName] = useState('')
  const [includedIds, setIncludedIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [tripData, pinData] = await Promise.all([
          getTrip(segmentId),
          getTripPins(segmentId),
        ])

        if (ignore) return

        setTrip(tripData)
        setPins(pinData.pins)
        setName(tripData.name)
        setIncludedIds(
          pinData.pins
            .filter((pin) => pin.included_in_segment)
            .map((pin) => pin.pin_id),
        )
      } catch (error) {
        if (ignore) return
        setErrorMessage(error.message)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [segmentId])

  const includedSet = useMemo(() => new Set(includedIds), [includedIds])

  const pinOptions = pins.map((pin, index) => ({
    value: String(pin.pin_id),
    label: `핀 ${index + 1} · ${pin.place_name || '이름 없는 장소'}`,
  }))

  const includedIndexes = pins
    .map((pin, index) => (includedSet.has(pin.pin_id) ? index : -1))
    .filter((index) => index >= 0)

  const firstIncludedIndex = includedIndexes[0] ?? 0
  const lastIncludedIndex = includedIndexes.at(-1) ?? pins.length - 1

  /** 범위를 바꾸면 그 사이 핀만 선택 상태로 다시 맞춘다. */
  const applyRange = (startIndex, endIndex) => {
    const [from, to] =
      startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex]

    setIncludedIds(pins.slice(from, to + 1).map((pin) => pin.pin_id))
  }

  const togglePin = (pinId) => {
    setIncludedIds((prev) =>
      prev.includes(pinId)
        ? prev.filter((id) => id !== pinId)
        : [...prev, pinId],
    )
  }

  const handleSave = async () => {
    // 명세 4.3: 핀을 하나도 남기지 않고 전부 제외하면 VALIDATION_ERROR
    if (includedIds.length === 0) {
      setErrorMessage('핀을 최소 한 개는 남겨야 저장할 수 있습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      await updateTrip(segmentId, {
        name,
        pinInclusions: pins.map((pin) => ({
          pin_id: pin.pin_id,
          included_in_segment: includedSet.has(pin.pin_id),
        })),
      })

      navigate(`/trip-management/${segmentId}`)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setErrorMessage('')

    try {
      await deleteTrip(segmentId)
      // 구간과 함께 포토북까지 사라지므로 목록으로 보내고 뒤로가기를 막는다.
      navigate('/archive', { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
      setIsDeleting(false)
      setIsConfirmingDelete(false)
    }
  }

  return (
    <PageSurface>
      <Header
        to={`/trip-management/${segmentId}`}
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
        {isLoading && <StateMessage>불러오는 중...</StateMessage>}

        {!isLoading && !trip && errorMessage && (
          <StateMessage role="alert">{errorMessage}</StateMessage>
        )}

        {!isLoading && trip && (
          <>
            <InfoSection>
              <SectionTitle>구간 정보</SectionTitle>

              <FieldGroup>
                <FieldLabel htmlFor="segmentName">구간 이름</FieldLabel>
                <TextInput
                  id="segmentName"
                  type="text"
                  aria-label="구간 이름"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FieldGroup>

              {/* TODO: 기간 수정 대기.
                  PATCH /trips/{segmentId} Body 에 start_at / end_at 이 없어
                  값을 보낼 수 없다. 백엔드에 추가 요청 후 열어야 한다.
                  그때까지는 서버 값을 읽기 전용으로만 보여준다. */}
              <DateGrid>
                <FieldGroup>
                  <FieldLabel htmlFor="startDate">시작일</FieldLabel>
                  <SelectShell>
                    <Select id="startDate" value={formatDateValue(trip.start_at)} disabled>
                      <option value={formatDateValue(trip.start_at)}>
                        {formatDateValue(trip.start_at)}
                      </option>
                    </Select>
                    <ChevronIcon
                      src={selectChevronIcon}
                      alt=""
                      aria-hidden="true"
                    />
                  </SelectShell>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="endDate">종료일</FieldLabel>
                  <SelectShell>
                    <Select id="endDate" value={formatDateValue(trip.end_at)} disabled>
                      <option value={formatDateValue(trip.end_at)}>
                        {formatDateValue(trip.end_at)}
                      </option>
                    </Select>
                    <ChevronIcon
                      src={selectChevronIcon}
                      alt=""
                      aria-hidden="true"
                    />
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
                  <RangeValue>
                    {pinOptions[firstIncludedIndex]?.label}
                  </RangeValue>
                  <RangeSelect
                    id="firstPin"
                    aria-label="첫 번째 핀"
                    value={pinOptions[firstIncludedIndex]?.value ?? ''}
                    onChange={(event) =>
                      applyRange(
                        pinOptions.findIndex(
                          (option) => option.value === event.target.value,
                        ),
                        lastIncludedIndex,
                      )
                    }
                  >
                    {pinOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </RangeSelect>
                  <ChevronIcon
                    src={selectChevronIcon}
                    alt=""
                    aria-hidden="true"
                  />
                </RangeSelectRow>

                <RangeSelectRow>
                  <RangeLabel>마지막 핀</RangeLabel>
                  <RangeValue>{pinOptions[lastIncludedIndex]?.label}</RangeValue>
                  <RangeSelect
                    id="lastPin"
                    aria-label="마지막 핀"
                    value={pinOptions[lastIncludedIndex]?.value ?? ''}
                    onChange={(event) =>
                      applyRange(
                        firstIncludedIndex,
                        pinOptions.findIndex(
                          (option) => option.value === event.target.value,
                        ),
                      )
                    }
                  >
                    {pinOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </RangeSelect>
                  <ChevronIcon
                    src={selectChevronIcon}
                    alt=""
                    aria-hidden="true"
                  />
                </RangeSelectRow>
              </RangeSection>

              <PinSection>
                <ListHeader>
                  <ListTitle>핀 목록</ListTitle>
                  <ListMeta>
                    {pins.length}개 중 {includedIds.length}개 선택
                  </ListMeta>
                </ListHeader>

                <PinAndResult>
                  <PinList>
                    {pins.map((pin, index) => {
                      const title = pin.place_name || '이름 없는 장소'
                      const hasCoordinates =
                        pin.latitude !== null && pin.longitude !== null

                      return (
                        <PinRow key={pin.pin_id}>
                          <PinNumber>핀 {index + 1}</PinNumber>
                          <PinText>
                            <PinTitle>{title}</PinTitle>
                            <PinMeta>
                              {formatPinTime(pin.tagged_at)}
                              {!hasCoordinates && ' · 위치 정보 없음'}
                            </PinMeta>
                          </PinText>
                          <PinCheckboxWrap>
                            <PinCheckbox
                              type="checkbox"
                              checked={includedSet.has(pin.pin_id)}
                              onChange={() => togglePin(pin.pin_id)}
                              aria-label={`${title} 선택`}
                            />
                            <PinCheckboxVisual aria-hidden="true">
                              <PinCheckboxIcon
                                src={checkboxCheckedIcon}
                                alt=""
                              />
                            </PinCheckboxVisual>
                          </PinCheckboxWrap>
                        </PinRow>
                      )
                    })}
                  </PinList>

                  <ResultCard>
                    <ResultRow>
                      <ResultLabel>선택한 핀</ResultLabel>
                      <ResultValue>{includedIds.length}개</ResultValue>
                    </ResultRow>
                    <ResultDivider />
                    <ResultRow>
                      <ResultLabel>연결된 사진</ResultLabel>
                      {/* 핀별 사진 수가 응답에 없어 실시간 재집계가 불가능하다.
                          저장하면 서버가 다시 계산한 값이 내려온다. */}
                      <ResultValue>{trip.photo_count}장</ResultValue>
                    </ResultRow>
                  </ResultCard>
                </PinAndResult>
              </PinSection>
            </EditSection>

            <Footer>
              {errorMessage && (
                <SaveError role="alert">{errorMessage}</SaveError>
              )}
              <SaveButton
                type="button"
                onClick={handleSave}
                disabled={isSaving || isDeleting}
              >
                {isSaving ? '저장 중...' : '변경사항 저장'}
              </SaveButton>

              <DeleteTrigger
                type="button"
                $variant="ghost"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isSaving || isDeleting}
              >
                구간 삭제하기
              </DeleteTrigger>
            </Footer>
          </>
        )}
      </TripSegmentEditWrapper>

      <ConfirmationModal
        open={trip !== null && isConfirmingDelete}
        title="이 구간을 삭제할까요?"
        confirmLabel={isDeleting ? '구간 삭제 중...' : '구간 삭제하기'}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsConfirmingDelete(false)}
        confirmDisabled={isDeleting}
        cancelDisabled={isDeleting}
        ariaDescribedBy="trip-delete-warning"
      >
        {trip && (
          <TripDeleteModalContent>
            <TripDeleteTargetCard>
              <TripDeleteTargetName>{trip.name}</TripDeleteTargetName>
              <TripDeleteTargetMeta>
                {getTripDeleteMeta(trip)}
              </TripDeleteTargetMeta>
            </TripDeleteTargetCard>
            <TripDeleteWarning id="trip-delete-warning">
              <TripDeleteWarningIcon
                src={deleteWarningIcon}
                alt=""
                aria-hidden="true"
              />
              <span>
                구간에 담긴 핀과 사진, 음성 메모가 모두 함께 삭제돼요. 되돌릴 수 없습니다.
              </span>
            </TripDeleteWarning>
          </TripDeleteModalContent>
        )}
      </ConfirmationModal>
    </PageSurface>
  )
}

export default TripSegmentEdit

const StateMessage = styled.p`
  padding: 24px 0;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
`

const SaveError = styled.p`
  margin-bottom: 10px;
  color: var(--Primary-Cognac);
  font: var(--text-ui-caption);
  text-align: center;
  word-break: keep-all;
`

const DeleteTrigger = styled(Button)`
  width: 100%;
  height: 52px;
  flex: none;
  font: var(--text-ui-button);

  &:disabled {
    cursor: not-allowed;
  }
`

const TripDeleteModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TripDeleteTargetCard = styled.div`
  height: 74px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--Background-Base);
`

const TripDeleteTargetName = styled.p`
  overflow: hidden;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TripDeleteTargetMeta = styled.p`
  overflow: hidden;
  color: var(--Text-Secondary);
  font: var(--text-ui-nav);
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TripDeleteWarning = styled.p`
  min-height: 66px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 12px;
  background: rgb(181 118 59 / 10%);
  color: var(--Primary-Cognac);
  font: 400 11px/18px var(--font-sans);
  word-break: keep-all;
`

const TripDeleteWarningIcon = styled.img`
  width: 18px;
  height: 17px;
  flex: 0 0 18px;
  display: block;
`

const PageSurface = styled.div`
  width: 100%;
  min-height: var(--app-viewport-height);
`

const TripSegmentEditWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: calc(
    var(--app-viewport-height) - 136px + var(--design-safe-top)
  );
  margin: 0 auto;
  padding: 0 24px 36px;
  display: flex;
  flex-direction: column;
  gap: 30px;
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
  flex-direction: column;
  gap: 10px;
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
