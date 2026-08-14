import { ApiError } from '../../api/errors'

export const MOCK_TASTE_PROFILE_AXES = [
  { axis_code: 'brightness', value: 62, status: 'REFLECTED' },
  { axis_code: 'vividness', value: 40, status: 'REFLECTED' },
  { axis_code: 'tone', value: 55, status: 'REFLECTED' },
  { axis_code: 'density', value: 30, status: 'REFLECTED' },
  { axis_code: 'framing', value: 70, status: 'REFLECTED' },
  { axis_code: 'angle', value: 45, status: 'REFLECTED' },
]

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

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
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

  return {
    axis_code: tasteAxis.axis_code,
    user_id: 1,
    value: tasteAxis.value,
    status: tasteAxis.status,
  }
}
