# 01 · 작업 스펙 — 리걸리(Legaly) 프론트엔드

> spec-to-code 흐름을 위한 정규화 스냅샷. 원본은 `../source/README.md` 와
> `../source/design_files/*.dc.html` 에 그대로 보관돼 있다. 정확한 hex/px/카피는 그 `.dc.html`
> 파일이 1차 근거이며, 이 문서는 변경 비교 기준선 + 인제스트 시점에 내린 결정을 담는다.

## 0. 이번 작업 결정사항

| 결정 | 값 | 근거 |
|---|---|---|
| 스택 | React 18 + Vite + TypeScript + Tailwind CSS + React Router v6 | 사용자 선택 |
| 프로젝트 루트 | `/Users/luke/Desktop/legaly` | 사용자 선택 |
| 모드 / 티어 / 스코프 | checkpoint / full / build | 기본값 + 규모 |
| **데이터 범위(이번 작업)** | 디자인의 **정적 샘플 데이터**로 화면을 충실히 구현하되, 모든 읽기/쓰기는 **타입 지정 `dataClient` 인터페이스**로만 접근 → 추후 백엔드(국가법령정보 API 중계 + Claude RAG)가 컴포넌트 수정 없이 끼워짐 | 사용자: "프론트 먼저, 그 다음 백엔드" |
| 백엔드 작업으로 미룸 | 실제 국가법령정보 API(OC=test-oc) 중계, LLM/RAG 답변 생성, 실제 인증 + DB 영속화 | 사용자 |

디자인 프로토타입은 모든 영속 상태를 `localStorage`에 저장한다. **이번 작업도 localStorage를 그대로
영속 계층으로 유지**(디자인과 동일)하되, 모든 접근을 타입 지정 모듈(`storage`, `dataClient`)로
경유시켜 백엔드 작업에서 동일 시그니처로 구현만 교체할 수 있게 한다.

## 1. 정보 구조(IA)

2단계 내비게이션. **팀**(`법무` | `세무`)은 전역 상태이며 `legaly.team`에 영속화된다.

| 디자인 파일 | 의미 | 라우트 |
|---|---|---|
| `index.dc.html` | 로비 / 대시보드(비-팀) | `/` |
| `ai.dc.html` | 팀 상담(채팅) | `/consult` |
| `laws.dc.html` | 팀 자료실(법령 목록) | `/laws` |
| `law-detail.dc.html` | 법령 상세 | `/laws/:id` |
| `cases.dc.html` | 팀 판례 목록 | `/cases` |
| `case-detail.dc.html` | 판례 상세 | `/cases/:id` |
| `saved.dc.html` | 보관함(저장된 상담) | `/saved` |

- **로비** 헤더: 로고 + 계정만(팀 세그먼트/서브내비 없음).
- **팀 페이지** 헤더 1행: 로고 + 팀 세그먼트(법무팀/세무팀) + 계정. 2행: 서브내비 탭
  상담 · 자료실 · 판례 · 보관함(현재 팀 색으로 활성 표시).

> 디자인은 팀당 정적 상세 1개만 렌더(실제 `:id` 라우팅 없음 — `LAW[team]`/`CASE[team]`을 그림).
> 이번 작업은 상세 라우트에 `:id`를 둔다. id를 모를 때는 그 팀의 대표 샘플로 폴백(디자인의 모든
> 링크가 `law-detail.dc.html`/`case-detail.dc.html`에 id 없이 걸려 있으므로 그대로 유지됨).

## 2. 상태 & 영속화

| localStorage 키 | 값 | 의미 |
|---|---|---|
| `legaly.team` | `"법무"` \| `"세무"` | 현재 팀(전역). 모든 팀 페이지가 마운트 시 읽음 |
| `legaly.user` | `{"name": string}` JSON | 로그인 사용자(데모) |
| `legaly.saved` | `SavedItem[]` JSON | 저장된 상담 목록 |
| `legaly.pendingQ` | `string` | 다른 페이지에서 넘어올 때 `/consult` 마운트 시 자동 전송할 질문 |

```ts
type Team = '법무' | '세무';
type User = { name: string };
type SavedItem = {
  id: string;       // crypto.randomUUID() (디자인은 messageId_Date.now() — 충돌 방지 위해 업그레이드)
  team: Team;
  title: string;    // 저장 대상 답변을 유발한 사용자 질문
  summary: string;  // 답변 앞부분, 개행→공백, 120자 + '…'
  date: string;     // "YYYY. M. D."
};
```

기본값/가드: `legaly.team`이 유효하지 않으면 → `법무`. 어느 키든 JSON이 깨지면 → 안전 기본값
(user `null`, saved `[]`). 모든 접근은 try/catch로 감쌈(스토리지가 throw할 수 있음).

## 3. 페이지별 동작(권위 있는 요약)

### 공통(모든 팀 페이지)
- 상태: `team`, `user`, `authOpen`, `menuOpen`, `authName`.
- 팀 세그먼트 클릭 → `legaly.team` 갱신, 새 팀 색/데이터/카피로 재렌더(리로드 없음).
  - `/consult`: **대화를 새 팀 인사말로 리셋**.
  - `/laws` & `/cases`: **분야 칩을 '전체'로 리셋**(검색어/정렬/법원은 유지 — 그리드 참조).
- 계정: 비로그인 → 네이비 "로그인" 버튼이 인증 모달 오픈. 로그인 → pill(네이비 아바타 이니셜 +
  "○○님") → 드롭다운(보관함/홈으로, 로그아웃[danger]).
- 인증 모달: 오버레이 클릭 닫기, 카드 클릭 전파 차단, Enter 제출, 빈 이름 → "고객".
  제출 시 `legaly.user` 기록, 모달 닫기, `authName` 비움.

### 로비 `/`
- 비로그인: 히어로 "나만의 법무팀과 세무팀을\n가져보세요." + "로그인하고 시작하기"(인증 오픈).
- 로그인: 날짜 줄 + "○○님, 안녕하세요." + 부제(법무 파랑 / 세무 초록 강조).
- 팀 카드 2개(法 / 稅). 각: 제목(로그인 시 "○○님의 법무팀"), "● 지금 상담 대기 중",
  예시 칩 2개, CTA "상담 시작하기"(→/consult), 링크 자료실/판례.
  - "상담 시작하기"/자료실/판례 → 해당 카드의 팀으로 `legaly.team` 설정.
  - 예시 칩은 팀 **과** `legaly.pendingQ` 설정 후 → /consult.
- "내 보관함" 섹션: "전체 보기 →"(→/saved). saved>0이면 미리보기 카드 최대 3개(팀 배지 + 날짜 +
  제목, →/saved). 없으면 점선 빈 상태.
- 푸터(네이비) + 면책 문구.

로비 예시 칩 → pendingQ 매핑:
| 칩 | 팀 | pendingQ |
|---|---|---|
| 전세금을 못 받고 있어요 | 법무 | 전세 계약이 끝났는데 집주인이 보증금을 안 돌려줘요. 어떻게 해야 하나요? |
| 부당해고를 당했어요 | 법무 | 회사에서 갑자기 해고 통보를 받았어요. 부당해고인지 궁금해요. |
| 종합소득세 경비 처리가 궁금해요 | 세무 | 프리랜서로 일하는데 종합소득세 신고할 때 경비는 어떻게 처리하나요? |
| 양도세 비과세 요건이요 | 세무 | 1세대 1주택 양도세 비과세 요건이 궁금해요. |

### 상담 `/consult`
- 추가 상태: `messages[]`, `draft`, `expanded{id:bool}`, `savedIds{id:bool}`, `toast`.
- 마운트: 대화 = greeting(team,user) — AI 메시지 1개(인트로 + 추천 질문 칩 3개).
  이후 `legaly.pendingQ`가 있으면 제거하고 ~120ms 뒤 자동 전송.
- 인사말/추천칩/플레이스홀더/답변 전부 팀별(원본 `TEAMS`, `STARTERS`, `answerFor` 참조).
- 전송: Enter 전송(Shift+Enter 줄바꿈), 빈 입력 무시. 사용자 메시지 + AI 답변(출처 포함) 추가.
  새 답변은 **펼침** + **저장 가능** 상태로 추가.
- AI 답변 블록: 본문 pre-wrap, "근거 N건 펼쳐보기/접기" 토글 → 근거 법령·예규 카드(법령 배지=팀색,
  명칭, 모노 조문번호, 본문, "법령 전문 보기 →" →/laws/:id) + 참고 판례 카드(판례 배지=네이비,
  사건명, 모노 사건번호, 법원·선고일, 요지, "판례 상세 보기 →" →/cases/:id).
- 저장: 로그인 → `legaly.saved`에 unshift, 버튼 → "보관함에 저장됨"(초록, default 커서),
  토스트 "보관함에 저장했어요" 2600ms. 비로그인 → 인증 오픈, 보류 저장 기억, 로그인 후 저장.
- 스크롤: 새 메시지 시 `scrollTop=scrollHeight`(scrollIntoView 금지).
- N = laws.length + cases.length(디자인 샘플: 법령 2 + 판례 1 = "근거 3건").

### 자료실 `/laws`
- 상태: `field`('전체'), `query`, `sort`('name'|'date'). 히어로 띠 = 팀 soft 배경.
- 필터: `(field==='전체' || d.field===field) && (q==='' || d.name.includes(q))`.
- 정렬: name → `localeCompare(...,'ko')`; date → `b.date.localeCompare(a.date)`(내림차순).
- 행: 글리프 배지, 명칭, 분야 배지(팀), 종류 배지(법령 회색 / 예규 팀 아웃라인),
  "소관 · {ministry}", "시행일" 모노, `›`. → /laws/:id.
- 빈 상태; 하단 CTA "팀에게 질문하기"(→/consult). 데이터: `TEAMS[team].data`(법무 12, 세무 11).

### 법령 상세 `/laws/:id`
- 상태: `active`(현재 조문 id, 목차 하이라이트; 기본 첫 조문, 세무 첫 = `tax2`).
- 히어로 띠(팀 soft): breadcrumb, 배지(시행중 팀 / lawNo 흰색), 명칭 H1, 메타(시행일 모노 /
  소관부처 / "법률").
- 2열: sticky 목차(모노 조문번호 + 제목, 현재 항목 하이라이트, 클릭 → 앵커 스크롤 + active 갱신) /
  조문 본문(모노 조문번호 팀색 + 제목 + pre-wrap 본문, 구분선). 앵커 스크롤은 CSS
  `scroll-behavior:smooth` + `scroll-margin-top:128px`(scrollIntoView 금지).
- 관련 판례(→/cases/:id) + 팀 soft CTA 박스(→/consult). 데이터: `LAW[team]`.

### 판례 목록 `/cases`
- 상태: `field`, `court`('전체'), `query`, `sort`('new'|'old').
- 필터: 분야 + 법원 + (사건명 OR 사건번호 포함). 정렬: 선고일 최신/오래된순.
- 법원 select: 전체 / 대법원 / 대법원(전합)(옵션 라벨 "대법원 전원합의체", value `대법원(전합)`).
- 행: 분야 배지(팀), 법원 배지(회색), 사건명, 사건번호 모노, 선고일 모노. → /cases/:id.
- 데이터: `TEAMS[team].data`(법무 10, 세무 6).

### 판례 상세 `/cases/:id`
- 히어로(팀 soft): breadcrumb, 법원 배지(네이비), 판결결과 배지(팀), 사건명 H1, 사건번호 전체 모노.
- 2열: sticky 정보 사이드바(사건번호/법원/선고일/사건종류/판결결과) + 팀 soft "질문" 박스(→/consult).
  섹션(각각 팀 4px 마커): 판시사항(ol), 판결요지([1][2] 태그), 참조조문(팀 soft 칩 →/laws/:id),
  판결 전문(라벨 단락; 【주/【이 라벨 잉크, 그 외 muted; + 면책 문구).
- 하단: "← 판례 목록으로"(→/cases) + "이 판례 {팀}에게 질문 →"(→/consult). 데이터: `CASE[team]`.

### 보관함 `/saved`
- 상태: `filter`('전체'|'법무'|'세무'), `saved[]`(마운트 시 localStorage에서).
- 제목 "○○님의 보관함"(비로그인 "내 보관함").
- saved>0이면: 필터 pill(전체 N / 법무팀 N / 세무팀 N, 활성 네이비) + 카드(팀 배지, 날짜, 제목,
  요약, "이어서 상담하기"[팀+pendingQ 설정 →/consult], "삭제"[id로 제거]).
- 없으면: 점선 빈 상태(＋ 박스 + "상담 시작하기" →/consult). 푸터(네이비).

## 4. 디자인 토큰
README의 "Design Tokens"(보관본) 참조 — 색, Pretendard 폰트, 모노 식별자, 간격, radius, shadow,
글리프 아이콘. 팀 색 규칙: 현재 팀 accent를 전송 버튼·AI 아바타·법령 배지·활성 서브내비 밑줄·활성
칩/세그먼트·섹션 마커·1차 CTA·자료실/판례 히어로 띠(soft)에 적용. 판례 배지 + 법원 배지는 항상
네이비. 로고·로그인·아바타·모달은 항상 네이비.

## 5. 이번 작업 범위 밖 → deferred.md
- 실제 국가법령정보 API 연동 & LLM 답변 생성(백엔드 작업).
- 실제 인증 & 서버 측 영속화.
- 전체 법령/판례 코퍼스(이번 작업은 디자인의 큐레이션 샘플을 `dataClient` 뒤에 배치).
