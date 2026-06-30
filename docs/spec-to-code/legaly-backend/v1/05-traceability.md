# 05 · 추적성 — 리걸리 백엔드

그리드 셀 ↔ 테스트/검증 ↔ 코드 ↔ 통과. (단위/계약=Vitest, 통합=라이브 배포 수동검증)

| 그리드 셀 | 테스트/검증 | 코드 | 통과 |
|---|---|---|---|
| A 아이디→이메일 | `logic.test` ids | `_shared/ids.ts`,`AppContext` | ✅ |
| A 로그인(이메일+비번) | 라이브: swoo1427 로그인 | `AppContext.login` | ✅ |
| A 세션 동기화 | (수동) onAuthStateChange | `AppContext` | ✅ |
| A 시드 4계정 | 라이브: 4 created | `seed/seed-users.mjs` | ✅ |
| A 로그인 실패 표시 | `authModal`(데모) + 코드 | `AuthModal` err | ✅ |
| B saved RLS(본인만) | 라이브: 다른 사용자 0건 | `migrations/0001` | ✅ |
| B getSaved/add/delete | 라이브 CRUD + `dataClient` | `dataClient`,RLS | ✅ |
| B getSaved 에러 전파 | 코드(R4) | `dataClient.getSaved` | ✅ |
| C legal 목록 | `handlers.test` + 라이브 12건 | `legalHandler`,`legal/index` | ✅ |
| C legal 상세 캐시/폴백 | `handlers.test`(히트/미스/스텁) | `legalHandler` | ✅ |
| C legal 타임아웃 504 | `handlers.test` R2 | `legalHandler` | ✅ |
| C 검증(kind/team/id) | `handlers.test` | `legalHandler` | ✅ |
| D RAG 검색 | `logic.test` retrieve | `retrieve.ts` | ✅ |
| D 프롬프트 빌드 | `logic.test` prompt | `prompt.ts` | ✅ |
| D answer 검증/rate/실패 | `handlers.test`(400/429/502) | `answerHandler` | ✅ |
| D answer 정상 | 라이브: 로그인 200 Claude | `answer/index` | ✅ |
| D AI 로그인 필수 | 라이브: 게스트 401 | `answer/index`(getUser), `ConsultPage` 게이트 | ✅ |
| E 에러모델/상태 | `logic.test` errors | `errors.ts` | ✅ |
| E CORS/try-catch | `handlers`+코드(R1) | `cors.ts`,`*/index.ts` | ✅ |
| E rate 맵 정리 | 코드(R5) | `answer/index` | ✅ |
| E 시크릿 서버전용 | 코드/배포(secrets set) | `.env.local`,function secrets | ✅ |
| 프론트 시그니처 불변 | 기존 128 회귀 GREEN | dataClient/storage 이중모드 | ✅ |

미커버: 국가법령정보 실 상세(MST 매핑) — deferred(현재 스텁 폴백). 임베딩 RAG — deferred.
