const photoModules = import.meta.glob('../../assets/mock-journeys/mcm/*.webp', {
  eager: true,
  import: 'default',
})

const photoByFileName = Object.fromEntries(
  Object.entries(photoModules).map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1),
    url,
  ]),
)

export const MCM_DEMO_SEGMENT_ID = -9001
export const MCM_DEMO_PHOTOBOOK_ID = -9001
export const MCM_DEMO_STAMP_CODE = 'MCM'

const STORAGE_KEY = 'orte:mcm-demo-state:v1'

const PIN_IDS = {
  1: -9101,
  2: -9102,
  3: -9103,
  5: -9105,
}

const PIN_ID_SET = new Set(Object.values(PIN_IDS))

const photoFileNames = [
  'pin-01-01.webp',
  'pin-01-02.webp',
  'pin-01-03.webp',
  'pin-02-01.webp',
  'pin-02-02.webp',
  'pin-02-03.webp',
  'pin-03-01.webp',
  'pin-03-02.webp',
  'pin-03-03.webp',
  'pin-05-01.webp',
  'pin-05-02.webp',
  'pin-05-03.webp',
]

export const MCM_DEMO_MISSING_ASSETS = photoFileNames.filter(
  (fileName) => !photoByFileName[fileName],
)

const clone = (value) => JSON.parse(JSON.stringify(value))

const photoUrl = (fileName) => photoByFileName[fileName] ?? ''

const createPhotos = (pinNo, taggedAt) =>
  [1, 2, 3].map((slot) => ({
    source_file_name: `pin-${String(pinNo).padStart(2, '0')}-${String(slot).padStart(2, '0')}.webp`,
    photo_id: Number(`-92${String(pinNo).padStart(2, '0')}${slot}`),
    captured_at: taggedAt,
    file_path: photoUrl(
      `pin-${String(pinNo).padStart(2, '0')}-${String(slot).padStart(2, '0')}.webp`,
    ),
    is_pin_cover: true,
  }))

const createInitialState = () => {
  const pins = {
    [PIN_IDS[1]]: {
      pin_id: PIN_IDS[1],
      segment_id: MCM_DEMO_SEGMENT_ID,
      nfc_tag_id: 'mcm-demo-1',
      latitude: 48.138386,
      longitude: 11.5828,
      address: 'Maximilianstraße 28, 80539 München, Germany',
      city: '뮌헨',
      country_code: 'DE',
      country_name: '독일',
      place_name: 'MCM 막시밀리안슈트라세 플래그십',
      tagged_at: '2026-08-07T13:40:00.000',
      text_note:
        '1976년, 유리 수조에 여행 가방 20점을 진열하며 MCM이 시작됐다. 제트세터와 디스코의 황금기 한복판이었다. 지금은 이 거리 28번지에 플래그십이 서 있다. 태어난 도시로 돌아온 주소.',
      product_name: '코냑 비세토스 카드 홀더',
      source_pin_no: 1,
    },
    [PIN_IDS[2]]: {
      pin_id: PIN_IDS[2],
      segment_id: MCM_DEMO_SEGMENT_ID,
      nfc_tag_id: 'mcm-demo-2',
      latitude: 50.11464,
      longitude: 8.673496,
      address: 'Goethestraße 34, 60313 Frankfurt am Main, Germany',
      city: '프랑크푸르트',
      country_code: 'DE',
      country_name: '독일',
      place_name: 'MCM 프랑크푸르트 오페라',
      tagged_at: '2026-08-08T11:05:00.000',
      text_note:
        '2016년, 토비아스 레베르거가 MCM 플래그십을 흑백 대즐 패턴으로 뒤덮었다. 전 세계 네 곳 중 하나가 이 매장이었다. 브랜드가 예술에 자리를 내주는 방식이 여기서 보인다.',
      product_name: '코냑 비세토스 지갑',
      source_pin_no: 2,
    },
    [PIN_IDS[3]]: {
      pin_id: PIN_IDS[3],
      segment_id: MCM_DEMO_SEGMENT_ID,
      nfc_tag_id: 'mcm-demo-3',
      latitude: 52.524307,
      longitude: 13.402747,
      address: 'Rosenthaler Str. 38, 10178 Berlin, Germany',
      city: '베를린',
      country_code: 'DE',
      country_name: '독일',
      place_name: 'MCM 베를린 미테',
      tagged_at: '2026-08-08T17:40:00.000',
      text_note:
        '갤러리와 스튜디오가 이어지는 로젠탈러 슈트라세. MCM의 크리에이티브 허브가 왜 베를린인지는 매장 문밖에 있다. 코냑 비세토스가 매 시즌 다시 쓰이는 작업실 같은 곳.',
      product_name: '코냑 비세토스 지갑',
      source_pin_no: 3,
    },
    [PIN_IDS[5]]: {
      pin_id: PIN_IDS[5],
      segment_id: MCM_DEMO_SEGMENT_ID,
      nfc_tag_id: 'mcm-demo-5',
      latitude: 37.527141,
      longitude: 127.041868,
      address: '서울 강남구 압구정로 412 (청담동 78-12)',
      city: '서울',
      country_code: 'KR',
      country_name: '대한민국',
      place_name: 'MCM HAUS 청담',
      tagged_at: '2026-08-10T17:30:00.000',
      text_note:
        '2005년 성주그룹이 MCM을 인수했다. 바우하우스 정신을 브론즈 파사드로 옮긴 5층 건물, 청담의 MCM 하우스. 뮌헨에서 출발한 여정이 도착한, 지금 브랜드의 집.',
      product_name: '코냑 비세토스 지갑',
      source_pin_no: 5,
    },
  }

  const orderedPins = Object.values(pins).sort((left, right) =>
    left.tagged_at.localeCompare(right.tagged_at),
  )

  return {
    trips: {
      [MCM_DEMO_SEGMENT_ID]: {
        segment_id: MCM_DEMO_SEGMENT_ID,
        user_id: null,
        name: 'MCM 여정',
        start_at: orderedPins[0].tagged_at,
        end_at: orderedPins.at(-1).tagged_at,
        status: true,
        is_demo: true,
        countries: [
          {
            country_name: '독일',
            cities: ['뮌헨', '프랑크푸르트', '베를린'],
          },
          { country_name: '대한민국', cities: ['서울'] },
        ],
      },
    },
    tripPins: {
      [MCM_DEMO_SEGMENT_ID]: orderedPins.map((pin) => ({
        pin_id: pin.pin_id,
        place_name: pin.place_name,
        latitude: pin.latitude,
        longitude: pin.longitude,
        tagged_at: pin.tagged_at,
        included_in_segment: true,
      })),
    },
    pins,
    photos: {
      [PIN_IDS[1]]: createPhotos(1, pins[PIN_IDS[1]].tagged_at),
      [PIN_IDS[2]]: createPhotos(2, pins[PIN_IDS[2]].tagged_at),
      [PIN_IDS[3]]: createPhotos(3, pins[PIN_IDS[3]].tagged_at),
      [PIN_IDS[5]]: createPhotos(5, pins[PIN_IDS[5]].tagged_at),
    },
    voiceMemos: {
      [PIN_IDS[1]]: null,
      [PIN_IDS[2]]: null,
      [PIN_IDS[3]]: null,
      [PIN_IDS[5]]: null,
    },
    photobooks: {
      [MCM_DEMO_PHOTOBOOK_ID]: {
        photobook_id: MCM_DEMO_PHOTOBOOK_ID,
        segment_id: MCM_DEMO_SEGMENT_ID,
        name: 'MCM 여정',
        start_at: orderedPins[0].tagged_at,
        end_at: orderedPins.at(-1).tagged_at,
        cities: ['뮌헨', '프랑크푸르트', '베를린', '서울'],
        cover_photo_url: photoUrl('pin-01-01.webp'),
        is_demo: true,
      },
    },
  }
}

const getBrowserStorage = () => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

const reviveAssetUrls = (state) => {
  const photobook = state.photobooks?.[MCM_DEMO_PHOTOBOOK_ID]
  const savedCoverUrl = photobook?.cover_photo_url
  const photos = Object.values(state.photos ?? {}).flat()
  let savedCoverSourceFileName = null

  photos.forEach((photo) => {
    if (photo.file_path === savedCoverUrl && photo.source_file_name) {
      savedCoverSourceFileName = photo.source_file_name
    }
    if (photo.source_file_name) {
      photo.file_path = photoUrl(photo.source_file_name)
    }
  })

  if (!photobook) return state

  if (savedCoverSourceFileName) {
    photobook.cover_photo_url = photoUrl(savedCoverSourceFileName)
  } else if (!photos.some((photo) => photo.file_path === photobook.cover_photo_url)) {
    photobook.cover_photo_url = photos.find((photo) => photo.file_path)?.file_path ?? ''
  }

  return state
}

const loadInitialState = () => {
  const storage = getBrowserStorage()
  if (!storage) return createInitialState()

  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY))
    if (!saved?.state || saved.version !== 1) return createInitialState()

    return reviveAssetUrls(saved.state)
  } catch {
    storage.removeItem(STORAGE_KEY)
    return createInitialState()
  }
}

const mcmDemoState = loadInitialState()

const persistMcmDemoState = () => {
  const storage = getBrowserStorage()
  if (!storage) return

  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        saved_at: new Date().toISOString(),
        state: mcmDemoState,
      }),
    )
  } catch (error) {
    console.warn('MCM demo state could not be saved.', error)
  }
}

export const resetMcmDemoData = ({ reload = true } = {}) => {
  getBrowserStorage()?.removeItem(STORAGE_KEY)

  Object.keys(mcmDemoState).forEach((key) => {
    delete mcmDemoState[key]
  })
  Object.assign(mcmDemoState, createInitialState())

  if (reload && typeof window !== 'undefined') {
    window.location.reload()
  }

  return 'MCM demo data has been reset.'
}

const installMcmDemoConsoleTools = () => {
  if (typeof window === 'undefined') return

  window.resetMcmDemoData = resetMcmDemoData
  window.orteMcmDemo = {
    reset: resetMcmDemoData,
    storageKey: STORAGE_KEY,
    getState: () => clone(mcmDemoState),
  }
}

installMcmDemoConsoleTools()

const getIncludedTripPins = () =>
  (mcmDemoState.tripPins[MCM_DEMO_SEGMENT_ID] ?? []).filter(
    (pin) => pin.included_in_segment,
  )

const getAllTripPins = () =>
  mcmDemoState.tripPins[MCM_DEMO_SEGMENT_ID] ?? []

const getPinPhotoCount = (pinId) => mcmDemoState.photos[pinId]?.length ?? 0

const getIncludedPhotos = () =>
  getIncludedTripPins().flatMap((pin) => mcmDemoState.photos[pin.pin_id] ?? [])

const getIncludedPhotoCount = () =>
  getIncludedPhotos().length

const getTotalDays = (startAt, endAt) => {
  if (!startAt || !endAt) return 0

  return Math.floor((new Date(endAt) - new Date(startAt)) / 86400000) + 1
}

const syncPhotobookFromTrip = () => {
  const trip = mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]
  const photobook = mcmDemoState.photobooks[MCM_DEMO_PHOTOBOOK_ID]

  if (!trip || !photobook) return

  photobook.name = trip.name
  photobook.start_at = trip.start_at
  photobook.end_at = trip.end_at
}

const ensurePhotobookCoverCandidate = () => {
  const photobook = mcmDemoState.photobooks[MCM_DEMO_PHOTOBOOK_ID]
  if (!photobook) return

  const candidates = getIncludedPhotos().map((photo) => photo.file_path)
  if (candidates.includes(photobook.cover_photo_url)) return

  photobook.cover_photo_url = candidates[0] ?? ''
}

const getNextDemoPhotoId = () =>
  Math.min(
    -1,
    ...Object.values(mcmDemoState.photos)
      .flat()
      .map((photo) => photo.photo_id),
  ) - 1

export const isMcmDemoSegmentId = (segmentId) =>
  Number(segmentId) === MCM_DEMO_SEGMENT_ID

export const isMcmDemoPhotobookId = (photobookId) =>
  Number(photobookId) === MCM_DEMO_PHOTOBOOK_ID

export const isMcmDemoPinId = (pinId) => PIN_ID_SET.has(Number(pinId))

export const isMcmDemoPhotoId = (photoId) =>
  Object.values(mcmDemoState.photos)
    .flat()
    .some((photo) => photo.photo_id === Number(photoId))

export const getMcmDemoCountryStamps = () => {
  const trip = mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]
  if (!trip) return []

  const cityCounts = getAllTripPins().reduce((counts, tripPin) => {
    const pin = mcmDemoState.pins[tripPin.pin_id]
    if (!pin?.city) return counts

    counts.set(pin.city, (counts.get(pin.city) ?? 0) + 1)
    return counts
  }, new Map())

  const rankedCities = [...cityCounts.entries()].sort(
    ([cityA, countA], [cityB, countB]) =>
      countB - countA || cityA.localeCompare(cityB, 'ko'),
  )

  return [
    {
      user_id: null,
      country_code: MCM_DEMO_STAMP_CODE,
      country_name: 'MCM',
      stamp_image_id: 'MCM',
      created_at: trip.start_at,
      is_new: false,
      pin_count: getAllTripPins().length,
      cities: rankedCities.slice(0, 3).map(([city]) => city),
      city_counts: rankedCities.map(([city, pin_count]) => ({
        city,
        pin_count,
      })),
      extra_city_count: Math.max(0, rankedCities.length - 3),
      is_demo: true,
    },
  ]
}

export const getMcmDemoTripList = () => {
  const trip = mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]
  return trip ? [clone(trip)] : []
}

export const getMcmDemoTripSummary = (segmentId) => {
  if (!isMcmDemoSegmentId(segmentId)) return null

  const trip = mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]
  if (!trip) return null

  return clone({
    ...trip,
    pin_count: getIncludedTripPins().length,
    photo_count: getIncludedPhotoCount(),
    voice_memo_count: 0,
  })
}

export const getMcmDemoTripPins = (segmentId) => {
  if (!isMcmDemoSegmentId(segmentId)) return null
  if (!mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]) return null

  return clone(
    getAllTripPins().map((pin) => ({
      ...pin,
      photo_count: getPinPhotoCount(pin.pin_id),
    })),
  )
}

export const updateMcmDemoTrip = (
  segmentId,
  { name, startAt, endAt, pinInclusions },
) => {
  if (!isMcmDemoSegmentId(segmentId)) return null

  const trip = mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]
  if (!trip) return null

  if (name !== undefined) trip.name = name
  if (startAt) trip.start_at = startAt
  if (endAt) trip.end_at = endAt

  if (Array.isArray(pinInclusions)) {
    const inclusionByPinId = new Map(
      pinInclusions.map(({ pin_id, included_in_segment }) => [
        Number(pin_id),
        Boolean(included_in_segment),
      ]),
    )
    const nextTripPins = getAllTripPins().map((pin) =>
      inclusionByPinId.has(pin.pin_id)
        ? { ...pin, included_in_segment: inclusionByPinId.get(pin.pin_id) }
        : pin,
    )

    if (!nextTripPins.some((pin) => pin.included_in_segment)) {
      throw new Error('핀을 최소 한 개는 남겨야 저장할 수 있습니다.')
    }

    mcmDemoState.tripPins[MCM_DEMO_SEGMENT_ID] = nextTripPins
  }

  syncPhotobookFromTrip()
  ensurePhotobookCoverCandidate()
  persistMcmDemoState()
  return getMcmDemoTripSummary(segmentId)
}

export const deleteMcmDemoTrip = (segmentId) => {
  if (!isMcmDemoSegmentId(segmentId)) return false
  if (!mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]) return false

  delete mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]
  delete mcmDemoState.tripPins[MCM_DEMO_SEGMENT_ID]
  delete mcmDemoState.photobooks[MCM_DEMO_PHOTOBOOK_ID]
  Object.values(PIN_IDS).forEach((pinId) => {
    delete mcmDemoState.pins[pinId]
    delete mcmDemoState.photos[pinId]
    delete mcmDemoState.voiceMemos[pinId]
  })

  persistMcmDemoState()
  return true
}

export const getMcmDemoPinsByStamp = (countryCode) => {
  if (countryCode?.toUpperCase() !== MCM_DEMO_STAMP_CODE) return null
  if (!mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]) return null

  return clone(
    getAllTripPins()
      .map((tripPin) => mcmDemoState.pins[tripPin.pin_id])
      .filter(Boolean)
      .sort((left, right) => left.tagged_at.localeCompare(right.tagged_at))
      .map((pin) => ({
        pin_id: pin.pin_id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        place_name: pin.place_name,
        photo_count: getPinPhotoCount(pin.pin_id),
        tagged_at: pin.tagged_at,
      })),
  )
}

export const getMcmDemoPin = (pinId) => {
  if (!isMcmDemoPinId(pinId)) return null

  const pin = mcmDemoState.pins[Number(pinId)]
  if (!pin) return null

  const voiceMemo = mcmDemoState.voiceMemos[pin.pin_id]

  return clone({
    ...pin,
    voice_memo: voiceMemo
      ? {
          voice_memo_id: voiceMemo.voice_memo_id,
          duration_sec: voiceMemo.duration_sec,
        }
      : null,
    representative_photos: (mcmDemoState.photos[pin.pin_id] ?? [])
      .filter((photo) => photo.is_pin_cover)
      .map((photo) => ({ photo_id: photo.photo_id, url: photo.file_path })),
  })
}

export const updateMcmDemoPin = (pinId, { placeName, textNote }) => {
  if (!isMcmDemoPinId(pinId)) return null

  const pin = mcmDemoState.pins[Number(pinId)]
  if (!pin) return null

  pin.place_name = placeName
  pin.text_note = textNote

  const tripPins = mcmDemoState.tripPins[MCM_DEMO_SEGMENT_ID] ?? []
  const target = tripPins.find((tripPin) => tripPin.pin_id === pin.pin_id)
  if (target) target.place_name = placeName

  persistMcmDemoState()

  return clone({
    pin_id: pin.pin_id,
    place_name: pin.place_name,
    text_note: pin.text_note,
  })
}

export const getMcmDemoPinPhotos = (pinId) => {
  if (!isMcmDemoPinId(pinId)) return null
  if (!mcmDemoState.pins[Number(pinId)]) return null

  return clone(mcmDemoState.photos[Number(pinId)] ?? [])
}

export const addMcmDemoPinPhotos = (pinId, photos, resolveFilePath) => {
  if (!isMcmDemoPinId(pinId)) return null

  const pin = mcmDemoState.pins[Number(pinId)]
  if (!pin) return null

  const stored = mcmDemoState.photos[pin.pin_id] ?? []
  const added = []
  const rejected = []

  photos.forEach((photo) => {
    const filePath = resolveFilePath?.(photo.file_id) ?? photo.file_id

    if (!filePath) {
      rejected.push({ file_id: photo.file_id, reason: 'MISSING_FILE' })
      return
    }

    const photoId = getNextDemoPhotoId()

    stored.push({
      photo_id: photoId,
      captured_at: photo.captured_at,
      file_path: filePath,
      is_pin_cover: false,
    })
    added.push({ photo_id: photoId, file_id: photo.file_id })
  })

  mcmDemoState.photos[pin.pin_id] = stored

  if (added.length) persistMcmDemoState()

  return { added, rejected }
}

export const refreshMcmDemoRepresentativePhotos = (pinId) => {
  if (!isMcmDemoPinId(pinId)) return null

  const pin = mcmDemoState.pins[Number(pinId)]
  if (!pin) return null

  const photos = mcmDemoState.photos[pin.pin_id] ?? []
  if (photos.length < 4) {
    throw new Error('대표사진 새로고침은 사진이 4장 이상일 때만 가능합니다.')
  }

  const picked = photos
    .slice(0, 10)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  const pickedIds = new Set(picked.map((photo) => photo.photo_id))

  photos.forEach((photo) => {
    photo.is_pin_cover = pickedIds.has(photo.photo_id)
  })

  persistMcmDemoState()

  return {
    representative_photos: photos
      .filter((photo) => photo.is_pin_cover)
      .map((photo) => ({ photo_id: photo.photo_id, url: photo.file_path })),
  }
}

export const getMcmDemoPinVoiceMemos = (pinId) => {
  if (!isMcmDemoPinId(pinId)) return null
  if (!mcmDemoState.pins[Number(pinId)]) return null

  const voiceMemo = mcmDemoState.voiceMemos[Number(pinId)]

  return {
    voice_memo: voiceMemo
      ? {
          voice_memo_id: voiceMemo.voice_memo_id,
          audio_file: voiceMemo.audio_file,
          saved_at: voiceMemo.saved_at,
        }
      : null,
  }
}

export const deleteMcmDemoPhoto = (photoId) => {
  if (!isMcmDemoPhotoId(photoId)) return false

  const targetId = Number(photoId)
  const entry = Object.entries(mcmDemoState.photos).find(([, list]) =>
    list.some((photo) => photo.photo_id === targetId),
  )

  if (!entry) return false

  const [pinId, list] = entry
  const removed = list.find((photo) => photo.photo_id === targetId)
  const remaining = list.filter((photo) => photo.photo_id !== targetId)

  if (removed.is_pin_cover) {
    const replacement = remaining.find((photo) => !photo.is_pin_cover)
    if (replacement) replacement.is_pin_cover = true
  }

  mcmDemoState.photos[pinId] = remaining

  const photobook = mcmDemoState.photobooks[MCM_DEMO_PHOTOBOOK_ID]
  if (photobook?.cover_photo_url === removed.file_path) {
    photobook.cover_photo_url = getIncludedPhotos()[0]?.file_path ?? ''
  }

  persistMcmDemoState()
  return true
}

const buildPhotobookSummary = () => {
  const photobook = mcmDemoState.photobooks[MCM_DEMO_PHOTOBOOK_ID]
  if (!photobook) return null

  const cities = [
    ...new Set(
      getIncludedTripPins()
        .map((tripPin) => mcmDemoState.pins[tripPin.pin_id]?.city)
        .filter(Boolean),
    ),
  ]

  return {
    ...photobook,
    cities,
    photo_count: getIncludedPhotoCount(),
  }
}

export const getMcmDemoPhotobookList = () => {
  const summary = buildPhotobookSummary()
  return summary ? [clone(summary)] : []
}

export const getMcmDemoPhotobook = (photobookId) => {
  if (!isMcmDemoPhotobookId(photobookId)) return null

  const summary = buildPhotobookSummary()
  if (!summary) return null

  const groupedCities = []

  getIncludedTripPins().forEach((tripPin, index) => {
    const pin = mcmDemoState.pins[tripPin.pin_id]
    if (!pin) return

    let city = groupedCities.find((item) => item.city === pin.city)
    if (!city) {
      city = {
        city: pin.city,
        start_at: pin.tagged_at,
        end_at: pin.tagged_at,
        pin_count: 0,
        pins: [],
      }
      groupedCities.push(city)
    }

    city.end_at = pin.tagged_at
    city.pin_count += 1
    city.pins.push({
      pin_id: pin.pin_id,
      order: index + 1,
      place_name: pin.place_name,
      tagged_at: pin.tagged_at,
      latitude: pin.latitude,
      longitude: pin.longitude,
      text_note: pin.text_note,
      photos: (mcmDemoState.photos[pin.pin_id] ?? []).map((photo, photoIndex) => ({
        photo_id: photo.photo_id,
        order: photoIndex + 1,
        file_path: photo.file_path,
      })),
      voice_memo: null,
    })
  })

  return clone({
    ...summary,
    total_days: getTotalDays(summary.start_at, summary.end_at),
    pin_count: getIncludedTripPins().length,
    voice_memo_count: 0,
    cities: groupedCities,
  })
}

export const updateMcmDemoPhotobookName = (photobookId, name) => {
  if (!isMcmDemoPhotobookId(photobookId)) return null

  const photobook = mcmDemoState.photobooks[MCM_DEMO_PHOTOBOOK_ID]
  if (!photobook) return null

  const nextName = typeof name === 'string' ? name.trim() : ''

  if (!nextName) {
    throw new Error('포토북 이름을 입력해 주세요.')
  }

  photobook.name = nextName

  const linkedTrip = mcmDemoState.trips[MCM_DEMO_SEGMENT_ID]
  if (linkedTrip) linkedTrip.name = nextName

  persistMcmDemoState()

  return {
    photobook_id: MCM_DEMO_PHOTOBOOK_ID,
    name: nextName,
  }
}

export const refreshMcmDemoPhotobookCover = (photobookId) => {
  if (!isMcmDemoPhotobookId(photobookId)) return null

  const photobook = mcmDemoState.photobooks[MCM_DEMO_PHOTOBOOK_ID]
  if (!photobook) return null

  const candidates = getIncludedPhotos()
    .map((photo) => photo.file_path)
    .filter(Boolean)
    .filter((filePath) => filePath !== photobook.cover_photo_url)

  const fallbackCandidates = getIncludedPhotos()
    .map((photo) => photo.file_path)
    .filter(Boolean)

  const pool = candidates.length ? candidates : fallbackCandidates

  if (!pool.length) {
    throw new Error('커버로 사용할 사진이 없습니다.')
  }

  photobook.cover_photo_url = pool[Math.floor(Math.random() * pool.length)]

  persistMcmDemoState()

  return { cover_photo_url: photobook.cover_photo_url }
}
