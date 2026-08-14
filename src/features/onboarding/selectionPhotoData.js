import ab1A from '../../assets/images/onboarding-selection/ab-1-a.webp'
import ab1B from '../../assets/images/onboarding-selection/ab-1-b.webp'
import ab2A from '../../assets/images/onboarding-selection/ab-2-a.webp'
import ab2B from '../../assets/images/onboarding-selection/ab-2-b.webp'
import ab3A from '../../assets/images/onboarding-selection/ab-3-a.webp'
import ab3B from '../../assets/images/onboarding-selection/ab-3-b.webp'
import ab4A from '../../assets/images/onboarding-selection/ab-4-a.webp'
import ab4B from '../../assets/images/onboarding-selection/ab-4-b.webp'
import ab5A from '../../assets/images/onboarding-selection/ab-5-a.webp'
import ab5B from '../../assets/images/onboarding-selection/ab-5-b.webp'
import mood101 from '../../assets/images/onboarding-selection/mood-1-01.webp'
import mood102 from '../../assets/images/onboarding-selection/mood-1-02.webp'
import mood103 from '../../assets/images/onboarding-selection/mood-1-03.webp'
import mood104 from '../../assets/images/onboarding-selection/mood-1-04.webp'
import mood105 from '../../assets/images/onboarding-selection/mood-1-05.webp'
import mood106 from '../../assets/images/onboarding-selection/mood-1-06.webp'
import mood107 from '../../assets/images/onboarding-selection/mood-1-07.webp'
import mood108 from '../../assets/images/onboarding-selection/mood-1-08.webp'
import mood109 from '../../assets/images/onboarding-selection/mood-1-09.webp'
import mood201 from '../../assets/images/onboarding-selection/mood-2-01.webp'
import mood202 from '../../assets/images/onboarding-selection/mood-2-02.webp'
import mood203 from '../../assets/images/onboarding-selection/mood-2-03.webp'
import mood204 from '../../assets/images/onboarding-selection/mood-2-04.webp'
import mood205 from '../../assets/images/onboarding-selection/mood-2-05.webp'
import mood206 from '../../assets/images/onboarding-selection/mood-2-06.webp'
import mood207 from '../../assets/images/onboarding-selection/mood-2-07.webp'
import mood208 from '../../assets/images/onboarding-selection/mood-2-08.webp'
import mood209 from '../../assets/images/onboarding-selection/mood-2-09.webp'

// TODO: 백엔드에 선택용 사진이 seed되면 실제 photo_id로 교체한다.
export const AB_PHOTO_ROUNDS = [
  { roundNo: 1, axisCode: 'brightness', sources: [ab1A, ab1B] },
  { roundNo: 2, axisCode: 'vividness', sources: [ab2A, ab2B] },
  { roundNo: 3, axisCode: 'tone', sources: [ab3A, ab3B] },
  { roundNo: 4, axisCode: 'density', sources: [ab4A, ab4B] },
  { roundNo: 5, axisCode: 'subject', sources: [ab5A, ab5B] },
].map(({ roundNo, axisCode, sources }) => ({
  roundNo,
  axisCode,
  photos: sources.map((src, index) => ({
    photoId: 2000 + (roundNo - 1) * 2 + index + 1,
    label: index === 0 ? 'A' : 'B',
    src,
    alt: `${roundNo}번째 A/B 취향 비교 사진 ${index === 0 ? 'A' : 'B'}`,
  })),
}))

const moodBoardSources = [
  [
    mood101,
    mood102,
    mood103,
    mood104,
    mood105,
    mood106,
    mood107,
    mood108,
    mood109,
  ],
  [
    mood201,
    mood202,
    mood203,
    mood204,
    mood205,
    mood206,
    mood207,
    mood208,
    mood209,
  ],
]

export const MOODBOARD_PHOTO_ROUNDS = moodBoardSources.map(
  (sources, roundIndex) => ({
    roundNo: roundIndex + 6,
    photos: sources.map((src, photoIndex) => ({
      photoId: 2100 + roundIndex * 100 + photoIndex + 1,
      src,
      alt: `무드보드 ${roundIndex + 1}라운드 사진 ${photoIndex + 1}`,
    })),
  }),
)
