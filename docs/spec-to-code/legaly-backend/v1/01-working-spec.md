# 01 · 작업 스펙 — 리걸리 백엔드 (legaly-backend)

> 기존 프론트(`docs/spec-to-code/legaly/`)의 `dataClient`/`storage`/`AppContext` 인터페이스를 실제
> 서버로 교체. 디자인/프론트 계약이 이 백엔드의 1차 권위.

## 0. 결정사항(인제스트)
| 항목 | 값 |
|---|---|
| 구조 | **Supabase 중심**: Auth + Postgres(+RLS) + Edge Functions(Deno) |
| 범위 | (A) 인증+보관함 DB · (B) 국가법령정보 실데이터 중계 · (C) AI 답변 RAG — **3개 모두** |
| 외부 API | 국가법령정보 OPEN API(`OC=test-oc`), Anthropic Claude API |
| 시크릿 | `.env.local`에 Supabase URL/anon. service_role·Anthropic 키·OC는 **Supabase Function Secrets**/사용자 제공 |
| 테스트 | 순수 로직(파서·매퍼·RAG 검색·검증)은 Vitest 단위; Edge Function 핸들러는 그 위 얇은 층. 실 Supabase/외부 통합은 배포·키 제공 시점 |
| 모드/티어/스코프 | checkpoint / full / build |

## 1. 환경 탐지
- 런타임: Supabase Edge Functions = **Deno**. 로컬 `supabase` CLI·`deno` **미설치** → 배포는 사용자
  권한(service_role/access token)으로. 마이그레이션은 reviewable SQL로 작성(사용자 적용).
- 테스트: 기존 **Vitest**(Node/jsdom). Edge Function 핵심 로직을 프레임워크 비의존 모듈로 분리해
  Vitest로 단위 테스트(외부 fetch는 stub). 통합/계약은 가능 범위에서 mock, 실연동은 배포 후.
- 프론트: `src/lib/dataClient.ts`(현재 샘플), `src/lib/storage.ts`(localStorage), `context/AppContext.tsx`
  (데모 login). 이들을 교체 대상.

## 2. 백엔드가 충족할 계약(프론트 dataClient — 불변 시그니처)
```ts
getLaws(team): Promise<LawListItem[]>
getLaw(team, id): Promise<LawDetail>
getCases(team): Promise<CaseListItem[]>
getCase(team, id): Promise<CaseDetail>
getAnswer(team, question): Promise<AnswerPayload>  // {text, sources:{laws:LawCitation[], cases:CaseCitation[]}}
getSaved(): Promise<SavedItem[]>      // 인증 사용자 소유분
addSaved(item): Promise<void>
deleteSaved(id): Promise<void>
// getGuides/getGuide: 정적 콘텐츠 → 프론트 유지(이번 백엔드 범위 밖)
```
타입(LawListItem/LawDetail/CaseListItem/CaseDetail/LawCitation/CaseCitation/AnswerPayload/SavedItem)은
`legaly` v1 resolved-spec 그대로. 백엔드 응답은 이 형태로 매핑한다.

## 3. 워크스트림

### (A) 인증 + 보관함 DB
- **Supabase Auth**: 이메일(+선택 소셜). 프론트 데모 login(이름만) → 실제 세션으로 교체. 사용자 표시명은
  Auth user metadata(`name`).
- **테이블 `saved_consultations`**: `id uuid pk`, `user_id uuid → auth.users`, `team text`, `title text`,
  `summary text`, `date text`, `created_at timestamptz default now()`.
- **RLS**: 사용자는 자기 행만 select/insert/delete. (전역 공유 → 사용자별로 전환: v1 deferred 항목 해소.)
- 프론트 `storage.getSaved/addSaved/deleteSaved` → `supabase-js`로 PostgREST CRUD(인증 토큰). `AppContext`
  login/logout → Supabase Auth.

### (B) 국가법령정보 실데이터 중계 (Edge Function)
- 브라우저 CORS·OC 키 노출 회피 위해 **Edge Function이 서버에서 중계**.
- 국가법령정보 OPEN API:
  - 법령 목록: `lawSearch.do?OC=…&target=law&type=JSON&query=…`
  - 법령 본문/조문: `lawService.do?OC=…&target=law&type=JSON&ID|MST=…`
  - 판례 목록/본문: `target=prec`(search/service).
- 응답을 프론트 타입(LawListItem/LawDetail/CaseListItem/CaseDetail)으로 **매핑**. 팀(법무/세무)→분야/
  검색어 매핑 방식은 갭(아래).

### (C) AI 답변 RAG (Edge Function)
- `POST answer {team, question}` → ① 질문에서 키워드 추출/분야 추정 → ② 관련 법령·판례 검색(국가법령정보
  또는 자체 코퍼스) → ③ Anthropic Claude `messages` 호출(컨텍스트=검색된 조문/판례) → ④ `{text, sources}`
  반환(출처 카드 = 검색 결과). Anthropic 키는 Function Secret.

## 4. 미해결(→ Phase 2/3 갭)
- 팀→법령/판례 매핑: 실시간 검색 vs **큐레이션 ID 세트 + 실본문 조회** 하이브리드?
- RAG 검색 소스: 국가법령정보 실시간 vs 사전 인덱싱 코퍼스? 임베딩 여부?
- 인증 방식: 이메일 매직링크/비밀번호/소셜 범위.
- 에러 모델(상태코드+머신코드), 외부 호출 실패(타임아웃/재시도), rate limit, 캐싱, 페이지네이션.
- 응답 캐싱(국가법령정보 호출 비용/속도) 및 보관함 사용자 스코프 마이그레이션.

## 5. 범위 밖(deferred 유지)
- 가이드 콘텐츠 서버화(현재 정적 유지), 전체 코퍼스 색인, 운영 배포 파이프라인, Playwright 픽셀 베이스라인.
