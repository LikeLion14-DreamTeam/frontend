import { css } from 'styled-components'

/**
 * 화면 위에 덮는 층의 폭. 시트와 사진 크게 보기가 함께 쓴다.
 *
 * 세로에서는 페이지와 같은 폭(450)까지만 채워 가운데 세우고, 가로에서는
 * 화면을 꽉 채운다. 가로는 폭이 900 안팎이라 상한에 묶어 두면 양옆으로
 * 뒤가 비친다.
 *
 * 값을 여기 한 곳에 둔다. 덮는 층마다 따로 적어 두면 402 와 450 이 섞였던
 * 것처럼 다시 어긋난다.
 *
 * 쓰는 쪽에서 `left: 50%` 와 `translateX(-50%)` 로 가운데를 잡는 것을 전제한다.
 */
const overlayWidth = css`
  width: min(100%, 450px);

  @media (orientation: landscape) {
    width: 100%;
  }
`

export default overlayWidth
