import apiClient from '../../api/client'
import { getMockProducts } from './productMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'
const PRODUCTS_ENDPOINT = '/users/me/products'

/** API 명세 7.1: 인증된 사용자의 등록 제품 목록을 조회한다. */
export const getProducts = async () => {
  if (USE_MOCK) {
    return getMockProducts()
  }

  return apiClient.get(PRODUCTS_ENDPOINT)
}
