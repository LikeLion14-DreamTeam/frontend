import React, { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../../components/common/Card'
import Header from '../../components/layout/Header'
import NavBar from '../../components/layout/NavBar'
import { getPhotobook } from '../../features/photobooks/photobookApi'
import { getTrip, getTripPins } from '../../features/trips/tripApi'

// 아직 포토북에서 넘어오는 경로가 없어 segmentId 가 비면 이 값을 쓴다.
// 6.1 / 6.2 에서 진입 경로가 생기면 제거한다.
const FALLBACK_SEGMENT_ID = 12

const pad2 = (value) => String(value).padStart(2, '0')

const formatPeriod = (startAt, endAt) => {
  if (!startAt || !endAt) return ''

  const start = new Date(startAt)
  const end = new Date(endAt)

  return `${start.getFullYear()}.${pad2(start.getMonth() + 1)}.${pad2(start.getDate())} – ${pad2(end.getMonth() + 1)}.${pad2(end.getDate())}`
}

const formatShortRange = (startAt, endAt) => {
  if (!startAt || !endAt) return ''

  const start = new Date(startAt)
  const end = new Date(endAt)

  return `${pad2(start.getMonth() + 1)}.${pad2(start.getDate())} – ${pad2(end.getMonth() + 1)}.${pad2(end.getDate())}`
}

const formatDuration = (startAt, endAt) => {
  if (!startAt || !endAt) return ''

  const days =
    Math.floor((new Date(endAt) - new Date(startAt)) / 86400000) + 1

  return `${days}일간의 여정`
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

/** 수록된 핀이 전체 목록에서 몇 번째인지로 범위 문구를 만든다. */
const formatPinRange = (pins) => {
  const includedNumbers = pins
    .map((pin, index) => (pin.included_in_segment ? index + 1 : null))
    .filter(Boolean)

  if (includedNumbers.length === 0) return '없음'
  if (includedNumbers.length === 1) return `핀 ${includedNumbers[0]}`

  return `핀 ${includedNumbers[0]} – 핀 ${includedNumbers.at(-1)}`
}

const TripManagement = () => {
  const { segmentId = FALLBACK_SEGMENT_ID } = useParams()
  const [searchParams] = useSearchParams()

  /**
   * 어느 포토북에서 들어왔는지. 뒤로 가기로 그 화면에 되돌려 보낸다.
   * 주소를 직접 친 경우처럼 값이 없으면 아카이브 목록으로 보낸다.
   */
  const photobookId = searchParams.get('photobook')
  const backTo = photobookId ? `/archive/trip/${photobookId}` : '/archive'

  // 편집 화면에서도 이 포토북으로 되돌아올 수 있게 값을 이어 넘긴다.
  const editTo = photobookId
    ? `/trip-management/${segmentId}/edit?photobook=${photobookId}`
    : `/trip-management/${segmentId}/edit`

  const [trip, setTrip] = useState(null)
  const [pins, setPins] = useState([])
  const [isLoading, setIsLoading] = useState(true)
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

        setTrip({
          ...tripData,
          name: photobookData?.name?.trim() || tripData.name,
        })
        setPins(pinData.pins)
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

  const settings = trip
    ? [
        { label: '여정 이름', value: trip.name },
        {
          label: '여행 기간',
          value: formatShortRange(trip.start_at, trip.end_at),
        },
        { label: '포함 핀 범위', value: formatPinRange(pins) },
      ]
    : []

  const metrics = trip
    ? [
        { label: '선택된 핀', value: trip.pin_count },
        { label: '연결된 사진', value: trip.photo_count },
      ]
    : []

  return (
    <PageSurface>
      <Header
        to={backTo}
        height="118px"
        topPadding="72px"
        barHeight="24px"
        rightContent={
          <EditLink to={editTo}>여정 구간 편집</EditLink>
        }
      />

      <TripManagementWrapper>
        {isLoading && <StateMessage>불러오는 중...</StateMessage>}

        {!isLoading && errorMessage && (
          <StateMessage role="alert">{errorMessage}</StateMessage>
        )}

        {!isLoading && !errorMessage && trip && (
          <>
            <SegmentIdentity>
              <SegmentText>
                <SegmentTitle>{trip.name}</SegmentTitle>
                <SegmentMeta>
                  {formatPeriod(trip.start_at, trip.end_at)} ·{' '}
                  {formatDuration(trip.start_at, trip.end_at)}
                </SegmentMeta>
              </SegmentText>
            </SegmentIdentity>

            <SettingsCard>
              {settings.map((item, index) => (
                <React.Fragment key={item.label}>
                  <SettingLabel>{item.label}</SettingLabel>
                  <SettingValue>{item.value}</SettingValue>
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

              {pins.length === 0 ? (
                <StateMessage>이 구간에 포함된 핀이 없습니다.</StateMessage>
              ) : (
                <PinList>
                  {pins.map((pin, index) => {
                    const hasCoordinates =
                      pin.latitude !== null && pin.longitude !== null

                    return (
                      <PinCard key={pin.pin_id}>
                        <PinNumber>핀 {index + 1}</PinNumber>
                        <PinText>
                          <PinTitle>
                            {pin.place_name || '이름 없는 장소'}
                          </PinTitle>
                          <PinMeta>
                            {formatPinTime(pin.tagged_at)}
                            {pin.photo_count != null &&
                              ` · 사진 ${pin.photo_count}장`}
                            {!hasCoordinates && ' · 위치 정보 없음'}
                          </PinMeta>
                        </PinText>
                        {!pin.included_in_segment && (
                          <PinBadge>포토북 미수록</PinBadge>
                        )}
                      </PinCard>
                    )
                  })}
                </PinList>
              )}
            </PinSection>
          </>
        )}
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
  min-height: var(--app-viewport-height);
`

const TripManagementWrapper = styled.main`
  width: 100%;
  max-width: 450px;
  min-height: calc(
    var(--app-viewport-height) - 104px + var(--design-safe-top)
  );
  margin: 0 auto;
  padding: 0 24px 99px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: var(--Text-Primary);
`

const StateMessage = styled.p`
  padding: 24px 0;
  color: var(--Text-Secondary);
  font: var(--text-ui-body-m);
  text-align: center;
  word-break: keep-all;
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

/* 이름이 길면 여러 줄로 늘어나 아래 내용을 밀어낸다. 한 줄로 묶고 넘치는
   만큼만 말줄임표로 접는다. 부모의 min-width: 0 이 있어야 줄어든다. */
const SegmentTitle = styled.h2`
  overflow: hidden;
  color: var(--Text-Primary);
  font: var(--text-ui-h2);
  letter-spacing: -0.22px;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const SegmentMeta = styled.p`
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
`

/* 세 줄이 한 격자를 나눠 쓴다. 첫 칸은 가장 긴 항목 이름("포함 핀 범위")에
   맞춰지므로, 값이 아무리 길어도 그 끝에서 한 칸 띄운 자리까지만 온다.
   줄마다 따로 재면 이름 길이가 달라 값의 왼쪽 끝이 들쭉날쭉해진다. */
const SettingsCard = styled(Card)`
  border: 0;
  border-radius: 16px;
  padding: 4px 16px;
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 10px;
  align-items: center;
  background: var(--Surface-Base);
`

const SettingLabel = styled.p`
  min-height: 46px;
  display: flex;
  align-items: center;
  color: var(--Text-Primary);
  font: var(--text-ui-label);
  white-space: nowrap;
`

/* 여정 이름이 값으로 들어와 카드를 뚫고 나가던 자리다. 제 칸 안에서만
   늘어나고 넘치면 말줄임표로 접는다.
   말줄임표는 flex 상자에서는 걸리지 않으므로 여기는 블록으로 두고,
   세로 가운데 맞춤은 격자에 맡긴다. */
const SettingValue = styled.p`
  overflow: hidden;
  color: var(--Text-Secondary);
  font: var(--text-ui-caption);
  white-space: nowrap;
  text-align: right;
  text-overflow: ellipsis;
`

const Divider = styled.div`
  grid-column: 1 / -1;
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
  flex: 1;
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

const PinBadge = styled.span`
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--State-Disabled-Fill);
  color: var(--State-Disabled-Text);
  font: var(--text-ui-nav);
  white-space: nowrap;
`
