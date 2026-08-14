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
