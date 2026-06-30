# 03 · 설계 문서 — 리걸리 프론트엔드

`02-resolved-spec.md`(계약) + `00-behavior-grid.md`(동작 전부)를 코드로 옮기는 완전 개발 문서.
**동작 상세는 그리드가 권위** — 이 문서는 파일/타입/함수/컴포넌트 분해와 로직·UI 분리를 못박는다.

## 1. 접근 & 원칙
- **로직/UI 분리.** 순수 로직(스토리지 직렬화, 필터/정렬, 포맷, slug/폴백 해석, 상태 리듀서)은
  `src/lib/`에 React 비의존 순수 함수로 둔다 → Vitest로 단위 테스트. 컴포넌트는 그 위의 얇은 층.
- **데이터 접근 단일 통로.** 컴포넌트는 `localStorage`를 직접 만지지 않는다. 전역 상태(team/user)는
  `AppContext`, 도메인 데이터(법령/판례/답변/보관함)는 비동기 `dataClient`.
- **충실 재구현.** 색/치수/카피는 디자인 `.dc.html` 인라인 스타일을 1:1로. Tailwind는 레이아웃·
  유틸에 쓰고, 팀 색 등 동적 값은 CSS 변수/인라인 스타일로 정확히 맞춘다.
- **백엔드 무수정 교체.** `dataClient`는 전부 `Promise` 반환. 지금은 샘플을 즉시 resolve, 추후 fetch로
  교체해도 컴포넌트 불변.

## 2. 파일 트리(전부 신규)
```
legaly/
├─ package.json · vite.config.ts · tsconfig.json · tsconfig.node.json
├─ tailwind.config.ts · postcss.config.js · vitest.config.ts · playwright.config.ts
├─ index.html                      # Pretendard CDN <link>, #root, <title>리걸리</title>
├─ .gitignore
└─ src/
   ├─ main.tsx                     # createRoot + <BrowserRouter><AppProvider><App/>
   ├─ App.tsx                      # <ScrollToTop/> + <Routes> 7개 + * → /
   ├─ index.css                    # @tailwind; body/폰트/.mono/::selection/스크롤바
   ├─ types.ts                     # 모든 도메인 타입(계약 §아키텍처)
   ├─ theme.ts                     # TEAMS 토큰, 색 상수, navy/foot 등
   ├─ lib/
   │  ├─ storage.ts                # 타입 localStorage 래퍼 + 키 상수 + saved 검증
   │  ├─ sampleData.ts             # 법령/판례/답변 샘플 + slug↔레코드 맵(디자인 1:1)
   │  ├─ dataClient.ts             # DataClient 구현(sampleData/storage 위 async)
   │  ├─ format.ts                 # formatToday, formatSavedDate, summarize, makeSlug, initial
   │  ├─ laws.ts                   # filterLaws, sortLaws (순수)
   │  └─ cases.ts                  # filterCases, sortCases (순수)
   ├─ context/
   │  └─ AppContext.tsx            # team/user 전역 + useApp() + 액션
   ├─ components/
   │  ├─ Header.tsx                # variant: 'lobby' | 'team'
   │  ├─ TeamSegment.tsx           # 법무팀/세무팀 토글
   │  ├─ SubNav.tsx                # 상담·자료실·판례·보관함
   │  ├─ AccountArea.tsx           # 로그인 버튼 | pill + 드롭다운
   │  ├─ AuthModal.tsx             # variant: 'generic' | 'save'
   │  ├─ Footer.tsx                # 네이비 면책 푸터
   │  ├─ ScrollToTop.tsx           # path 변경 시 window 스크롤 top
   │  └─ Disclaimer.tsx            # 공통 면책 문구(상담 입력 하단 등)
   └─ pages/
      ├─ LobbyPage.tsx · ConsultPage.tsx
      ├─ LawsPage.tsx · LawDetailPage.tsx
      ├─ CasesPage.tsx · CaseDetailPage.tsx
      └─ SavedPage.tsx
tests/
├─ unit/        storage · format · laws · cases · dataClient · slug-fallback
├─ component/   header-account · auth-modal · consult · laws-list · law-detail · cases-list · case-detail · saved · lobby
└─ e2e/         navigation · consult-flow · screenshots
```

## 3. 타입 (`src/types.ts`)
계약 §아키텍처의 인터페이스를 그대로 둠: `Team, User, LawListItem, LawArticle, LawDetail,
CaseListItem, CaseDetail, LawCitation, CaseCitation, AnswerPayload, SavedItem, DataClient`.
추가 내부 타입:
```ts
export type LawSort = 'name' | 'date';
export type CaseSort = 'new' | 'old';
export type CourtFilter = '전체' | '대법원' | '대법원(전합)';
export type AuthVariant = 'generic' | 'save';
export type HeaderVariant = 'lobby' | 'team';
// 상담 메시지
export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'ai'; kind: 'greeting'; text: string; starters: string[] }
  | { id: string; role: 'ai'; kind: 'answer'; q: string; text: string; sources: AnswerPayload['sources']; savable: true }
  | { id: string; role: 'ai'; kind: 'pending' }     // 인플라이트 인디케이터
  | { id: string; role: 'ai'; kind: 'error'; q: string };
```

## 4. 테마 (`src/theme.ts`)
```ts
export const TEAMS = {
  법무: { accent:'#1b4f8a', soft:'#eaf1f8', softBorder:'#cfe0f1', shadow:'rgba(27,79,138,.5)',
          label:'법무팀', glyph:'法', emphasis:'#1b4f8a' },
  세무: { accent:'#157a57', soft:'#e7f3ec', softBorder:'#c5e3d3', shadow:'rgba(21,122,87,.5)',
          label:'세무팀', glyph:'稅', emphasis:'#157a57' },
} as const;
export const C = { navy:'#102a43', footBg:'#0e2438', ink:'#1b2530', ink2:'#22272e', ink3:'#2d3540',
  ink4:'#3a424c', muted:'#6b7480', faint:'#8a8579', bg:'#f5f4f1', bgChat:'#f1efea',
  surface:'#fff', surfaceHeader:'#fbfaf8', border:'#ece9e3', border2:'#e3ded4', border3:'#dcd7cd',
  danger:'#b04a3e', savedText:'#1b7a52', statusGreen:'#2bb673', toastBg:'#1b2530' } as const;
export const FIELD_CHIP_ACTIVE = C.navy;   // 디자인 코드: 활성 분야 칩은 네이비
```

## 5. 라이브러리 (순수/IO) — 함수 시그니처

### `lib/format.ts`
```ts
formatToday(d: Date): string          // "2026년 6월 29일 월요일" (KST, 무패딩)
formatSavedDate(d: Date): string      // "2026. 6. 29." (무패딩)
summarize(text: string): string       // 개행→공백, trim, >120이면 slice(120)+'…' 아니면 그대로
makeSlug(name: string): string        // 명칭→안정 slug (맵 우선, 없으면 정규화)
initial(name: string): string         // [...name][0] ?? ''
makeId(): string                      // crypto.randomUUID()
```
- `formatToday`는 `Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',weekday/year/month/day})` 조합
  또는 KST 오프셋 적용으로 구현(브라우저 TZ 무관 KST).

### `lib/storage.ts`
```ts
export const KEYS = { team:'legaly.team', user:'legaly.user', saved:'legaly.saved', pendingQ:'legaly.pendingQ' } as const;
getTeam(): Team                       // 비정상/없음 → '법무'
setTeam(t: Team): void
getUser(): User | null                // JSON 깨짐 → null
setUser(u: User): void
clearUser(): void
getSaved(): SavedItem[]               // 깨짐 → []; 항목 검증(필수필드 없으면 drop)
setSaved(items: SavedItem[]): void    // throw 가능 → 호출측 처리
takePendingQ(): string | null         // 읽고 제거; 공백/없음 → null
setPendingQ(q: string): void
isValidSaved(x: unknown): x is SavedItem   // 내부 검증
```
- 모든 read는 try/catch, 안전 기본값. `setSaved`는 throw를 전파(상담/보관함이 에러 처리).

### `lib/sampleData.ts`
디자인의 데이터를 그대로 보유:
- `LAWS: Record<Team, LawListItem[]>` (법무 12 / 세무 11) — id는 `makeSlug(name)`로 부여.
- `LAW_DETAILS: Record<Team, LawDetail>` (주택임대차보호법 / 소득세법; `isStub:false`).
- `CASES: Record<Team, CaseListItem[]>` (법무 10 / 세무 6) — id = `encodeURIComponent(number)`.
- `CASE_DETAILS: Record<Team, CaseDetail>` (2022다272053 / 2022두41733; `isStub:false`).
- `ANSWERS: Record<Team, AnswerPayload>` (디자인 `answerFor` 고정 샘플; citation에 id 부여).
- `STARTERS: Record<Team, string[]>`, `GREETING(team,user): string`, `PLACEHOLDER: Record<Team,string>`.
- `SLUG_TO_LAW`, `CANONICAL_LAW_ID: Record<Team,string>`, 판례 동일 맵.

### `lib/dataClient.ts` (계약 인터페이스 구현, 전부 async)
```ts
getLaws(team): Promise<LawListItem[]>                 // LAWS[team]
getLaw(team, id): Promise<LawDetail>                  // 아래 폴백 규칙
getCases(team): Promise<CaseListItem[]>
getCase(team, id): Promise<CaseDetail>                // 폴백 규칙
getAnswer(team, q): Promise<AnswerPayload>            // ANSWERS[team] (q 로깅만)
getSaved(): Promise<SavedItem[]>                      // storage.getSaved
addSaved(item): Promise<void>                         // unshift + storage.setSaved (throw 전파)
deleteSaved(id): Promise<void>                        // filter + storage.setSaved
```
**getLaw 폴백 해석(id 우선):** id로 전팀 LAW_DETAILS 탐색→있으면 그 전문(교차팀 허용). 없으면 LAWS에서
id 매칭→있으면 그 목록행으로 **스텁 LawDetail** 합성(`isStub:true`, 법령종류=kind). 둘 다 없으면(엉뚱
id) `LAW_DETAILS[team]`(팀 대표). getCase 동일(전문→스텁(caseType/breadcrumb=field, courtFull=court)→팀 대표).

### `lib/laws.ts` · `lib/cases.ts` (순수 필터/정렬)
```ts
filterLaws(data: LawListItem[], field: string, query: string): LawListItem[]
sortLaws(rows: LawListItem[], sort: LawSort): LawListItem[]       // name: localeCompare ko / date: desc 문자열, 안정
filterCases(data: CaseListItem[], field: string, court: CourtFilter, query: string): CaseListItem[]
sortCases(rows: CaseListItem[], sort: CaseSort): CaseListItem[]
```
- query는 함수 진입 시 `.trim()`; 대소문자 구분(디자인). 정렬은 `[...].sort`(안정).

## 6. 전역 상태 (`context/AppContext.tsx`)
```ts
interface AppState { team: Team; user: User | null; }
useApp(): {
  team: Team; user: User|null; isLoggedIn: boolean;
  setTeam(t: Team): void;            // storage.setTeam + state (재렌더)
  login(name: string): User;         // 이름 trim||'고객', storage.setUser, state, 반환
  logout(): void;                    // storage.clearUser, state (saved/team 유지)
}
```
- Provider는 마운트 시 storage에서 team/user 초기화. `setTeam`은 동기 storage 쓰기 + 상태 갱신.
- **인증 모달은 전역이 아니라 페이지 로컬**(트리거/변형/보류저장이 페이지마다 달라서). 단,
  `AuthModal` 컴포넌트는 공통.

## 7. 컴포넌트 (props + 책임). 동작 셀은 그리드 §B 참조.
- `ScrollToTop`: `useLocation().pathname` 변경 시 `window.scrollTo(0,0)`. (hash 변경엔 무반응)
- `Header({variant})`: lobby=로고(부제 포함)+계정; team=로고+`TeamSegment`+계정, 2행 `SubNav`.
  치수/sticky는 variant별(§B). 로고 클릭 → `/`.
- `TeamSegment()`: `useApp().team` 활성 표시, 클릭 → `onSwitch(team)` 콜백(페이지가 처리: 색만 vs
  리셋). 기본은 `setTeam` + 페이지별 리셋 훅.
- `SubNav({active})`: 4탭, 활성=현재 팀 accent 글자+밑줄. `/saved` 포함 모든 팀 페이지.
- `AccountArea()`: 비로그인 "로그인"(→`onOpenAuth('generic')`). 로그인 pill→드롭다운(바깥클릭/Esc
  닫기 🆕). 드롭다운 1번 항목은 페이지별(`/saved`=홈으로, 그 외=내 보관함) — `firstItem` prop.
- `AuthModal({open, variant, name, onName, onSubmit, onClose})`: 오버레이/카드/Enter/Esc/포커스
  트랩/autofocus/포커스복귀 🆕. 카피는 variant별.
- `Footer()`: index/saved의 네이비 푸터.

### 디자인 파일 → 컴포넌트 분해
| 디자인 파일 | 페이지 컴포넌트 | 재사용 |
|---|---|---|
| index | LobbyPage | Header(lobby), AuthModal, Footer |
| ai | ConsultPage | Header(team)+SubNav, AuthModal, Disclaimer |
| laws | LawsPage | Header(team)+SubNav, AuthModal |
| law-detail | LawDetailPage | Header(team)+SubNav, AuthModal |
| cases | CasesPage | Header(team)+SubNav, AuthModal |
| case-detail | CaseDetailPage | Header(team)+SubNav, AuthModal |
| saved | SavedPage | Header(team)+SubNav, AuthModal, Footer |

## 8. 페이지 (라우트 · 로컬 상태 · 핵심 함수). 동작은 그리드 §C~§G.

### LobbyPage `/`
- 로컬: `authOpen, authName, menuOpen`. `saved`는 방문 시 `dataClient.getSaved()`.
- 핸들러: `enterTeam(team)`(setTeam), `askExample(team,q)`(setTeam+setPendingQ→nav `/consult`).
- 렌더: 인사(로그인/비로그인), 팀 카드 2개, 보관함 미리보기(slice 0,3), 푸터, 모달.

### ConsultPage `/consult`
- 로컬: `messages: ChatMessage[], draft, expanded, savedIds, toast, authOpen, authName, menuOpen, sending`.
- ref: `pendingSaveRef`(msg+team 스냅샷), `pendingTimerRef`, `toastTimerRef`, `mountedRef`.
- 함수:
  ```ts
  resetToGreeting(team): void                 // messages=[greeting], expanded/savedIds={}, draft='', 타이머 정리
  send(): void                                // draft trim, 빈값 무시, draft='' 후 sendText
  sendText(text): Promise<void>               // user msg + pending → getAnswer → answer|error; 인플라이트 가드
  toggleSources(id): void
  saveAnswer(msg): void                       // 비로그인→authOpen+pendingSaveRef; 로그인→doSave
  doSave(msg, team): Promise<void>            // addSaved(SavedItem) try/catch → toast(성공/실패), savedIds
  onSwitchTeam(team): void                    // setTeam + resetToGreeting + 인플라이트 폐기
  onLoginSubmit(): void                       // login → pendingSaveRef 있으면 doSave
  ```
- effect: `location.key` 의존 → `takePendingQ()` 있으면 ~120ms 뒤 sendText 1회(ref 가드, cleanup으로
  타이머 clear). 메시지 변경 시 `useLayoutEffect`로 `scrollEl.scrollTop=scrollHeight`. 언마운트 시
  `mountedRef=false`(인플라이트 무시).

### LawsPage `/laws`
- 로컬: `field='전체', query='', sort='name', authOpen.., laws`(getLaws). `onSwitchTeam`→setTeam+field='전체'.
- 파생: `sortLaws(filterLaws(laws,field,query),sort)`. 행 클릭 → `/laws/${row.id}`.

### LawDetailPage `/laws/:id`
- 로컬: `active`(목차), `law`(getLaw(team,id)), `relatedCases`(ids→getCases 매핑 또는 detail에 포함).
- `law.isStub`이면 스텁 렌더(목차/본문 대체, "준비 중"). 목차 클릭 → anchor + active. 팀 전환 → nav `/laws`.

### CasesPage `/cases`
- 로컬: `field, court='전체', query, sort='new', cases`. 파생 `sortCases(filterCases(...))`. 행 → `/cases/${id}`.

### CaseDetailPage `/cases/:id`
- 로컬: `caseItem`(getCase). `isStub`이면 섹션 대체. 참조조문 칩 → `/laws/${ref.lawId}`. 팀 전환 → nav `/cases`.

### SavedPage `/saved`
- 로컬: `filter='전체', saved`(getSaved, 방문 재읽기). `remove(id)`(deleteSaved, 비관적 복구),
  `continueChat(item)`(setTeam+setPendingQ(title)→nav `/consult`). 카운트=총계, 필터 빈→인라인 메시지.

## 9. 라우팅 (`App.tsx`)
`<Routes>`: `/`=Lobby, `/consult`=Consult, `/laws`=Laws, `/laws/:id`=LawDetail, `/cases`=Cases,
`/cases/:id`=CaseDetail, `/saved`=Saved, `*`→`<Navigate to="/">`. 각 페이지 마운트 시 `document.title`
설정. `/consult`는 라우트에 `key`를 주지 않고 내부 `location.key` effect로 pendingQ 재소비.

## 10. 테스트 전략(상세는 04)
- **단위(Vitest):** format(날짜/요약/slug/initial 경계), storage(기본값/검증/throw 전파/blank pendingQ),
  laws/cases 필터·정렬(동률 안정·trim·교차), dataClient 폴백(전문/스텁/교차팀/엉뚱 id), id 체계.
- **컴포넌트(RTL):** 인증 모달(변형/Enter/Esc/포커스/빈이름), 헤더 계정(로그인 전환/드롭다운 항목/
  바깥클릭), 상담(전송/Enter·Shift/펼침/저장 게이트/pendingQ/팀전환 리셋/인플라이트·에러), 목록 필터/
  정렬/빈상태/칩색, 상세 스텁 vs 전문/목차 active/참조 링크, 보관함 필터·삭제·이어서·빈상태.
- **E2E(Playwright):** 라우트 내비게이션, 예시칩→상담 자동전송, 페이지×팀×인증 스크린샷 베이스라인.

## 11. 통합 지점(백엔드 작업 대비)
- `dataClient` 구현만 fetch로 교체(인터페이스 불변). `getAnswer`는 실제 RAG로.
- `storage`의 user/saved는 실제 세션/DB로. 키 의미 유지. 모두 `deferred.md` 기록.
