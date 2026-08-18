const photoModules = import.meta.glob('../../assets/mock-journeys/*/*.webp', {
  eager: true,
  import: 'default',
})

const audioModules = import.meta.glob(
  '../../assets/mock-journeys/*/audio/*.{m4r,m4a,mp3,wav,ogg,webm}',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)

const assetKeyFromPath = (path) => {
  const marker = '/mock-journeys/'
  const markerIndex = path.indexOf(marker)
  return markerIndex >= 0 ? path.slice(markerIndex + marker.length) : path
}

const photoByAssetKey = Object.fromEntries(
  Object.entries(photoModules).map(([path, url]) => [
    assetKeyFromPath(path),
    url,
  ]),
)

const audioByAssetKey = Object.fromEntries(
  Object.entries(audioModules).map(([path, url]) => [
    assetKeyFromPath(path),
    url,
  ]),
)

export const MCM_DEMO_SEGMENT_ID = -9001
export const MCM_DEMO_PHOTOBOOK_ID = -9001
export const MCM_DEMO_STAMP_CODE = 'MCM'
export const DKM_DEMO_SEGMENT_ID = -9002
export const DKM_DEMO_PHOTOBOOK_ID = -9002
export const DKM_DEMO_STAMP_CODE = 'DKM'

export const DEMO_JOURNEY_STORAGE_KEY = 'orte:demo-journey-state:v2'
export const DEMO_JOURNEY_CHANGED_EVENT = 'orte:demo-journey-changed'

const LEGACY_STORAGE_KEYS = ['orte:mcm-demo-state:v1']

const MCM_PIN_IDS = {
  1: -9101,
  2: -9102,
  3: -9103,
  5: -9105,
}

const DKM_PIN_IDS = {
  1: -9201,
  2: -9202,
  3: -9203,
  4: -9204,
  5: -9205,
}

const DKM_PIN_COORDINATES = {
  1: { latitude: 37.5036875, longitude: 126.9560625 },
  2: { latitude: 37.5046875, longitude: 126.9581875 },
  3: { latitude: 37.5056125, longitude: 126.957296875 },
  4: { latitude: 37.5066875, longitude: 126.9575625 },
  5: { latitude: 37.5050375, longitude: 126.954171875 },
}

const DKM_ALL_ABOUT_PIN_NO = 5
const DKM_ALL_ABOUT_NOTE =
  '곽효석 [PM]\n- 안녕하세요. 고기만두 싫어하는 대왕김치만두파 곽효석입니다.\n\n오채린 [DE]\n- 저랑 느좋카페 가실분\n\n나희경 [FE]\n- 몬스터의 악마 (특이사항: 피 뽑으면 몬스터 나옴)\n\n이준원 [FE]\n- 내 최애 팬텀\n\n김희선 [BE]\n- 나 ♡ ☕️\n\n서유진 [BE]\n- 저의 말랑볼은 코딩주머니입니다'
const DKM_ALL_ABOUT_PHOTO_ORDER = [1, 5, 2, 4, 6, 3]

const DEMO_JOURNEYS = [
  {
    segmentId: MCM_DEMO_SEGMENT_ID,
    photobookId: MCM_DEMO_PHOTOBOOK_ID,
    slug: 'mcm',
    name: 'MCM 여정',
    stampCode: MCM_DEMO_STAMP_CODE,
    stampName: 'MCM',
    stampImageId: 'MCM',
    pinIds: MCM_PIN_IDS,
    photoCounts: {
      1: 3,
      2: 3,
      3: 3,
      5: 3,
    },
    photoIdPrefix: '92',
  },
  {
    segmentId: DKM_DEMO_SEGMENT_ID,
    photobookId: DKM_DEMO_PHOTOBOOK_ID,
    slug: 'dkm',
    name: '대왕김치만두(DKM)',
    stampCode: DKM_DEMO_STAMP_CODE,
    stampName: '대왕김치만두',
    stampImageId: 'DKM',
    pinIds: DKM_PIN_IDS,
    photobookPinNos: [1, 4, 5],
    photoCounts: {
      1: 12,
      2: 4,
      3: 7,
      4: 5,
      5: 6,
    },
    photoIdPrefix: '93',
  },
]

const DEMO_SEGMENT_IDS = DEMO_JOURNEYS.map((journey) => journey.segmentId)
const DEMO_PHOTOBOOK_IDS = DEMO_JOURNEYS.map((journey) => journey.photobookId)
const JOURNEY_BY_SEGMENT_ID = new Map(
  DEMO_JOURNEYS.map((journey) => [journey.segmentId, journey]),
)
const SEGMENT_ID_BY_PHOTOBOOK_ID = new Map(
  DEMO_JOURNEYS.map((journey) => [journey.photobookId, journey.segmentId]),
)
const SEGMENT_ID_BY_PIN_ID = new Map(
  DEMO_JOURNEYS.flatMap((journey) =>
    Object.values(journey.pinIds).map((pinId) => [pinId, journey.segmentId]),
  ),
)

export const DEMO_STAMP_CODES = new Set()

const expectedPhotoAssetKeys = DEMO_JOURNEYS.flatMap((journey) =>
  Object.entries(journey.photoCounts).flatMap(([pinNo, count]) =>
    Array.from({ length: count }, (_, index) => {
      const slot = index + 1
      return `${journey.slug}/pin-${String(pinNo).padStart(2, '0')}-${String(
        slot,
      ).padStart(2, '0')}.webp`
    }),
  ),
)

export const DEMO_MISSING_ASSETS = expectedPhotoAssetKeys.filter(
  (assetKey) => !photoByAssetKey[assetKey],
)
export const MCM_DEMO_MISSING_ASSETS = DEMO_MISSING_ASSETS.filter(
  (assetKey) => assetKey.startsWith('mcm/'),
)

const clone = (value) => JSON.parse(JSON.stringify(value))

const photoUrl = (assetKey) => photoByAssetKey[assetKey] ?? ''
const audioUrl = (assetKey) => audioByAssetKey[assetKey] ?? ''

const getPhotoSourceKey = (photo) => {
  if (photo?.source_asset_key) return photo.source_asset_key
  if (!photo?.source_file_name) return null
  if (photo.source_file_name.includes('/')) return photo.source_file_name
  return `mcm/${photo.source_file_name}`
}

const getTotalDays = (startAt, endAt) => {
  if (!startAt || !endAt) return 0

  return Math.floor((new Date(endAt) - new Date(startAt)) / 86400000) + 1
}

const getOrderedPins = (pins) =>
  Object.values(pins).sort((left, right) =>
    left.tagged_at.localeCompare(right.tagged_at),
  )

const buildCountries = (orderedPins) => {
  const byCountryCode = new Map()

  orderedPins.forEach((pin) => {
    if (!pin.country_code) return

    if (!byCountryCode.has(pin.country_code)) {
      byCountryCode.set(pin.country_code, {
        country_name: pin.country_name || pin.country_code,
        cities: [],
      })
    }

    const country = byCountryCode.get(pin.country_code)
    if (pin.city && !country.cities.includes(pin.city)) {
      country.cities.push(pin.city)
    }
  })

  return [...byCountryCode.values()]
}

const getUniqueCities = (orderedPins) => [
  ...new Set(orderedPins.map((pin) => pin.city).filter(Boolean)),
]

const createTripPins = (journey, orderedPins) =>
  orderedPins.map((pin) => ({
    pin_id: pin.pin_id,
    place_name: pin.place_name,
    latitude: pin.latitude,
    longitude: pin.longitude,
    tagged_at: pin.tagged_at,
    included_in_segment: true,
    included_in_photobook:
      journey.photobookPinNos?.includes(pin.source_pin_no) ?? true,
  }))

const createPhotoId = (journey, pinNo, slot) => {
  if (journey.segmentId === MCM_DEMO_SEGMENT_ID) {
    return Number(
      `-${journey.photoIdPrefix}${String(pinNo).padStart(2, '0')}${slot}`,
    )
  }

  return Number(
    `-${journey.photoIdPrefix}${String(pinNo).padStart(2, '0')}${String(
      slot,
    ).padStart(2, '0')}`,
  )
}

const setRandomRepresentativePhotos = (photos) => {
  const shuffled = [...photos]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ]
  }

  const representativeCount = Math.min(3, photos.length)
  const selected = shuffled.slice(0, representativeCount)
  const firstPhotos = new Set(photos.slice(0, representativeCount))

  // 사진이 충분할 때는 단순히 첫 세 장을 다시 고르는 경우를 피해 추천처럼 보이게 한다.
  if (
    photos.length > representativeCount &&
    selected.every((photo) => firstPhotos.has(photo))
  ) {
    selected[representativeCount - 1] = shuffled.find(
      (photo) => !firstPhotos.has(photo),
    )
  }

  const selectedIds = new Set(selected.map((photo) => photo.photo_id))
  photos.forEach((photo) => {
    photo.is_pin_cover = selectedIds.has(photo.photo_id)
  })
}

const createPhotos = ({ journey, pinNo, taggedAt }) => {
  const photos = Array.from({ length: journey.photoCounts[pinNo] ?? 0 }, (_, index) => {
    const slot = index + 1
    const fileName = `pin-${String(pinNo).padStart(2, '0')}-${String(
      slot,
    ).padStart(2, '0')}.webp`
    const sourceAssetKey = `${journey.slug}/${fileName}`

    return {
      source_asset_key: sourceAssetKey,
      source_file_name: sourceAssetKey,
      photo_id: createPhotoId(journey, pinNo, slot),
      captured_at: taggedAt,
      file_path: photoUrl(sourceAssetKey),
      is_pin_cover: false,
    }
  })

  setRandomRepresentativePhotos(photos)
  return photos
}

const createVoiceMemo = ({ journey, pinNo, taggedAt, voiceMemoId }) => {
  const sourceAudioKey = `${journey.slug}/audio/pin-${String(pinNo).padStart(
    2,
    '0',
  )}.m4r`

  return {
    voice_memo_id: voiceMemoId,
    source_audio_key: sourceAudioKey,
    audio_file: audioUrl(sourceAudioKey),
    duration_sec: 0,
    saved_at: taggedAt,
  }
}

const createMcmPins = () => ({
  [MCM_PIN_IDS[1]]: {
    pin_id: MCM_PIN_IDS[1],
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
  [MCM_PIN_IDS[2]]: {
    pin_id: MCM_PIN_IDS[2],
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
  [MCM_PIN_IDS[3]]: {
    pin_id: MCM_PIN_IDS[3],
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
  [MCM_PIN_IDS[5]]: {
    pin_id: MCM_PIN_IDS[5],
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
})

const createDkmPins = () => ({
  [DKM_PIN_IDS[1]]: {
    pin_id: DKM_PIN_IDS[1],
    segment_id: DKM_DEMO_SEGMENT_ID,
    nfc_tag_id: 'dkm-demo-1',
    latitude: DKM_PIN_COORDINATES[1].latitude,
    longitude: DKM_PIN_COORDINATES[1].longitude,
    address: '서울 동작구 흑석로 84 중앙대학교 310관',
    city: '서울',
    country_code: 'KR',
    country_name: '대한민국',
    place_name: '발광하는 크컴',
    tagged_at: '2026-08-12T10:20:00.000',
    text_note:
      '중앙대 310관 2층에 위치한 크컴에는 늘 불이 켜져있다는 소문이 있다',
    product_name: '대왕김치만두',
    source_pin_no: 1,
  },
  [DKM_PIN_IDS[2]]: {
    pin_id: DKM_PIN_IDS[2],
    segment_id: DKM_DEMO_SEGMENT_ID,
    nfc_tag_id: 'dkm-demo-2',
    latitude: DKM_PIN_COORDINATES[2].latitude,
    longitude: DKM_PIN_COORDINATES[2].longitude,
    address: '서울 동작구 흑석로 84 중앙대학교 중앙도서관',
    city: '서울',
    country_code: 'KR',
    country_name: '대한민국',
    place_name: '중냥이',
    tagged_at: '2026-08-12T12:10:00.000',
    text_note: '야옹냐옹냥냥냐옹 (중냥이를 사랑해줘서 고맙다냥)',
    product_name: '대왕김치만두',
    source_pin_no: 2,
  },
  [DKM_PIN_IDS[3]]: {
    pin_id: DKM_PIN_IDS[3],
    segment_id: DKM_DEMO_SEGMENT_ID,
    nfc_tag_id: 'dkm-demo-3',
    latitude: DKM_PIN_COORDINATES[3].latitude,
    longitude: DKM_PIN_COORDINATES[3].longitude,
    address: '서울 동작구 흑석로 84 중앙대학교 청룡연못',
    city: '서울',
    country_code: 'KR',
    country_name: '대한민국',
    place_name: '푸앙푸앙',
    tagged_at: '2026-08-12T14:30:00.000',
    text_note:
      '푸앙이는 어디든 함께합니다. 설령 그게 당신의 집일지라도.',
    product_name: '대왕김치만두',
    source_pin_no: 3,
  },
  [DKM_PIN_IDS[4]]: {
    pin_id: DKM_PIN_IDS[4],
    segment_id: DKM_DEMO_SEGMENT_ID,
    nfc_tag_id: 'dkm-demo-4',
    latitude: DKM_PIN_COORDINATES[4].latitude,
    longitude: DKM_PIN_COORDINATES[4].longitude,
    address: '서울 동작구 흑석로 84 중앙대학교 정문',
    city: '서울',
    country_code: 'KR',
    country_name: '대한민국',
    place_name: '중대냐 앙대냐',
    tagged_at: '2026-08-12T16:20:00.000',
    text_note:
      '내 등록금이 어디로 가나했더니 아름다운 학교 건립에 사용되었다는 걸 알게 된 나.',
    product_name: '대왕김치만두',
    source_pin_no: 4,
  },
  [DKM_PIN_IDS[5]]: {
    pin_id: DKM_PIN_IDS[5],
    segment_id: DKM_DEMO_SEGMENT_ID,
    nfc_tag_id: 'dkm-demo-5',
    latitude: DKM_PIN_COORDINATES[5].latitude,
    longitude: DKM_PIN_COORDINATES[5].longitude,
    address: '서울 동작구 흑석로 84 중앙대학교 후문',
    city: '서울',
    country_code: 'KR',
    country_name: '대한민국',
    place_name: 'All about DKM',
    tagged_at: '2026-08-12T18:05:00.000',
    text_note: DKM_ALL_ABOUT_NOTE,
    product_name: '대왕김치만두',
    source_pin_no: 5,
  },
})

const applyDkmAllAboutUpdates = (state) => {
  const pinId = DKM_PIN_IDS[DKM_ALL_ABOUT_PIN_NO]
  const pin = state.pins?.[pinId]

  if (pin) pin.text_note = DKM_ALL_ABOUT_NOTE

  const photos = state.photos?.[pinId]
  if (!photos) return state

  const orderBySlot = new Map(
    DKM_ALL_ABOUT_PHOTO_ORDER.map((slot, index) => [slot, index]),
  )
  const getSlot = (photo) => {
    const sourceKey = photo.source_asset_key ?? photo.source_file_name ?? ''
    const match = sourceKey.match(/dkm\/pin-05-(\d+)\.webp$/)
    return match ? Number(match[1]) : null
  }

  state.photos[pinId] = [...photos].sort((left, right) => {
    const leftOrder = orderBySlot.get(getSlot(left)) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = orderBySlot.get(getSlot(right)) ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder
  })

  return state
}

const createInitialState = () => {
  const pinGroups = {
    [MCM_DEMO_SEGMENT_ID]: createMcmPins(),
    [DKM_DEMO_SEGMENT_ID]: createDkmPins(),
  }

  const state = {
    trips: {},
    tripPins: {},
    pins: {},
    photos: {},
    voiceMemos: {},
    photobooks: {},
  }

  DEMO_JOURNEYS.forEach((journey) => {
    const pins = pinGroups[journey.segmentId]
    const orderedPins = getOrderedPins(pins)

    Object.assign(state.pins, pins)
    state.tripPins[journey.segmentId] = createTripPins(journey, orderedPins)

    state.trips[journey.segmentId] = {
      segment_id: journey.segmentId,
      user_id: null,
      name: journey.name,
      start_at: orderedPins[0].tagged_at,
      end_at: orderedPins.at(-1).tagged_at,
      status: true,
      is_demo: true,
      countries: buildCountries(orderedPins),
    }

    orderedPins.forEach((pin) => {
      state.photos[pin.pin_id] = createPhotos({
        journey,
        pinNo: pin.source_pin_no,
        taggedAt: pin.tagged_at,
      })
      state.voiceMemos[pin.pin_id] = null
    })

    state.photobooks[journey.photobookId] = {
      photobook_id: journey.photobookId,
      segment_id: journey.segmentId,
      name: journey.name,
      start_at: orderedPins[0].tagged_at,
      end_at: orderedPins.at(-1).tagged_at,
      cities: getUniqueCities(orderedPins),
      cover_photo_url: state.photos[orderedPins[0].pin_id]?.[0]?.file_path ?? '',
      is_demo: true,
    }
  })

  state.voiceMemos[DKM_PIN_IDS[1]] = createVoiceMemo({
    journey: JOURNEY_BY_SEGMENT_ID.get(DKM_DEMO_SEGMENT_ID),
    pinNo: 1,
    taggedAt: state.pins[DKM_PIN_IDS[1]].tagged_at,
    voiceMemoId: -9501,
  })
  state.voiceMemos[DKM_PIN_IDS[2]] = createVoiceMemo({
    journey: JOURNEY_BY_SEGMENT_ID.get(DKM_DEMO_SEGMENT_ID),
    pinNo: 2,
    taggedAt: state.pins[DKM_PIN_IDS[2]].tagged_at,
    voiceMemoId: -9502,
  })

  return applyDkmAllAboutUpdates(applySeededDkmPhotobookPins(state))
}

const applySeededDkmCoordinates = (state) => {
  Object.entries(DKM_PIN_COORDINATES).forEach(([pinNo, coordinates]) => {
    const pinId = DKM_PIN_IDS[pinNo]
    const pin = state.pins?.[pinId]
    if (!pin) return

    pin.latitude = coordinates.latitude
    pin.longitude = coordinates.longitude

    const tripPin = state.tripPins?.[DKM_DEMO_SEGMENT_ID]?.find(
      (item) => item.pin_id === pinId,
    )
    if (!tripPin) return

    tripPin.latitude = coordinates.latitude
    tripPin.longitude = coordinates.longitude
  })

  return state
}

const applySeededDkmPhotobookPins = (state) => {
  const selectedPinNos = new Set(
    JOURNEY_BY_SEGMENT_ID.get(DKM_DEMO_SEGMENT_ID)?.photobookPinNos ?? [],
  )

  ;(state.tripPins?.[DKM_DEMO_SEGMENT_ID] ?? []).forEach((tripPin) => {
    const pin = state.pins?.[tripPin.pin_id]
    if (!pin) return

    tripPin.included_in_photobook = selectedPinNos.has(pin.source_pin_no)
  })

  return state
}

const getBrowserStorage = () => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

const reviveAssetUrls = (state) => {
  const coverSourceByPhotobookId = new Map()

  Object.values(state.photos ?? {})
    .flat()
    .forEach((photo) => {
      const sourceAssetKey = getPhotoSourceKey(photo)

      Object.entries(state.photobooks ?? {}).forEach(([photobookId, photobook]) => {
        if (sourceAssetKey && photo.file_path === photobook.cover_photo_url) {
          coverSourceByPhotobookId.set(Number(photobookId), sourceAssetKey)
        }
      })

      if (sourceAssetKey) {
        photo.source_asset_key = sourceAssetKey
        photo.source_file_name = sourceAssetKey
        photo.file_path = photoUrl(sourceAssetKey)
      }
    })

  Object.values(state.voiceMemos ?? {}).forEach((voiceMemo) => {
    if (voiceMemo?.source_audio_key) {
      voiceMemo.audio_file = audioUrl(voiceMemo.source_audio_key)
    }
  })

  Object.values(state.photobooks ?? {}).forEach((photobook) => {
    const sourceAssetKey = coverSourceByPhotobookId.get(photobook.photobook_id)

    if (sourceAssetKey) {
      photobook.cover_photo_url = photoUrl(sourceAssetKey)
      return
    }

    const segmentId = Number(photobook.segment_id)
    const includedPinIds = (state.tripPins?.[segmentId] ?? [])
      .filter((tripPin) => tripPin.included_in_segment)
      .map((tripPin) => tripPin.pin_id)
    const photos = includedPinIds.flatMap((pinId) => state.photos?.[pinId] ?? [])

    if (!photos.some((photo) => photo.file_path === photobook.cover_photo_url)) {
      photobook.cover_photo_url =
        photos.find((photo) => photo.file_path)?.file_path ?? ''
    }
  })

  return state
}

const seedPersistedRepresentativePhotos = (state) => {
  if (state.representative_photos_initialized) return false

  Object.values(state.photos ?? {}).forEach((photos) => {
    if (!Array.isArray(photos) || photos.length <= 3) return

    const startsWithDefaultRepresentatives = photos
      .slice(0, 3)
      .every((photo) => photo.is_pin_cover)
    const hasOnlyDefaultRepresentatives = photos
      .slice(3)
      .every((photo) => !photo.is_pin_cover)

    if (startsWithDefaultRepresentatives && hasOnlyDefaultRepresentatives) {
      setRandomRepresentativePhotos(photos)
    }
  })

  state.representative_photos_initialized = true
  return true
}

const loadInitialState = () => {
  const storage = getBrowserStorage()
  if (!storage) return createInitialState()

  try {
    const saved = JSON.parse(storage.getItem(DEMO_JOURNEY_STORAGE_KEY))
    if (saved?.state && saved.version === 2) {
      const state = reviveAssetUrls(
        applyDkmAllAboutUpdates(
          applySeededDkmPhotobookPins(applySeededDkmCoordinates(saved.state)),
        ),
      )
      if (seedPersistedRepresentativePhotos(state)) {
        storage.setItem(
          DEMO_JOURNEY_STORAGE_KEY,
          JSON.stringify({
            version: 2,
            saved_at: new Date().toISOString(),
            state,
          }),
        )
      }
      return state
    }

    const legacyMcm = JSON.parse(storage.getItem(LEGACY_STORAGE_KEYS[0]))
    if (legacyMcm?.state && legacyMcm.version === 1) {
      const state = createInitialState()
      if (!legacyMcm.state.trips?.[MCM_DEMO_SEGMENT_ID]) {
        delete state.trips[MCM_DEMO_SEGMENT_ID]
        delete state.tripPins[MCM_DEMO_SEGMENT_ID]
        delete state.photobooks[MCM_DEMO_PHOTOBOOK_ID]
        Object.values(MCM_PIN_IDS).forEach((pinId) => {
          delete state.pins[pinId]
          delete state.photos[pinId]
          delete state.voiceMemos[pinId]
        })
      }
      ;['trips', 'tripPins', 'pins', 'photos', 'voiceMemos', 'photobooks'].forEach(
        (key) => {
          Object.assign(state[key], legacyMcm.state[key] ?? {})
        },
      )
      return reviveAssetUrls(
        applyDkmAllAboutUpdates(applySeededDkmCoordinates(state)),
      )
    }

    return applyDkmAllAboutUpdates(
      applySeededDkmCoordinates(createInitialState()),
    )
  } catch {
    storage.removeItem(DEMO_JOURNEY_STORAGE_KEY)
    return applyDkmAllAboutUpdates(
      applySeededDkmCoordinates(createInitialState()),
    )
  }
}

const demoJourneyState = loadInitialState()

const persistDemoJourneyState = () => {
  const storage = getBrowserStorage()
  if (!storage) return

  try {
    storage.setItem(
      DEMO_JOURNEY_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        saved_at: new Date().toISOString(),
        state: demoJourneyState,
      }),
    )
  } catch (error) {
    console.warn('Demo journey state could not be saved.', error)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEMO_JOURNEY_CHANGED_EVENT))
  }
}

export const resetDemoJourneyData = ({ reload = true } = {}) => {
  const storage = getBrowserStorage()
  storage?.removeItem(DEMO_JOURNEY_STORAGE_KEY)
  LEGACY_STORAGE_KEYS.forEach((key) => storage?.removeItem(key))

  Object.keys(demoJourneyState).forEach((key) => {
    delete demoJourneyState[key]
  })
  Object.assign(demoJourneyState, createInitialState())

  if (reload && typeof window !== 'undefined') {
    window.location.reload()
  }

  return 'Demo journey data has been reset.'
}

export const resetMcmDemoData = resetDemoJourneyData

const installDemoConsoleTools = () => {
  if (typeof window === 'undefined') return

  window.resetDemoJourneyData = resetDemoJourneyData
  window.resetMcmDemoData = resetDemoJourneyData
  window.orteDemoJourneys = {
    reset: resetDemoJourneyData,
    storageKey: DEMO_JOURNEY_STORAGE_KEY,
    getState: () => clone(demoJourneyState),
  }
  window.orteMcmDemo = window.orteDemoJourneys
}

installDemoConsoleTools()

const resolveSegmentId = (segmentId) =>
  DEMO_SEGMENT_IDS.includes(Number(segmentId)) ? Number(segmentId) : null

const resolvePhotobookId = (photobookId) =>
  DEMO_PHOTOBOOK_IDS.includes(Number(photobookId)) ? Number(photobookId) : null

const getSegmentIdForPin = (pinId) =>
  SEGMENT_ID_BY_PIN_ID.get(Number(pinId)) ??
  demoJourneyState.pins?.[Number(pinId)]?.segment_id ??
  null

const getSegmentIdForPhotobook = (photobookId) =>
  SEGMENT_ID_BY_PHOTOBOOK_ID.get(Number(photobookId)) ?? null

const getPhotobookIdForSegment = (segmentId) =>
  JOURNEY_BY_SEGMENT_ID.get(Number(segmentId))?.photobookId ?? null

const getAllTripPins = (segmentId) =>
  demoJourneyState.tripPins[Number(segmentId)] ?? []

const getIncludedTripPins = (segmentId) =>
  getAllTripPins(segmentId).filter((pin) => pin.included_in_segment)

// 포토북은 도시별로 최대 세 핀만 싣는다. 여정/지도에 보이는 핀은 제한하지 않는다.
const getPhotobookTripPins = (segmentId) => {
  const cityPinCounts = new Map()

  return getIncludedTripPins(segmentId).filter((tripPin) => {
    if (tripPin.included_in_photobook === false) return false

    const city = demoJourneyState.pins[tripPin.pin_id]?.city ?? ''
    const count = cityPinCounts.get(city) ?? 0
    if (count >= 3) return false

    cityPinCounts.set(city, count + 1)
    return true
  })
}

const getPinPhotoCount = (pinId) => demoJourneyState.photos[pinId]?.length ?? 0

const getStoredDemoPinsForSegment = (segmentId) =>
  getAllTripPins(segmentId)
    .map((tripPin) => demoJourneyState.pins[tripPin.pin_id])
    .filter(Boolean)

const getAllStoredDemoPins = () =>
  DEMO_SEGMENT_IDS.flatMap((segmentId) => getStoredDemoPinsForSegment(segmentId))

const buildDemoCountryStampSummaries = (pins) => {
  const groupedPins = new Map()

  pins.forEach((pin) => {
    const countryCode = pin.country_code?.toUpperCase()
    if (!countryCode) return

    if (!groupedPins.has(countryCode)) {
      groupedPins.set(countryCode, {
        countryCode,
        countryName: pin.country_name || countryCode,
        pins: [],
      })
    }

    const group = groupedPins.get(countryCode)
    if (!group.countryName && pin.country_name) group.countryName = pin.country_name
    group.pins.push(pin)
  })

  return [...groupedPins.values()]
    .map(({ countryCode, countryName, pins: countryPins }) => {
      const sortedPins = [...countryPins].sort((left, right) =>
        left.tagged_at.localeCompare(right.tagged_at),
      )
      const cityCounts = sortedPins.reduce((counts, pin) => {
        if (!pin.city) return counts

        counts.set(pin.city, (counts.get(pin.city) ?? 0) + 1)
        return counts
      }, new Map())

      const rankedCities = [...cityCounts.entries()].sort(
        ([cityA, countA], [cityB, countB]) =>
          countB - countA || cityA.localeCompare(cityB, 'ko'),
      )

      return {
        user_id: null,
        country_code: countryCode,
        country_name: countryName || countryCode,
        stamp_image_id: `stamp-${countryCode}`,
        created_at: sortedPins[0]?.tagged_at ?? null,
        is_new: false,
        pin_count: sortedPins.length,
        cities: rankedCities.slice(0, 3).map(([city]) => city),
        city_counts: rankedCities.map(([city, pin_count]) => ({
          city,
          pin_count,
        })),
        extra_city_count: Math.max(0, rankedCities.length - 3),
        is_demo: true,
      }
    })
    .sort((left, right) => {
      if (!left.created_at) return 1
      if (!right.created_at) return -1
      return left.created_at.localeCompare(right.created_at)
    })
}

const getIncludedPhotos = (segmentId) =>
  getIncludedTripPins(segmentId).flatMap(
    (pin) => demoJourneyState.photos[pin.pin_id] ?? [],
  )

const getIncludedPhotoCount = (segmentId) => getIncludedPhotos(segmentId).length

const getIncludedVoiceMemoCount = (segmentId) =>
  getIncludedTripPins(segmentId).filter(
    (tripPin) => demoJourneyState.voiceMemos[tripPin.pin_id],
  ).length

const getPhotobookPhotos = (segmentId) =>
  getPhotobookTripPins(segmentId).flatMap(
    (pin) => demoJourneyState.photos[pin.pin_id] ?? [],
  )

const syncPhotobookFromTrip = (segmentId) => {
  const trip = demoJourneyState.trips[segmentId]
  const photobook =
    demoJourneyState.photobooks[getPhotobookIdForSegment(segmentId)]

  if (!trip || !photobook) return

  photobook.name = trip.name
  photobook.start_at = trip.start_at
  photobook.end_at = trip.end_at
}

const ensurePhotobookCoverCandidate = (segmentId) => {
  const photobook =
    demoJourneyState.photobooks[getPhotobookIdForSegment(segmentId)]
  if (!photobook) return

  const candidates = getPhotobookPhotos(segmentId).map((photo) => photo.file_path)
  if (candidates.includes(photobook.cover_photo_url)) return

  photobook.cover_photo_url = candidates[0] ?? ''
}

const getNextDemoPhotoId = () =>
  Math.min(
    -1,
    ...Object.values(demoJourneyState.photos)
      .flat()
      .map((photo) => photo.photo_id),
  ) - 1

export const isDemoSegmentId = (segmentId) => resolveSegmentId(segmentId) != null
export const isDemoPhotobookId = (photobookId) =>
  resolvePhotobookId(photobookId) != null
export const isDemoPinId = (pinId) => getSegmentIdForPin(pinId) != null
export const isDemoStampCode = () => false

export const isDemoPhotoId = (photoId) =>
  Object.values(demoJourneyState.photos)
    .flat()
    .some((photo) => photo.photo_id === Number(photoId))

export const isMcmDemoSegmentId = (segmentId) =>
  Number(segmentId) === MCM_DEMO_SEGMENT_ID
export const isMcmDemoPhotobookId = (photobookId) =>
  Number(photobookId) === MCM_DEMO_PHOTOBOOK_ID
export const isMcmDemoPinId = (pinId) =>
  Object.values(MCM_PIN_IDS).includes(Number(pinId))

export const getDemoCountryStamps = () =>
  buildDemoCountryStampSummaries(getAllStoredDemoPins())

export const getMcmDemoCountryStamps = () =>
  buildDemoCountryStampSummaries(
    getStoredDemoPinsForSegment(MCM_DEMO_SEGMENT_ID),
  )

export const getDemoTripList = () =>
  DEMO_SEGMENT_IDS.flatMap((segmentId) => {
    const trip = demoJourneyState.trips[segmentId]
    return trip ? [clone(trip)] : []
  })

export const getDemoAccountStats = () => {
  const pins = getAllStoredDemoPins()
  const visitedCities = new Set(pins.map((pin) => pin.city).filter(Boolean))

  return {
    pin_count: pins.length,
    completed_trip_count: getDemoTripList().filter((trip) => trip.status).length,
    visited_city_count: visitedCities.size,
  }
}

export const getMcmDemoTripList = () =>
  getDemoTripList().filter((trip) => trip.segment_id === MCM_DEMO_SEGMENT_ID)

export const getDemoTripSummary = (segmentId) => {
  const resolvedSegmentId = resolveSegmentId(segmentId)
  if (resolvedSegmentId == null) return null

  const trip = demoJourneyState.trips[resolvedSegmentId]
  if (!trip) return null

  return clone({
    ...trip,
    pin_count: getIncludedTripPins(resolvedSegmentId).length,
    photo_count: getIncludedPhotoCount(resolvedSegmentId),
    voice_memo_count: getIncludedVoiceMemoCount(resolvedSegmentId),
  })
}

export const getMcmDemoTripSummary = (segmentId) =>
  isMcmDemoSegmentId(segmentId) ? getDemoTripSummary(segmentId) : null

export const getDemoTripPins = (segmentId) => {
  const resolvedSegmentId = resolveSegmentId(segmentId)
  if (resolvedSegmentId == null) return null
  if (!demoJourneyState.trips[resolvedSegmentId]) return null

  return clone(
    getAllTripPins(resolvedSegmentId).map((pin) => ({
      ...pin,
      photo_count: getPinPhotoCount(pin.pin_id),
    })),
  )
}

export const getMcmDemoTripPins = (segmentId) =>
  isMcmDemoSegmentId(segmentId) ? getDemoTripPins(segmentId) : null

export const updateDemoTrip = (
  segmentId,
  { name, startAt, endAt, pinInclusions },
) => {
  const resolvedSegmentId = resolveSegmentId(segmentId)
  if (resolvedSegmentId == null) return null

  const trip = demoJourneyState.trips[resolvedSegmentId]
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
    const nextTripPins = getAllTripPins(resolvedSegmentId).map((pin) =>
      inclusionByPinId.has(pin.pin_id)
        ? { ...pin, included_in_segment: inclusionByPinId.get(pin.pin_id) }
        : pin,
    )

    if (!nextTripPins.some((pin) => pin.included_in_segment)) {
      throw new Error('핀을 최소 한 개는 남겨야 저장할 수 있습니다.')
    }

    demoJourneyState.tripPins[resolvedSegmentId] = nextTripPins
  }

  syncPhotobookFromTrip(resolvedSegmentId)
  ensurePhotobookCoverCandidate(resolvedSegmentId)
  persistDemoJourneyState()
  return getDemoTripSummary(resolvedSegmentId)
}

export const updateMcmDemoTrip = (segmentId, payload) =>
  isMcmDemoSegmentId(segmentId) ? updateDemoTrip(segmentId, payload) : null

export const deleteDemoTrip = (segmentId) => {
  const resolvedSegmentId = resolveSegmentId(segmentId)
  if (resolvedSegmentId == null) return false
  if (!demoJourneyState.trips[resolvedSegmentId]) return false

  delete demoJourneyState.trips[resolvedSegmentId]
  delete demoJourneyState.tripPins[resolvedSegmentId]
  delete demoJourneyState.photobooks[getPhotobookIdForSegment(resolvedSegmentId)]

  Object.values(demoJourneyState.pins)
    .filter((pin) => Number(pin.segment_id) === resolvedSegmentId)
    .forEach((pin) => {
      delete demoJourneyState.pins[pin.pin_id]
      delete demoJourneyState.photos[pin.pin_id]
      delete demoJourneyState.voiceMemos[pin.pin_id]
    })

  persistDemoJourneyState()
  return true
}

export const deleteMcmDemoTrip = (segmentId) =>
  isMcmDemoSegmentId(segmentId) ? deleteDemoTrip(segmentId) : false

export const getDemoPinsByCountry = (countryCode) => {
  const normalizedCode = countryCode?.toUpperCase()
  if (!normalizedCode) return []

  return clone(
    getAllStoredDemoPins()
      .filter((pin) => pin.country_code?.toUpperCase() === normalizedCode)
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

export const getDemoPinsByStamp = getDemoPinsByCountry

export const getMcmDemoPinsByStamp = (countryCode) =>
  getStoredDemoPinsForSegment(MCM_DEMO_SEGMENT_ID).some(
    (pin) => pin.country_code?.toUpperCase() === countryCode?.toUpperCase(),
  )
    ? getDemoPinsByCountry(countryCode).filter((pin) =>
        Object.values(MCM_PIN_IDS).includes(pin.pin_id),
      )
    : null

export const getDemoPin = (pinId) => {
  if (!isDemoPinId(pinId)) return null

  const pin = demoJourneyState.pins[Number(pinId)]
  if (!pin) return null

  const voiceMemo = demoJourneyState.voiceMemos[pin.pin_id]

  return clone({
    ...pin,
    voice_memo: voiceMemo
      ? {
          voice_memo_id: voiceMemo.voice_memo_id,
          duration_sec: voiceMemo.duration_sec,
        }
      : null,
    representative_photos: (demoJourneyState.photos[pin.pin_id] ?? [])
      .filter((photo) => photo.is_pin_cover)
      .map((photo) => ({ photo_id: photo.photo_id, url: photo.file_path })),
  })
}

export const getMcmDemoPin = (pinId) =>
  isMcmDemoPinId(pinId) ? getDemoPin(pinId) : null

export const updateDemoPin = (pinId, { placeName, textNote }) => {
  if (!isDemoPinId(pinId)) return null

  const pin = demoJourneyState.pins[Number(pinId)]
  if (!pin) return null

  pin.place_name = placeName
  pin.text_note = textNote

  const segmentId = getSegmentIdForPin(pin.pin_id)
  const tripPins = demoJourneyState.tripPins[segmentId] ?? []
  const target = tripPins.find((tripPin) => tripPin.pin_id === pin.pin_id)
  if (target) target.place_name = placeName

  persistDemoJourneyState()

  return clone({
    pin_id: pin.pin_id,
    place_name: pin.place_name,
    text_note: pin.text_note,
  })
}

export const updateMcmDemoPin = (pinId, payload) =>
  isMcmDemoPinId(pinId) ? updateDemoPin(pinId, payload) : null

export const getDemoPinPhotos = (pinId) => {
  if (!isDemoPinId(pinId)) return null
  if (!demoJourneyState.pins[Number(pinId)]) return null

  return clone(demoJourneyState.photos[Number(pinId)] ?? [])
}

export const getMcmDemoPinPhotos = (pinId) =>
  isMcmDemoPinId(pinId) ? getDemoPinPhotos(pinId) : null

export const addDemoPinPhotos = (pinId, photos, resolveFilePath) => {
  if (!isDemoPinId(pinId)) return null

  const pin = demoJourneyState.pins[Number(pinId)]
  if (!pin) return null

  const stored = demoJourneyState.photos[pin.pin_id] ?? []
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

  demoJourneyState.photos[pin.pin_id] = stored

  if (added.length) persistDemoJourneyState()

  return { added, rejected }
}

export const addMcmDemoPinPhotos = (pinId, photos, resolveFilePath) =>
  isMcmDemoPinId(pinId)
    ? addDemoPinPhotos(pinId, photos, resolveFilePath)
    : null

export const refreshDemoRepresentativePhotos = (pinId) => {
  if (!isDemoPinId(pinId)) return null

  const pin = demoJourneyState.pins[Number(pinId)]
  if (!pin) return null

  const photos = demoJourneyState.photos[pin.pin_id] ?? []
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

  persistDemoJourneyState()

  return {
    representative_photos: photos
      .filter((photo) => photo.is_pin_cover)
      .map((photo) => ({ photo_id: photo.photo_id, url: photo.file_path })),
  }
}

export const refreshMcmDemoRepresentativePhotos = (pinId) =>
  isMcmDemoPinId(pinId) ? refreshDemoRepresentativePhotos(pinId) : null

export const getDemoPinVoiceMemos = (pinId) => {
  if (!isDemoPinId(pinId)) return null
  if (!demoJourneyState.pins[Number(pinId)]) return null

  const voiceMemo = demoJourneyState.voiceMemos[Number(pinId)]

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

export const getMcmDemoPinVoiceMemos = (pinId) =>
  isMcmDemoPinId(pinId) ? getDemoPinVoiceMemos(pinId) : null

export const deleteDemoPhoto = (photoId) => {
  if (!isDemoPhotoId(photoId)) return false

  const targetId = Number(photoId)
  const entry = Object.entries(demoJourneyState.photos).find(([, list]) =>
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

  demoJourneyState.photos[pinId] = remaining

  const segmentId = getSegmentIdForPin(pinId)
  if (segmentId != null) ensurePhotobookCoverCandidate(segmentId)

  persistDemoJourneyState()
  return true
}

export const deleteMcmDemoPhoto = deleteDemoPhoto

const buildPhotobookSummary = (photobookId) => {
  const resolvedPhotobookId = resolvePhotobookId(photobookId)
  if (resolvedPhotobookId == null) return null

  const photobook = demoJourneyState.photobooks[resolvedPhotobookId]
  if (!photobook) return null

  const segmentId = getSegmentIdForPhotobook(resolvedPhotobookId)
  const cities = [
    ...new Set(
      getPhotobookTripPins(segmentId)
        .map((tripPin) => demoJourneyState.pins[tripPin.pin_id]?.city)
        .filter(Boolean),
    ),
  ]

  return {
    ...photobook,
    cities,
    photo_count: getPhotobookPhotos(segmentId).length,
  }
}

export const getDemoPhotobookList = () =>
  DEMO_PHOTOBOOK_IDS.flatMap((photobookId) => {
    const summary = buildPhotobookSummary(photobookId)
    return summary ? [clone(summary)] : []
  })

export const getMcmDemoPhotobookList = () =>
  getDemoPhotobookList().filter(
    (photobook) => photobook.photobook_id === MCM_DEMO_PHOTOBOOK_ID,
  )

export const getDemoPhotobook = (photobookId) => {
  const resolvedPhotobookId = resolvePhotobookId(photobookId)
  if (resolvedPhotobookId == null) return null

  const summary = buildPhotobookSummary(resolvedPhotobookId)
  if (!summary) return null

  const segmentId = getSegmentIdForPhotobook(resolvedPhotobookId)
  const groupedCities = []

  getPhotobookTripPins(segmentId).forEach((tripPin, index) => {
    const pin = demoJourneyState.pins[tripPin.pin_id]
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

    const voiceMemo = demoJourneyState.voiceMemos[pin.pin_id]

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
      representative_photos: (demoJourneyState.photos[pin.pin_id] ?? [])
        .filter((photo) => photo.is_pin_cover)
        .map((photo) => ({
          photo_id: photo.photo_id,
          url: photo.file_path,
        })),
      photos: (demoJourneyState.photos[pin.pin_id] ?? []).map(
        (photo, photoIndex) => ({
          photo_id: photo.photo_id,
          order: photoIndex + 1,
          file_path: photo.file_path,
        }),
      ),
      voice_memo: voiceMemo
        ? {
            voice_memo_id: voiceMemo.voice_memo_id,
            duration_sec: voiceMemo.duration_sec,
          }
        : null,
    })
  })

  return clone({
    ...summary,
    total_days: getTotalDays(summary.start_at, summary.end_at),
    pin_count: getPhotobookTripPins(segmentId).length,
    voice_memo_count: getPhotobookTripPins(segmentId).filter(
      (tripPin) => demoJourneyState.voiceMemos[tripPin.pin_id],
    ).length,
    cities: groupedCities,
  })
}

export const getMcmDemoPhotobook = (photobookId) =>
  isMcmDemoPhotobookId(photobookId) ? getDemoPhotobook(photobookId) : null

export const updateDemoPhotobookName = (photobookId, name) => {
  const resolvedPhotobookId = resolvePhotobookId(photobookId)
  if (resolvedPhotobookId == null) return null

  const photobook = demoJourneyState.photobooks[resolvedPhotobookId]
  if (!photobook) return null

  const nextName = typeof name === 'string' ? name.trim() : ''

  if (!nextName) {
    throw new Error('포토북 이름을 입력해 주세요.')
  }

  photobook.name = nextName

  const linkedTrip = demoJourneyState.trips[photobook.segment_id]
  if (linkedTrip) linkedTrip.name = nextName

  persistDemoJourneyState()

  return {
    photobook_id: resolvedPhotobookId,
    name: nextName,
  }
}

export const updateMcmDemoPhotobookName = (photobookId, name) =>
  isMcmDemoPhotobookId(photobookId)
    ? updateDemoPhotobookName(photobookId, name)
    : null

export const refreshDemoPhotobookCover = (photobookId) => {
  const resolvedPhotobookId = resolvePhotobookId(photobookId)
  if (resolvedPhotobookId == null) return null

  const photobook = demoJourneyState.photobooks[resolvedPhotobookId]
  if (!photobook) return null

  const segmentId = getSegmentIdForPhotobook(resolvedPhotobookId)
  const candidates = getPhotobookPhotos(segmentId)
    .map((photo) => photo.file_path)
    .filter(Boolean)
    .filter((filePath) => filePath !== photobook.cover_photo_url)

  const fallbackCandidates = getPhotobookPhotos(segmentId)
    .map((photo) => photo.file_path)
    .filter(Boolean)

  const pool = candidates.length ? candidates : fallbackCandidates

  if (!pool.length) {
    throw new Error('커버로 사용할 사진이 없습니다.')
  }

  photobook.cover_photo_url = pool[Math.floor(Math.random() * pool.length)]

  persistDemoJourneyState()

  return { cover_photo_url: photobook.cover_photo_url }
}

export const refreshMcmDemoPhotobookCover = (photobookId) =>
  isMcmDemoPhotobookId(photobookId)
    ? refreshDemoPhotobookCover(photobookId)
    : null
