# Issue 템플릿
```markdown
## ✅ 기능 설명

어떤 기능을 추가하려는지 간단히 설명해주세요.

---

## 🛠️ 작업 내용 (Todo)

- [ ]
- [ ]
- [ ]

---

## 🔗 참고 자료 (선택)

- 관련 문서:
- 참고 Issue:
```



# PR 템플릿
```markdown

## 🔗 관련 이슈 (Issue)

해당 PR이 어떤 이슈를 해결하는지 연결해주세요.

- Closes #이슈번호
- Related to #이슈번호

---

## ✅ 작업 내용

이번 PR에서 어떤 작업을 했는지 요약해주세요.

---

## 🖥️ 테스트 방법

리뷰어가 직접 확인할 수 있도록 테스트 방법을 적어주세요.

1. `/login` 페이지 접속
2. 아이디/비밀번호 입력
3. 로그인 버튼 클릭
4. 메인 페이지 이동 확인
```



# 시작하기

```bash
npm install
cp .env.example .env   # 값은 팀 채널 참고
npm run dev
```

백엔드가 완성되기 전까지는 `.env` 의 `VITE_USE_MOCK_API=true` 로 두고 mock 데이터로 개발한다. 완성되면 `false` 로 바꾸기만 하면 된다.

---

# API 연동 규칙

## 폴더 구조

```
src/
├─ api/
│  ├─ client.js       # 공용 Axios 인스턴스 (공통)
│  ├─ session.js      # JWT 저장·조회 (공통)
│  └─ errors.js       # 에러 형식 통일 (공통)
│
└─ features/
   ├─ auth/           # 로그인 담당
   ├─ trips/          # 여행 담당
   ├─ pins/           # 핀 담당
   └─ photobooks/     # 포토북 담당
```

`src/api/` 는 공통 영역이라 기능 개발 중에 건드리지 않는다. 수정이 필요하면 팀에 공유 후 변경한다.

각 담당자는 자기 `features/` 폴더 안에 아래처럼 파일을 만든다.

```
features/trips/
├─ tripApi.js      # API 함수
├─ tripMock.js     # mock 데이터
└─ useTripStore.js # 필요할 때만
```

## API 함수 작성 예시

```js
// src/features/trips/tripApi.js
import apiClient from '../../api/client'
import { MOCK_TRIPS } from './tripMock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

export const getTrips = async () => {
  if (USE_MOCK) {
    return MOCK_TRIPS
  }

  return apiClient.get('/trips', { params: { limit: 20 } })
}
```

```js
// 화면에서는 mock 인지 실제 API 인지 몰라도 된다
const data = await getTrips()
setTrips(data.trips)
```

## 규칙

1. 컴포넌트에서 `axios.get()` 을 직접 사용하지 않는다.
2. 반드시 기능별 `*Api.js` 를 통해 요청한다.
3. 공통 `apiClient` 를 사용한다.
4. API 함수는 Axios 응답 객체가 아닌 실제 데이터만 반환한다.
5. 에러는 `error.message`, `error.code`, `error.status` 로 처리한다.
6. 서버 데이터는 우선 페이지의 `useState` 에 저장한다.
7. 여러 화면에 걸쳐 유지할 프론트 데이터만 Zustand 에 저장한다.
8. 백엔드 완성 전에는 기능별 mock 데이터를 사용한다.
9. `204 No Content` API 는 반환값을 사용하지 않는다.
10. S3 업로드 URL 에는 공통 `apiClient` 를 사용하지 않는다.

## Zustand 사용 기준

공통 store 를 하나로 만들지 않는다. 기능 담당자가 필요할 때 자기 폴더에 만든다.

| 데이터 | 저장 위치 |
|---|---|
| 로그인 사용자 | `useAuthStore` (auth 담당) |
| 촬영 중 사진·위치 | `useRecordDraftStore` (pin 담당) |
| 여행·포토북 목록 조회 결과 | 페이지 `useState` |
| 모달 열림 여부 | 페이지 `useState` |

서버에서 받아온 목록은 우선 `useState` 에 둔다. 여러 화면에 걸쳐 유지해야 할 때만 Zustand 로 올린다.
