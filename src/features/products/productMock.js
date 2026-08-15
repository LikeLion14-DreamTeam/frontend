import { ApiError } from '../../api/errors'

const MOCK_PRODUCTS_STORAGE_KEY = 'orte:mock:products'
const MOCK_USER_ID = 1

const DEFAULT_MOCK_PRODUCTS = [
  {
    tag_id: 'tag_bag_visetos',
    product_type: 'BAG',
    product_name: '비세토스 백팩',
    registered_at: '2026-08-13T09:00:00.000000Z',
    pin_count: 9,
  },
  {
    tag_id: 'tag_charm_logo',
    product_type: 'CHARM',
    product_name: '로고 참 키링',
    registered_at: '2026-08-01T09:00:00.000000Z',
    pin_count: 0,
  },
]

const cloneDefaultProducts = () =>
  DEFAULT_MOCK_PRODUCTS.map((product) => ({ ...product }))

const loadMockProducts = () => {
  if (typeof window === 'undefined') return cloneDefaultProducts()

  try {
    const storedProducts = JSON.parse(
      window.localStorage.getItem(MOCK_PRODUCTS_STORAGE_KEY),
    )

    if (!Array.isArray(storedProducts)) return cloneDefaultProducts()

    return storedProducts
      .filter(
        (product) =>
          typeof product?.tag_id === 'string' && product.tag_id !== '',
      )
      .map((product) => {
        const { tagging_count: legacyTaggingCount, ...normalizedProduct } =
          product

        return {
          ...normalizedProduct,
          pin_count: normalizedProduct.pin_count ?? legacyTaggingCount ?? 0,
        }
      })
  } catch {
    return cloneDefaultProducts()
  }
}

const persistMockProducts = () => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      MOCK_PRODUCTS_STORAGE_KEY,
      JSON.stringify(MOCK_PRODUCTS),
    )
  } catch {
    // 저장소를 사용할 수 없는 환경에서도 mock API 자체는 정상 동작한다.
  }
}

const MOCK_PRODUCTS = loadMockProducts()

/** 화면에서 사용하는 pin_count가 포함된 등록 제품 목록을 반환한다. */
export const getMockProducts = () => ({
  products: MOCK_PRODUCTS.map((product) => ({ ...product })),
})

/** API 명세 8.1과 같이 NFC 태그를 현재 사용자 계정에 연결한다. */
export const linkMockProduct = (tagId) => {
  const linkedProduct = MOCK_PRODUCTS.find(
    (product) => product.tag_id === tagId,
  )

  if (linkedProduct) {
    return {
      tag_id: linkedProduct.tag_id,
      user_id: MOCK_USER_ID,
      registered_at: linkedProduct.registered_at,
    }
  }

  const registeredAt = new Date().toISOString()

  MOCK_PRODUCTS.push({
    tag_id: tagId,
    product_type: null,
    product_name: '',
    registered_at: registeredAt,
    pin_count: 0,
  })
  persistMockProducts()

  return {
    tag_id: tagId,
    user_id: MOCK_USER_ID,
    registered_at: registeredAt,
  }
}

/** API 명세 7.2와 같이 제품의 계정 연결을 해제한다. */
export const unlinkMockProduct = (tagId) => {
  const productIndex = MOCK_PRODUCTS.findIndex(
    (product) => product.tag_id === tagId,
  )

  if (productIndex === -1) {
    throw new ApiError({
      status: 404,
      code: 'NOT_FOUND',
      message: '연결된 제품을 찾을 수 없습니다.',
    })
  }

  MOCK_PRODUCTS.splice(productIndex, 1)
  persistMockProducts()

  return { tag_id: tagId, user_id: null }
}
