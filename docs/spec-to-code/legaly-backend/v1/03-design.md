# 03 · 설계 문서 — 리걸리 백엔드

동작은 `00-behavior-grid.md`. 핵심 원칙: **순수 로직은 Deno 비의존 TS로 분리**해 Vitest(Node)로 단위
테스트, Edge Function `index.ts`는 그 위 얇은 어댑터(배포 후 수동 QA). fetch는 Node18+/Deno 공통 전역.

## 파일 구조 (신규/수정)
```
supabase/
  migrations/0001_init.sql            # saved_consultations, legal_cache, RLS, 인덱스
  functions/
    _shared/
      cors.ts            # CORS 헤더 + OPTIONS preflight (얇음)
      errors.ts          # 에러 모델: ApiError(code), errorResponse(), CODE→status 맵 [순수]
      ids.ts             # idToEmail(id) = `${id}@legaly.app`, isValidTeam [순수]
      lawApi.ts          # 국가법령정보 fetch+파싱 → LawDetail/CaseDetail; buildLawUrl [순수 파서 + fetch]
      corpus.ts          # 팀별 큐레이션 목록(LawListItem/CaseListItem) + RAG용 코퍼스 텍스트 + ID 매핑 [순수]
      retrieve.ts        # tokenize(q)·scoreDoc·retrieve(team,q)→{laws,cases} [순수]
      prompt.ts          # buildAnswerMessages(team, q, sources)→{system,messages} [순수]
      anthropic.ts       # callClaude(messages, key)→text (fetch) [fetch 주입 가능]
      legalHandler.ts    # handleLegal(url, deps)→{status, body} [순수, 테스트 대상]
      answerHandler.ts   # handleAnswer(body, deps)→{status, body} [순수, 테스트 대상]
    legal/index.ts       # Deno.serve → cors + handleLegal(+캐시·fetch·env 주입)
    answer/index.ts      # Deno.serve → cors + handleAnswer(+anthropic·env 주입)
  seed/seed-users.ts     # service_role로 4계정 createUser (멱등 upsert)
src/lib/
  supabaseClient.ts      # createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
  storage.ts (수정)       # saved CRUD → supabase 쿼리(async). team/pendingQ는 localStorage 유지
  dataClient.ts (수정)    # getLaws/getLaw/getCases/getCase/getAnswer → Edge Function fetch(+샘플 폴백)
  config.ts (신규)        # EDGE_BASE = `${VITE_SUPABASE_URL}/functions/v1`
src/context/AppContext.tsx (수정)  # login/logout/user → Supabase Auth(아이디 변환·onAuthStateChange)
```
의존성 추가: `@supabase/supabase-js`.

## DB (migrations/0001_init.sql)
`02-resolved-spec.md`의 SQL 그대로: `saved_consultations`(+RLS own select/insert/delete, 인덱스),
`legal_cache(key pk, payload jsonb, fetched_at)`. additive·reversible. 사용자가 SQL Editor로 적용.

## 순수 로직 시그니처 (단위 테스트 대상)
```ts
// ids.ts
idToEmail(id: string): string                 // 'swoo1427' → 'swoo1427@legaly.app'; trim/lowercase
isValidTeam(x): x is Team                      // '법무'|'세무'
// errors.ts
class ApiError { code: ErrCode; message: string }
statusFor(code): number                        // UNAUTHENTICATED→401 ... INTERNAL→500
errorBody(code, message): { error: {code,message} }
// retrieve.ts
tokenize(q: string): string[]                  // 공백/조사 제거, 2자+ 키워드
scoreDoc(tokens, text): number                 // 토큰 포함수 기반 점수
retrieve(team, q): { laws: LawCitation[]; cases: CaseCitation[] }  // 코퍼스 매칭 상위(법령≤3,판례≤2)
// prompt.ts
buildAnswerMessages(team, q, sources): { system: string; user: string }  // 팀 페르소나 + 출처 컨텍스트
// lawApi.ts
buildLawUrl(kind:'law'|'prec', id, oc): string
parseLaw(json): LawDetail                       // 국가법령정보 응답 → LawDetail
parseCase(json): CaseDetail
// corpus.ts
LAW_LIST[team]: LawListItem[]; CASE_LIST[team]: CaseListItem[]
lawSourceId(name)→국가법령정보 ID/MST; CORPUS[team]: {id,text}[]  // RAG 매칭용
```

## 핸들러 계약 (handleLegal/handleAnswer — DI로 테스트)
```ts
handleLegal(url: URL, deps: { fetch; cacheGet; cacheSet; oc }): Promise<{status:number, body:unknown}>
//  GET ?kind=laws&team=  → 200 LawListItem[]
//  GET ?kind=cases&team= → 200 CaseListItem[]
//  GET ?kind=law&id=     → 200 LawDetail (캐시→실조회→스텁 폴백)
//  GET ?kind=case&id=    → 200 CaseDetail
//  잘못된 kind/team/id    → 400 VALIDATION;  외부 타임아웃 → 504(캐시 있으면 200 캐시)
handleAnswer(body, deps: { retrieve; callClaude; rateCheck }): Promise<{status, body}>
//  {team,question} 검증(team 유효, 1≤len≤1000) 아니면 400
//  rate 초과 → 429;  retrieve→prompt→callClaude;  Claude 실패 → 502/504
//  성공 → 200 { text, sources:{laws,cases} }
```

## 에러 코드 ↔ 상태
UNAUTHENTICATED 401 · VALIDATION 400 · NOT_FOUND 404 · RATE_LIMITED 429 · UPSTREAM_TIMEOUT 504 ·
UPSTREAM_ERROR 502 · INTERNAL 500. 바디 `{error:{code,message}}`. 모든 응답 CORS 헤더.

## 프론트 교체(시그니처 불변)
- `supabaseClient.ts`: 단일 클라이언트.
- `AppContext`: `login(id,pw)`→`signInWithPassword(idToEmail(id),pw)`; `user`={name: metadata.name||id}; `logout`→signOut; 마운트 시 `getSession`+`onAuthStateChange`. (데모 login(name) 시그니처는 id/pw로 변경 → 로그인 모달도 비번 필드 추가 = 작은 UI 변경, 별도 그리드 셀)
- `storage`: getSaved/addSaved/deleteSaved → `supabase.from('saved_consultations')`. team/pendingQ/keys 유지.
- `dataClient`: getLaws/... → `fetch(EDGE_BASE/legal?...)`; getAnswer → `POST EDGE_BASE/answer`. 네트워크 실패 시
  기존 샘플(sampleData) 폴백(graceful) — 개발/오프라인 회복력.

## 시드 (seed/seed-users.ts)
service_role 클라이언트로 4계정 `admin.createUser({email:idToEmail(id), password:'legaly-temp-1234',
email_confirm:true, user_metadata:{name:id}})`. 이미 있으면 skip(멱등). 실행: `deno run`/`node`(키는 env).

## 배포(사용자 권한)
1. SQL Editor에 `0001_init.sql` 실행. 2. `supabase secrets set ANTHROPIC_API_KEY=.. LAW_OC=..`.
3. `supabase functions deploy legal answer`(access token). 4. 계정 시드 실행. 5. 프론트 `.env.local` 확인.
로컬 supabase/deno 미설치 → 설치 또는 대시보드 사용. 상세는 08-completion.

## 테스트 전략 (04 참조)
- 단위(Vitest, `tests/unit/backend/`): ids·errors·tokenize/score/retrieve·buildAnswerMessages·parseLaw/Case·
  buildLawUrl·corpus 매핑.
- 계약(Vitest): handleLegal/handleAnswer를 DI(fetch/캐시/claude stub)로 — 상태코드·바디·폴백·rate·검증.
- 프론트: storage/dataClient는 supabase/edge를 mock해 시그니처 유지 단위 테스트(+기존 128 회귀).
- 실 통합(실 Supabase/국가법령정보/Claude) = 배포 후 수동 QA(curl + DB peek). deferred에 절차 명시.
