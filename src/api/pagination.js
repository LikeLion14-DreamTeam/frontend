/**
 * 커서 페이지네이션 응답을 끝까지 이어 받아 하나로 합친다.
 *
 * 명세 4.1 / 4.5 / 5.4 는 `next_cursor` 로 다음 페이지를 알려준다. 지도의 동선,
 * 구간 편집의 핀 선택·집계처럼 전체 목록이 있어야 성립하는 화면이 대부분이라
 * 화면마다 페이지를 이어 붙이는 대신 API 레이어에서 전부 받아 넘긴다.
 *
 * @param fetchPage 커서를 받아 `{ [key]: [], next_cursor }` 를 돌려주는 함수
 * @param key 응답에서 항목 배열이 담긴 필드명
 */
export const fetchAllPages = async (fetchPage, key) => {
  const items = []
  let cursor = null

  do {
    const page = await fetchPage(cursor)
    items.push(...(page[key] ?? []))

    // 같은 커서가 다시 오면 서버 쪽 문제다. 무한 루프로 두지 않는다.
    if (page.next_cursor && page.next_cursor === cursor) break
    cursor = page.next_cursor
  } while (cursor)

  return { [key]: items, next_cursor: null }
}
