import { ApiError } from '../../api/errors'

const MOCK_TASTE_PROFILE_AXES_STORAGE_KEY = 'orte:mock:taste-profile-axes'
const MOCK_TASTE_PROFILE_AXES_STORAGE_VERSION = 2
const LEGACY_REVERSED_AXIS_CODES = new Set([
  'brightness',
  'vividness',
  'tone',
])

const DEFAULT_MOCK_TASTE_PROFILE_AXES = [
  { axis_code: 'brightness', value: 38, status: 'REFLECTED' },
  { axis_code: 'vividness', value: 60, status: 'REFLECTED' },
  { axis_code: 'tone', value: 45, status: 'REFLECTED' },
  { axis_code: 'density', value: 30, status: 'REFLECTED' },
  { axis_code: 'photo_type', value: 50, status: 'REFLECTED' },
]

const cloneDefaultTasteProfileAxes = () =>
  DEFAULT_MOCK_TASTE_PROFILE_AXES.map((axis) => ({ ...axis }))

const persistMockTasteProfileAxes = (axes) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      MOCK_TASTE_PROFILE_AXES_STORAGE_KEY,
      JSON.stringify({
        version: MOCK_TASTE_PROFILE_AXES_STORAGE_VERSION,
        axes,
      }),
    )
  } catch {
    // 저장소를 사용할 수 없는 환경에서도 mock API 자체는 정상 동작한다.
  }
}

const normalizeStoredTasteProfileAxes = (
  storedAxes,
  { reverseLegacyDirection = false } = {},
) => {
  const storedAxisByCode = new Map(
    storedAxes.map((axis) => [axis.axis_code, axis]),
  )

  return DEFAULT_MOCK_TASTE_PROFILE_AXES.map((defaultAxis) => {
    const storedAxis = storedAxisByCode.get(defaultAxis.axis_code)
    const storedValue = Number(storedAxis?.value)

    if (
      !Number.isFinite(storedValue) ||
      storedValue < 0 ||
      storedValue > 100
    ) {
      return { ...defaultAxis }
    }

    const value =
      reverseLegacyDirection &&
      LEGACY_REVERSED_AXIS_CODES.has(defaultAxis.axis_code)
        ? 100 - storedValue
        : storedValue

    return {
      ...defaultAxis,
      value,
      status: storedAxis.status ?? defaultAxis.status,
    }
  })
}

const loadMockTasteProfileAxes = () => {
  if (typeof window === 'undefined') return cloneDefaultTasteProfileAxes()

  try {
    const storedProfile = JSON.parse(
      window.localStorage.getItem(MOCK_TASTE_PROFILE_AXES_STORAGE_KEY),
    )

    if (Array.isArray(storedProfile)) {
      const migratedAxes = normalizeStoredTasteProfileAxes(storedProfile, {
        reverseLegacyDirection: true,
      })

      persistMockTasteProfileAxes(migratedAxes)
      return migratedAxes
    }

    if (
      storedProfile?.version !== MOCK_TASTE_PROFILE_AXES_STORAGE_VERSION ||
      !Array.isArray(storedProfile.axes)
    ) {
      return cloneDefaultTasteProfileAxes()
    }

    return normalizeStoredTasteProfileAxes(storedProfile.axes)
  } catch {
    return cloneDefaultTasteProfileAxes()
  }
}

export const MOCK_TASTE_PROFILE_AXES = loadMockTasteProfileAxes()

/** API 명세 2.4 응답과 동일한 형태의 취향 축 목록을 반환한다. */
export const getMockTasteProfileAxes = () => ({
  axes: MOCK_TASTE_PROFILE_AXES.map((axis) => ({ ...axis })),
})

/** API 명세 2.5와 동일하게 축 하나를 수정하고 반영 완료 상태를 반환한다. */
export const updateMockTasteProfileAxis = ({ axisCode, value }) => {
  if (typeof axisCode !== 'string' || axisCode.trim() === '') {
    throw new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: '수정할 취향 축을 확인해 주세요.',
    })
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: '취향 값은 0부터 100 사이여야 합니다.',
    })
  }

  const tasteAxis = MOCK_TASTE_PROFILE_AXES.find(
    (axis) => axis.axis_code === axisCode,
  )

  if (!tasteAxis) {
    throw new ApiError({
      status: 404,
      code: 'NOT_FOUND',
      message: '취향 축을 찾을 수 없습니다.',
    })
  }

  tasteAxis.value = value
  tasteAxis.status = 'REFLECTED'
  persistMockTasteProfileAxes(MOCK_TASTE_PROFILE_AXES)

  return {
    axis_code: tasteAxis.axis_code,
    user_id: 1,
    value: tasteAxis.value,
    status: tasteAxis.status,
  }
}
