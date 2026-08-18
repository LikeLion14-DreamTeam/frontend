/**
 * 좌표를 주소·도시·나라로 바꾼다(리버스 지오코딩).
 *
 * 핀을 만들 때(8.2) 프론트가 이 값을 함께 보내야 3.1 의 방문 도시 목록과
 * 3.3 의 국가 도장이 채워진다. 서버는 좌표만으로는 도시를 알 수 없다.
 *
 * 구글 지도 스크립트는 `main.jsx` 의 `APIProvider` 가 앱 시작 시 한 번 넣는다.
 * 여기서는 그 스크립트가 만들어 둔 로더로 geocoding 라이브러리만 따로 불러온다.
 *
 * 주의: Google Cloud 콘솔에서 **Geocoding API** 를 켜야 동작한다.
 * 지금까지 쓰던 Maps JavaScript API 만으로는 요청이 거절된다.
 */

/** 지오코더는 한 번만 만들어 두고 재사용한다. */
let geocoderPromise = null

const loadGeocoder = () => {
  const maps = globalThis.window?.google?.maps

  // 키가 없거나 스크립트가 아직 안 붙은 경우. 위치 정보 없이 저장하게 둔다.
  if (!maps?.importLibrary) return Promise.resolve(null)

  geocoderPromise ??= maps
    .importLibrary('geocoding')
    .then(({ Geocoder }) => new Geocoder())
    .catch(() => {
      // 다음 저장에서 다시 시도할 수 있게 실패한 약속은 버린다.
      geocoderPromise = null
      return null
    })

  return geocoderPromise
}

/**
 * 도시로 쓸 구성요소. 앞에 있는 것부터 찾는다.
 *
 * 서울·부산 같은 광역시는 `locality` 가 비어 있고 `administrative_area_level_1`
 * 에 이름이 들어온다. 전주·여수처럼 도 아래 시는 반대다.
 */
const CITY_TYPES = ['locality', 'administrative_area_level_1']

const findComponent = (components, type) =>
  components.find((component) => component.types.includes(type))

/**
 * 결과 중 사람이 읽을 주소를 고른다.
 *
 * 산속이나 바다처럼 도로명이 없는 곳은 첫 결과가 `RHV5+M2 일본 야마나시현…`
 * 같은 플러스 코드다. 좌표를 문자로 줄인 구글 표기라 주소로 보여줄 게 못 된다.
 * 결과는 좁은 범위부터 오므로, 플러스 코드가 아닌 것 중 첫 번째가 가장 정확하다.
 */
const pickAddressResult = (results) =>
  results.find((result) => !result.types.includes('plus_code')) ?? results[0]

/**
 * 앞에 붙은 플러스 코드를 떼어낸다.
 *
 * 플러스 코드 결과밖에 없을 때를 위한 대비다. 코드만 지우면 뒤에 남는
 * `일본 야마나시현 호쿠토시` 가 주소 역할을 한다.
 */
const PLUS_CODE_PREFIX =
  /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\s*/

const toReadableAddress = (formattedAddress = '') =>
  formattedAddress.replace(PLUS_CODE_PREFIX, '').trim()

/**
 * @param latitude 위도. 위치 권한을 거부했으면 null 이다.
 * @param longitude 경도
 * @returns `{ address, city, countryName, countryCode }` 또는 실패 시 null
 */
export const reverseGeocode = async ({ latitude, longitude }) => {
  if (latitude == null || longitude == null) return null

  const geocoder = await loadGeocoder()
  if (!geocoder) return null

  try {
    const { results } = await geocoder.geocode({
      location: { lat: latitude, lng: longitude },
      // 도시·나라 이름을 한국어로 받는다. 나라 코드는 언어와 무관하게 같다.
      language: 'ko',
    })

    const best = pickAddressResult(results)
    if (!best) return null

    const components = best.address_components
    const city = CITY_TYPES.map(
      (type) => findComponent(components, type)?.long_name,
    ).find(Boolean)

    const country = findComponent(components, 'country')

    return {
      address: toReadableAddress(best.formatted_address),
      city: city ?? '',
      countryName: country?.long_name ?? '',
      // ISO 3166-1 alpha-2. 여권 도장 파일명(`KR.webp`)과 같은 값이다.
      countryCode: country?.short_name ?? '',
    }
  } catch {
    // 결과가 없거나(ZERO_RESULTS) 요청이 거절돼도 핀 저장은 막지 않는다.
    return null
  }
}

/**
 * 주소나 장소 이름을 좌표로 바꾼다(지오코딩).
 *
 * 수동 핀 추가 화면의 주소 검색에 쓴다. 역지오코딩과 같은 지오코더를 쓰므로
 * 켜야 하는 API 도 같다.
 *
 * @returns `{ latitude, longitude, address, viewport }`. 못 찾으면 null.
 *   `viewport` 는 구글이 권장하는 표시 영역이다. 나라면 나라만큼, 건물이면
 *   건물 주변만큼 잡혀 있어 그대로 지도에 맞추면 배율이 알아서 정해진다.
 */
export const geocodeAddress = async (query) => {
  const keyword = query?.trim()
  if (!keyword) return null

  const geocoder = await loadGeocoder()
  if (!geocoder) return null

  try {
    const { results } = await geocoder.geocode({
      address: keyword,
      language: 'ko',
    })

    const [best] = results
    if (!best) return null

    const { location, viewport } = best.geometry

    return {
      latitude: location.lat(),
      longitude: location.lng(),
      address: toReadableAddress(best.formatted_address),
      viewport: viewport?.toJSON() ?? null,
    }
  } catch {
    // 결과가 없거나(ZERO_RESULTS) 요청이 거절된 경우
    return null
  }
}
