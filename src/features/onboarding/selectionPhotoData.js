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
          photoId: 200000 + roundNo * 1000 + setNo * 100 + order,
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

/** 각 단계가 다른 set을 고를 수 있도록 라운드별로 독립 추첨한다. */
export const selectRandomPhotoSets = (rounds, random = Math.random) =>
  rounds.map(({ photoSets, ...round }) => {
    const selectedSet = photoSets[Math.floor(random() * photoSets.length)]

    return {
      ...round,
      setNo: selectedSet.setNo,
      photos: selectedSet.photos,
    }
  })
