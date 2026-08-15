import apiClient from '../../api/client'
import {
  getMockProducts,
  linkMockProduct,
  unlinkMockProduct,
} from './productMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'
const PRODUCTS_ENDPOINT = '/users/me/products'

const getPinCount = (value) => {
  const pinCount = Number(value)

  return Number.isFinite(pinCount)
    ? Math.max(0, Math.trunc(pinCount))
    : 0
}

const normalizeProductList = (productList) => ({
  ...productList,
  products: Array.isArray(productList?.products)
    ? productList.products.map((product) => {
        const { tagging_count: taggingCount, ...normalizedProduct } = product

        return {
          ...normalizedProduct,
          pin_count: getPinCount(
            normalizedProduct.pin_count ?? taggingCount,
          ),
        }
      })
    : [],
})

/** API 명세 7.1: 인증된 사용자의 등록 제품 목록을 조회한다. */
export const getProducts = async () => {
  const productList = USE_MOCK
    ? getMockProducts()
    : await apiClient.get(PRODUCTS_ENDPOINT)

  // 명세의 tagging_count는 이 태그로 생성된 핀 수이므로 화면 모델에서는
  // 의미가 분명한 pin_count로 정규화한다.
  return normalizeProductList(productList)
}

/** API 명세 8.1: NFC 태그를 현재 사용자 계정에 자동으로 연결한다. */
export const linkProduct = async (tagId) => {
  if (USE_MOCK) {
    return linkMockProduct(tagId)
  }

  return apiClient.patch(
    `/products/${encodeURIComponent(tagId)}/link`,
  )
}

/** API 명세 7.2: 제품과 현재 사용자 계정의 연결을 해제한다. */
export const unlinkProduct = async (tagId) => {
  if (USE_MOCK) {
    return unlinkMockProduct(tagId)
  }

  return apiClient.patch(
    `/products/${encodeURIComponent(tagId)}/unlink`,
  )
}
