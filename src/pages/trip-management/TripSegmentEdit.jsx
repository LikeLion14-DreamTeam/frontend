import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import ConfirmationModal from '../../components/common/ConfirmationModal'
import Header from '../../components/layout/Header'
import checkboxCheckedIcon from '../../assets/icons/trip-checkbox-checked.svg'
import deleteWarningIcon from '../../assets/icons/delete-warning.svg'
import editBackIcon from '../../assets/icons/trip-edit-back.svg'
import selectChevronIcon from '../../assets/icons/trip-select-chevron.svg'
import {
  getPhotobook,
  updatePhotobookName,
} from '../../features/photobooks/photobookApi'
import {
  deleteTrip,
  getTrip,
  getTripPins,
  updateTrip,
} from '../../features/trips/tripApi'

// 아직 포토북에서 넘어오는 경로가 없어 segmentId 가 비면 이 값을 쓴다.
const FALLBACK_SEGMENT_ID = 12

const pad2 = (value) => String(value).padStart(2, '0')

/** <input type="date"> 가 요구하는 형식. 로컬 날짜 기준으로 만든다. */
const toDateInputValue = (isoString) => {
  if (!isoString) return ''

  const date = new Date(isoString)

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/**
 * 입력한 날짜에 원래 시각을 그대로 얹는다.
 * 날짜만 고쳤는데 시각이 자정으로 밀려 여정 범위가 달라지는 걸 막는다.
 */
const toIsoWithOriginalTime = (dateValue, originalIso) => {
  if (!dateValue) return undefined

  const [year, month, day] = dateValue.split('-').map(Number)
  const next = originalIso ? new Date(originalIso) : new Date()

  next.setFullYear(year, month - 1, day)

  return next.toISOString()
}

const pinTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: '2-digit',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const formatPinTime = (taggedAt) =>
  taggedAt ? pinTimeFormatter.format(new Date(taggedAt)) : ''

const formatDateValue = (isoString) => {
  if (!isoString) return ''

  const date = new Date(isoString)

  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

/** 같은 해면 끝 날짜의 연도를 뺀다. 시안의 `2024.11.03 – 11.10` 형태다. */
const formatDateRange = (startAt, endAt) => {
  const start = formatDateValue(startAt)
  const end = formatDateValue(endAt)

  if (!start) return end
  if (!end) return start

  return `${start} – ${start.slice(0, 4) === end.slice(0, 4) ? end.slice(5) : end}`
}

/**
 * 삭제 확인 시트에 띄우는 한 줄 요약. 없는 값은 빼고 이어 붙인다.
 *
 * 여정을 지우면 제외해 둔 핀까지 전부 사라지므로, 화면에서 고른 핀이 아니라
 * 여정에 속한 핀 전체를 센다. 4.2 의 수치는 포함된 핀 기준이라 쓰지 않는다.
 */
const getTripDeleteMeta = (trip, pins) => {
  const photoCount = pins.reduce((total, pin) => total + (pin.photo_count ?? 0), 0)

  return [
    formatDateRange(trip.start_at, trip.end_at),
    `핀 ${pins.length}개`,
    `사진 ${photoCount}장`,
    // TODO: 4.5 에 핀별 음성 메모 수가 없어 포함된 핀 기준 값만 쓸 수 있다.
    typeof trip.voice_memo_count === 'number'
      ? `음성 ${trip.voice_memo_count}개`
      : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

const TripSegmentEdit = () => {
  const navigate = useNavigate()
  const { segmentId = FALLBACK_SEGMENT_ID } = useParams()
  const [searchParams] = useSearchParams()

  /**
   * 어느 포토북에서 들어왔는지. 여정 관리로 돌아갈 때 그대로 넘겨서,
   * 거기서 뒤로 한 번 더 가면 그 포토북으로 이어지게 한다.
   */
  const photobookId = searchParams.get('photobook')
  const managementTo = photobookId
    ? `/trip-management/${segmentId}?photobook=${photobookId}`
    : `/trip-management/${segmentId}`

  const [trip, setTrip] = useState(null)
  const [pins, setPins] = useState([])
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includedIds, setIncludedIds] = useState([])
  /**
   * 사용자가 기간을 직접 골랐는지.
   *
   * 그 전까지는 핀을 고르는 대로 기간이 따라 움직인다. 한 번 기간을 정하고 나면
   * 그게 기준이 되어, 범위 밖 핀은 고를 수 없다. 날짜 칸은 여정 정보로 미리
   * 채워져 있어서 값이 비었는지로는 구분할 수 없다.
   */
  const [hasPickedDate, setHasPickedDate] = useState(false)
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
        const [tripData, pinData, photobookData] = await Promise.all([
          getTrip(segmentId),
          getTripPins(segmentId),
          photobookId ? getPhotobook(photobookId).catch(() => null) : null,
        ])

        if (ignore) return

        const displayName = photobookData?.name?.trim() || tripData.name

        setTrip(tripData)
        setPins(pinData.pins)
        setName(displayName)
        setStartDate(toDateInputValue(tripData.start_at))
        setEndDate(toDateInputValue(tripData.end_at))
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
  }, [photobookId, segmentId])

  const includedSet = useMemo(() => new Set(includedIds), [includedIds])

  /** 선택한 핀의 사진 수 합계. 4.5 가 핀별 photo_count 를 주므로 바로 집계한다. */
  const includedPhotoCount = useMemo(
    () =>
      pins
        .filter((pin) => includedSet.has(pin.pin_id))
        .reduce((total, pin) => total + (pin.photo_count ?? 0), 0),
    [pins, includedSet],
  )

  const pinOptions = pins.map((pin, index) => ({
    value: String(pin.pin_id),
    label: `핀 ${index + 1} · ${pin.place_name || '이름 없는 장소'}`,
  }))

  const includedIndexes = pins
    .map((pin, index) => (includedSet.has(pin.pin_id) ? index : -1))
    .filter((index) => index >= 0)

  /* 고른 핀이 없으면 -1 로 둔다. 0 으로 두면 첫 핀을 고른 것처럼 보인다. */
  const firstIncludedIndex = includedIndexes[0] ?? -1
  const lastIncludedIndex = includedIndexes.at(-1) ?? -1
  const hasIncludedPin = includedIndexes.length > 0

  const pinDate = (pin) => toDateInputValue(pin.tagged_at)

  /** 정해진 기간 밖에 찍힌 핀. 이 여정에 넣을 수 없어 고르지 못하게 한다. */
  const isOutOfRange = (pin) => {
    if (!hasPickedDate || !startDate || !endDate) return false

    const date = pinDate(pin)

    return Boolean(date) && (date < startDate || date > endDate)
  }

  const hasSelectablePin = pins.some((pin) => !isOutOfRange(pin))

  /** 선택이 바뀌면 기간을 첫 핀 · 마지막 핀 날짜로 맞춘다.
      기간을 직접 정한 뒤에는 그쪽이 기준이라 건드리지 않는다. */
  const selectPins = (ids) => {
    setIncludedIds(ids)

    if (hasPickedDate) return

    const dates = pins
      .filter((pin) => ids.includes(pin.pin_id))
      .map(pinDate)
      .filter(Boolean)
      .sort()

    if (dates.length === 0) return

    setStartDate(dates[0])
    setEndDate(dates.at(-1))
  }

  /** 기간이 바뀌면 그 사이에 찍은 핀만 선택 상태로 다시 맞춘다. */
  const applyDateRange = (start, end) => {
    setHasPickedDate(true)
    setStartDate(start)
    setEndDate(end)

    if (!start || !end) return

    setIncludedIds(
      pins
        .filter((pin) => {
          const date = pinDate(pin)
          return date && date >= start && date <= end
        })
        .map((pin) => pin.pin_id),
    )
  }

  /** 범위를 바꾸면 그 사이 핀만 선택 상태로 다시 맞춘다. */
  const applyRange = (startIndex, endIndex) => {
    // 날짜를 직접 지정해 포함 핀이 없어진 경우 first/last index 는 -1 이다.
    // 이 값을 slice 에 넘기면 -1 이 마지막 핀으로 해석되어 범위 밖 핀이
    // 다시 선택되는 문제가 생긴다. 범위의 양 끝은 반드시 선택 가능한 핀이어야 한다.
    if (
      startIndex < 0 ||
      endIndex < 0 ||
      !pins[startIndex] ||
      !pins[endIndex] ||
      isOutOfRange(pins[startIndex]) ||
      isOutOfRange(pins[endIndex])
    ) {
      return
    }

    const [from, to] =
      startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex]

    selectPins(
      pins
        .slice(from, to + 1)
        .filter((pin) => !isOutOfRange(pin))
        .map((pin) => pin.pin_id),
    )
  }

  const togglePin = (pinId) => {
    const pin = pins.find((item) => item.pin_id === pinId)
    if (pin && isOutOfRange(pin)) return

    selectPins(
      includedIds.includes(pinId)
        ? includedIds.filter((id) => id !== pinId)
        : [...includedIds, pinId],
    )
  }

  const handleSave = async () => {
    // 명세 4.3: 핀을 하나도 남기지 않고 전부 제외하면 VALIDATION_ERROR
    if (includedIds.length === 0) {
      setErrorMessage('핀을 최소 한 개는 남겨야 저장할 수 있습니다.')
      return
    }

    // UI 이벤트 외의 경로로 상태가 바뀌더라도, 직접 지정한 기간 밖 핀을
    // 저장 요청에 포함하지 않는다.
    if (pins.some((pin) => includedSet.has(pin.pin_id) && isOutOfRange(pin))) {
      setErrorMessage('선택한 기간 밖의 핀은 저장할 수 없습니다.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      await Promise.all([
        updateTrip(segmentId, {
          name,
          startAt: toIsoWithOriginalTime(startDate, trip.start_at),
          endAt: toIsoWithOriginalTime(endDate, trip.end_at),
          pinInclusions: pins.map((pin) => ({
            pin_id: pin.pin_id,
            included_in_segment: includedSet.has(pin.pin_id),
          })),
        }),
        photobookId ? updatePhotobookName(photobookId, name) : null,
      ])

      navigate(managementTo)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  /** 명세 4.4. 핀·사진·음성 메모와 포토북까지 함께 사라진다. */
  const handleDelete = async () => {
    setIsDeleting(true)
    setErrorMessage('')

    try {
      await deleteTrip(segmentId)

      // 이 여정도 포토북도 없어졌으니 목록으로 보내고 뒤로가기를 막는다.
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
        to={managementTo}
        title="여정 구간 편집"
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
              <SectionTitle>여정 정보</SectionTitle>

              <FieldGroup>
                <FieldLabel htmlFor="segmentName">여정 이름</FieldLabel>
                <TextInput
                  id="segmentName"
                  type="text"
                  aria-label="여정 이름"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FieldGroup>

              <DateGrid>
                <FieldGroup>
                  <FieldLabel htmlFor="startDate">시작일</FieldLabel>
                  <DateInput
                    id="startDate"
                    type="date"
                    aria-label="시작일"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) =>
                      applyDateRange(event.target.value, endDate)
                    }
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor="endDate">종료일</FieldLabel>
                  <DateInput
                    id="endDate"
                    type="date"
                    aria-label="종료일"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) =>
                      applyDateRange(startDate, event.target.value)
                    }
                  />
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
                  <RangeValue $placeholder={!hasIncludedPin}>
                    {pinOptions[firstIncludedIndex]?.label ?? '핀을 선택해주세요'}
                  </RangeValue>
                  <RangeSelect
                    id="firstPin"
                    aria-label="첫 번째 핀"
                    value={pinOptions[firstIncludedIndex]?.value ?? ''}
                    disabled={!hasIncludedPin || !hasSelectablePin}
                    onChange={(event) =>
                      applyRange(
                        pinOptions.findIndex(
                          (option) => option.value === event.target.value,
                        ),
                        lastIncludedIndex,
                      )
                    }
                  >
                    <option value="" disabled hidden>
                      핀을 선택해주세요
                    </option>
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
                  <RangeValue $placeholder={!hasIncludedPin}>
                    {pinOptions[lastIncludedIndex]?.label ?? '핀을 선택해주세요'}
                  </RangeValue>
                  <RangeSelect
                    id="lastPin"
                    aria-label="마지막 핀"
                    value={pinOptions[lastIncludedIndex]?.value ?? ''}
                    disabled={!hasIncludedPin || !hasSelectablePin}
                    onChange={(event) =>
                      applyRange(
                        firstIncludedIndex,
                        pinOptions.findIndex(
                          (option) => option.value === event.target.value,
                        ),
                      )
                    }
                  >
                    <option value="" disabled hidden>
                      핀을 선택해주세요
                    </option>
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
                      const outOfRange = isOutOfRange(pin)

                      return (
                        <PinRow key={pin.pin_id} $disabled={outOfRange}>
                          <PinNumber>핀 {index + 1}</PinNumber>
                          <PinText>
                            <PinTitle>{title}</PinTitle>
                            <PinMeta>
                              {formatPinTime(pin.tagged_at)}
                              {pin.photo_count != null &&
                                ` · 사진 ${pin.photo_count}장`}
                              {!hasCoordinates && ' · 위치 정보 없음'}
                            </PinMeta>
                          </PinText>
                          <PinCheckboxWrap>
                            <PinCheckbox
                              type="checkbox"
                              checked={includedSet.has(pin.pin_id)}
                              onChange={() => togglePin(pin.pin_id)}
                              disabled={outOfRange}
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
                      <ResultValue>{includedPhotoCount}장</ResultValue>
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
                여정 삭제하기
              </DeleteTrigger>
            </Footer>
          </>
        )}
      </TripSegmentEditWrapper>

      <ConfirmationModal
        open={trip !== null && isConfirmingDelete}
        title="이 여정을 삭제할까요?"
        confirmLabel={isDeleting ? '삭제하는 중...' : '여정 삭제하기'}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsConfirmingDelete(false)}
        confirmDisabled={isDeleting}
        cancelDisabled={isDeleting}
        ariaDescribedBy="trip-delete-warning"
      >
        {trip && (
          <TripDeleteContent>
            <TripDeleteTargetCard>
              <TripDeleteTargetName>{trip.name}</TripDeleteTargetName>
              <TripDeleteTargetMeta>
                {getTripDeleteMeta(trip, pins)}
              </TripDeleteTargetMeta>
            </TripDeleteTargetCard>
            <TripDeleteWarning id="trip-delete-warning">
              <TripDeleteWarningIcon
                src={deleteWarningIcon}
                alt=""
                aria-hidden="true"
              />
              <span>
                여정에 담긴 핀과 사진, 음성 메모가 모두 함께 삭제돼요. 되돌릴 수
                없습니다.
              </span>
            </TripDeleteWarning>
          </TripDeleteContent>
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

/* 기간은 시안에서 셀렉트 모양이었지만 값이 날짜라 date 입력을 쓴다.
   테두리·높이는 여정 이름 입력과 맞춘다. */
const DateInput = styled(TextInput)`
  padding: 0 12px;
  /* 기본 모양을 끄지 않으면 아래 폭 지정이 먹지 않는다. */
  appearance: none;

  /*
   * iOS 사파리는 값을 이 안쪽 요소에 그리는데, 칸 크기와 무관하게 자기 고유
   * 폭을 가진다. 칸보다 넓게 잡히면 값이 오른쪽으로 밀리며 앞부터 잘려
   * 2026. 08. 17. 이 26. 08. 17. 로 보인다. 칸에 맞춰 눌러 준다.
   */
  &::-webkit-date-and-time-value {
    width: 100%;
    text-align: left;
  }
`

const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
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
  /* 안내 문구일 때는 고른 값과 구분되게 흐리게 둔다. */
  color: ${({ $placeholder }) =>
    $placeholder ? 'var(--State-Disabled-Text)' : 'var(--Text-Primary)'};
  font: var(--text-ui-label);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/*
 * 보이는 글자는 위에서 직접 그리고, 이 요소는 목록을 띄우는 역할만 한다.
 * 닫혀 있을 때는 `opacity` 로 감춘다.
 *
 * 색과 글꼴은 감춰진 상태와 무관하게 필요하다. 목록에 뜨는 `option` 이 이
 * 값을 물려받기 때문이다. 투명하게 두면 데스크톱에서 항목 글자가 안 보이고,
 * 글꼴이 없으면 목록 줄 높이가 상속값을 따라 지나치게 높아진다.
 */
const RangeSelect = styled.select`
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--Surface-Base);
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  opacity: 0;
  appearance: none;
  cursor: pointer;
  outline: none;

  option {
    background: var(--Surface-Base);
    color: var(--Text-Primary);
  }
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

/*
 * 흐림은 "고를 수 없다"는 뜻이다. 고를 수 있는 핀은 체크 여부와 상관없이
 * 또렷하게 두고, 체크박스만으로 선택 상태를 보여준다.
 */
const PinRow = styled.label`
  width: 100%;
  min-height: 70px;
  border-radius: 12px;
  padding: 11px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--Surface-Base);
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition:
    opacity 160ms ease,
    background-color 160ms ease;
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

const DeleteTrigger = styled(Button)`
  height: 52px;
  flex: none;
  font: var(--text-ui-button);

  &:disabled {
    cursor: not-allowed;
  }
`

/* 삭제 확인 시트 안쪽. 시트 자체는 공통 ConfirmationModal 이 그린다. */
const TripDeleteContent = styled.div`
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
