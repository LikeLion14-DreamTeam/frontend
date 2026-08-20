const originalPhotoSources = import.meta.glob(
  '../../assets/images/onboarding-selection/originals/**/*.webp',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)

const SOURCE_ENTRIES = Object.entries(originalPhotoSources)
const SET_FILE_PATTERN = /_set(\d+)_(\d+)\.webp$/i
const PHOTO_SET_STORAGE_PREFIX = 'orte_onboarding_photo_sets'

const AB_STAGE_CONFIGS = [
  { roundNo: 1, axisCode: 'brightness', folderName: 'AB1밝기' },
  { roundNo: 2, axisCode: 'vividness', folderName: 'AB2채도' },
  { roundNo: 3, axisCode: 'tone', folderName: 'AB3색온도' },
  { roundNo: 4, axisCode: 'density', folderName: 'AB4구도-밀도' },
  { roundNo: 5, axisCode: 'photo_type', folderName: 'AB5사진 종류' },
]

const MOODBOARD_STAGE_CONFIGS = [
  { roundNo: 6, folderName: '무드보드1' },
  { roundNo: 7, folderName: '무드보드2' },
]

const getPhotoId = ({ roundNo, setNo, order, isAbRound }) => {
  if (isAbRound) {
    return roundNo * 1000 + (order === 20 ? 1 : 2)
  }

  return roundNo * 1000 + (setNo - 1) * 9 + order
}

const createPhotoSets = ({ roundNo, folderName, isAbRound }) => {
  const groupedPhotos = new Map()

  SOURCE_ENTRIES.filter(([path]) =>
    path.includes(`/originals/${folderName}/`),
  ).forEach(([path, src]) => {
    const filename = path.split('/').at(-1)
    const match = filename.match(SET_FILE_PATTERN)

    if (!match) return

    const setNo = Number(match[1])
    const order = Number(match[2])
    const photos = groupedPhotos.get(setNo) ?? []

    photos.push({ src, order })
    groupedPhotos.set(setNo, photos)
  })

  if (groupedPhotos.size === 0) {
    throw new Error(`${folderName} 폴더에서 선택용 사진을 찾지 못했습니다.`)
  }

  return [...groupedPhotos.entries()]
    .sort(([leftSetNo], [rightSetNo]) => leftSetNo - rightSetNo)
    .map(([setNo, photos]) => ({
      setNo,
      photos: photos
        .sort((left, right) => left.order - right.order)
        .map(({ src, order }, photoIndex) => ({
          photoId: getPhotoId({ roundNo, setNo, order, isAbRound }),
          ...(isAbRound && { label: photoIndex === 0 ? 'A' : 'B' }),
          src,
          alt: isAbRound
            ? `${roundNo}번째 A/B 취향 비교 사진 ${
                photoIndex === 0 ? 'A' : 'B'
              }`
            : `무드보드 ${roundNo - 5}라운드 사진 ${photoIndex + 1}`,
        })),
    }))
}

export const AB_PHOTO_ROUNDS = AB_STAGE_CONFIGS.map((stage) => ({
  ...stage,
  photoSets: createPhotoSets({ ...stage, isAbRound: true }),
}))

export const MOODBOARD_PHOTO_ROUNDS = MOODBOARD_STAGE_CONFIGS.map(
  (stage) => ({
    ...stage,
    photoSets: createPhotoSets({ ...stage, isAbRound: false }),
  }),
)

const getStorage = () => {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

const getPhotoSetStorageKey = (storageKey) =>
  `${PHOTO_SET_STORAGE_PREFIX}:${storageKey}`

const readStoredSetNos = (storageKey) => {
  const storage = getStorage()
  if (!storage || !storageKey) return {}

  try {
    return JSON.parse(storage.getItem(getPhotoSetStorageKey(storageKey))) ?? {}
  } catch {
    return {}
  }
}

const writeStoredSetNos = (storageKey, setNosByRoundNo) => {
  const storage = getStorage()
  if (!storage || !storageKey) return

  try {
    storage.setItem(
      getPhotoSetStorageKey(storageKey),
      JSON.stringify(setNosByRoundNo),
    )
  } catch {
    // 저장소를 쓸 수 없어도 온보딩 진행 자체는 막지 않는다.
  }
}

const findSetFromSavedSelections = ({ photoSets }, selectionPhotos) => {
  const savedPhotoIds = new Set(
    selectionPhotos.map((selection) => selection.photo_id),
  )

  if (savedPhotoIds.size === 0) return null

  return (
    photoSets.find((photoSet) =>
      photoSet.photos.every((photo) => savedPhotoIds.has(photo.photoId)),
    ) ?? null
  )
}

const getSelectionsByRoundNo = (selectionPhotos) =>
  selectionPhotos.reduce((rounds, selection) => {
    const currentSelections = rounds.get(selection.round_no) ?? []

    currentSelections.push(selection)
    rounds.set(selection.round_no, currentSelections)

    return rounds
  }, new Map())

/** 각 단계가 다른 set을 고르되, 이어하기·새로고침에서는 같은 후보를 유지한다. */
export const selectRandomPhotoSets = (
  rounds,
  {
    random = Math.random,
    storageKey = '',
    selectionPhotos = [],
  } = {},
) => {
  const storedSetNos = readStoredSetNos(storageKey)
  const savedSelectionsByRoundNo = getSelectionsByRoundNo(selectionPhotos)
  const nextStoredSetNos = { ...storedSetNos }

  const selectedRounds = rounds.map(({ photoSets, ...round }) => {
    const storedSetNo = Number(storedSetNos[round.roundNo])
    const storedSet = photoSets.find(
      (photoSet) => photoSet.setNo === storedSetNo,
    )
    const savedSet = findSetFromSavedSelections(
      { photoSets },
      savedSelectionsByRoundNo.get(round.roundNo) ?? [],
    )
    const selectedSet =
      storedSet ??
      savedSet ??
      photoSets[Math.floor(random() * photoSets.length)]

    nextStoredSetNos[round.roundNo] = selectedSet.setNo

    return {
      ...round,
      setNo: selectedSet.setNo,
      photos: selectedSet.photos,
    }
  })

  writeStoredSetNos(storageKey, nextStoredSetNos)

  return selectedRounds
}
