const MOCK_PRODUCTS = [
  {
    tag_id: 'tag_bag_visetos',
    product_type: 'BAG',
    product_name: '비세토스 백팩',
    registered_at: '2026-08-13T09:00:00.000000Z',
    tagging_count: 9,
  },
  {
    tag_id: 'tag_charm_logo',
    product_type: 'CHARM',
    product_name: '로고 참 키링',
    registered_at: '2026-08-01T09:00:00.000000Z',
    tagging_count: 3,
  },
]

/** API 명세 7.1 응답과 동일한 등록 제품 목록을 반환한다. */
export const getMockProducts = () => ({
  products: MOCK_PRODUCTS.map((product) => ({ ...product })),
})
