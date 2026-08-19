/**
 * 경도를 지도가 표현하는 한 바퀴 범위로 접는다.
 *
 * Google Maps는 360도를 넘는 경도에도 같은 장소의 마커를 표시할 수 있지만,
 * 폴리라인은 그 숫자 차이를 그대로 이용한다. 저장·표시 전에 한 바퀴 범위로
 * 맞춰 두면 날짜순 동선도 항상 가까운 쪽으로 이어진다.
 */
export const normalizeLongitude = (longitude) => {
  const value = Number(longitude)

  if (!Number.isFinite(value)) return longitude
  if (value >= -180 && value <= 180) return value

  const normalized = ((value + 180) % 360 + 360) % 360 - 180

  // 동쪽 180도는 입력값의 부호와 관계없이 같은 자리를 뜻한다.
  return normalized === -180 ? 180 : normalized
}

export const normalizeMapPosition = ({ lat, lng }) => ({
  lat,
  lng: normalizeLongitude(lng),
})
