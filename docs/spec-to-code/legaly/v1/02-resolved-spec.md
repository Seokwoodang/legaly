# 02 · 확정 스펙(Gate 1 계약서) — 리걸리 프론트엔드

모든 결정을 못박는 문서. `00-behavior-grid.md`(모든 셀 결정) + `01-working-spec.md`(데이터/IA/페이지별
동작) 위에 세움. 정확한 hex/px/카피는 디자인 `.dc.html`이 권위. **열린 갭 없음.**

## 범위
React 18 + Vite + TS + Tailwind + React Router v6. 디자인 7페이지의 충실 hi-fi 재구현, 디자인의
**정적 샘플 데이터를 async `dataClient` 뒤에** 둠; localStorage는 타입 지정 `storage` 모듈 뒤로 유지.
**백엔드 작업으로 미룸:** 실제 국가법령정보 API(OC=test-oc), LLM/RAG 답변, 서버 인증 + 사용자별 DB.
`deferred.md`에서 추적.

## 확정된 제품 결정(Phase 3)
1. **상세 폴백 = 준비중 스텁.** 팀당 전문 레코드 2개(법무 주택임대차보호법 / 소득세법; 판례
   2022다272053 / 2022두41733)는 디자인 전체 상세를 렌더. **그 외 모든 목록 행**은 스텁으로 열림:
   히어로는 목록 데이터(명칭, 분야, 소관/법원, 시행일/선고일, 번호)로 채우고, 본문/섹션은
   "전문은 준비 중입니다 — 국가법령정보 연동 예정" 안내로 대체, 목차 없음(법령), CTA 박스 유지.
   스텁 법령 `법령 종류` = 목록 `kind`; 스텁 판례 `caseType`/`breadcrumb` = 목록 `field`,
   `courtFull` = `court`.
2. **보관함 = 전역 공유 + 로그아웃 유지.** 단일 전역 `legaly.saved` 목록(사용자별 분리 아님);
   로그아웃은 `legaly.user`만 제거. 사용자별 분리는 백엔드로 미룸 → `deferred.md`.
3. **상호작용 마감 = 프로덕션급.** 정적 디자인 너머로 추가: 비동기 인플라이트 로딩(타이핑 인디케이터
   버블, 진행 중 전송/입력란/칩 비활성), 에러 상태(답변 실패 버블; 저장/삭제 스토리지 실패 토스트),
   모달 접근성(`role=dialog`, 포커스 트랩, Esc, 포커스 복귀, autofocus), 계정 드롭다운 바깥 클릭 +
   Esc 닫기. 모두 백엔드 교체 후에도 그대로 동작.

## 아키텍처(확정)
- `storage` 모듈: 4개 키를 키 상수 + 타입 get/set으로 접근; 동기; try/catch → 안전 기본값
  (team→`법무`, user→`null`, saved→`[]`, pendingQ→없음; 공백 pendingQ는 없음 처리). 읽기 시 saved
  항목 검증(id/title/summary/date 누락 항목 제거; 미상 team → `법무` 팔레트로 렌더).
- `dataClient`(비동기, 전부 `Promise<T>`; localStorage/샘플 스텁은 즉시 resolve):
  ```ts
  type Team = '법무' | '세무';
  interface LawListItem { id: string; name: string; field: string; ministry: string; date: string; glyph: string; kind: '법령'|'예규'; }
  interface LawArticle { id: string; num: string; title: string; body: string; }
  interface LawDetail { id: string; team: Team; name: string; breadcrumbCat: string; lawNo: string; effDate: string; ministry: string; kind: string; articles: LawArticle[]; relatedCaseIds: string[]; isStub: boolean; }
  interface CaseListItem { id: string; name: string; number: string; court: string; field: string; date: string; }
  interface CaseDetail { id: string; team: Team; name: string; breadcrumb: string; court: string; courtFull: string; result: string; fullNumber: string; number: string; date: string; caseType: string; issues: string[]; holdings: {tag:string;text:string}[]; refs: {law:string;article:string;lawId:string}[]; opinion: {label:string;text:string}[]; isStub: boolean; }
  interface LawCitation { id: string; title: string; article: string; body: string; }
  interface CaseCitation { id: string; name: string; number: string; court: string; date: string; summary: string; }
  interface AnswerPayload { text: string; sources: { laws: LawCitation[]; cases: CaseCitation[] }; }
  interface SavedItem { id: string; team: Team; title: string; summary: string; date: string; }
  interface DataClient {
    getLaws(team: Team): Promise<LawListItem[]>;
    getLaw(team: Team, id: string): Promise<LawDetail>;          // null 없음: 전문 | 스텁 | 미상 id는 팀 대표
    getCases(team: Team): Promise<CaseListItem[]>;
    getCase(team: Team, id: string): Promise<CaseDetail>;
    getAnswer(team: Team, question: string): Promise<AnswerPayload>; // 스텁은 질문 무시, 팀 샘플 반환
    getSaved(): Promise<SavedItem[]>;
    addSaved(item: SavedItem): Promise<void>;
    deleteSaved(id: string): Promise<void>;
  }
  ```
- **ID 체계:** 법령 id = dataClient가 소유하는 안정 slug(예: `주택임대차보호법`→`housing-lease`,
  `소득세법`→`income-tax`; 나머지는 명칭에서 slug 생성); 판례 id = `number`(URL 인코딩). 법령 citation
  id = 매칭 법령 slug; 판례 citation id = 사건번호. 미매칭 참조/citation → 팀 대표 id.
- **교차 팀 id 우선:** `getLaw/getCase`는 현재 팀과 무관하게 id로 해석; 레코드 자체 팀이 accent/
  breadcrumb 결정; 헤더 세그먼트는 `legaly.team` 반영(불변). 엉뚱한 id → 팀 대표 레코드.
- **라우팅:** `/ /consult /laws /laws/:id /cases /cases/:id /saved` + `*`→`/`. path 변경 시
  `<ScrollToTop>`. 라우트별 `document.title` "리걸리 — {페이지}". 목록/상세는 마운트 시 로컬 상태 리셋
  (이번 작업 URL 파라미터 영속 없음). `/consult`는 `location.key` 의존 effect로 pendingQ 소비.
  상세에서 팀 전환은 그 팀 목록으로 이동.

## 동작 = 그리드
모든 페이지 동작, 상태 전이, 인플라이트/에러/엣지 처리, 횡단 규칙은 **`00-behavior-grid.md`(A~I절)에서
결정된 그대로**. 핵심 재확인:
- 팀은 전역(`legaly.team`); 전환 시 재색칠 + 페이지별 리셋(상담→인사말 리셋; 자료실/판례→분야 '전체',
  그 외 필터 유지; 인플라이트 폐기; draft/savedIds/타임아웃 정리).
- 상담: 인사말 + 추천칩 3; Enter 전송 / Shift+Enter 줄바꿈 / 빈값 무시; 답변은 펼침 + 저장 가능으로
  추가; 출처 토글 "근거 N건 펼쳐보기"/"근거 접기"; 저장은 로그인 게이트 + pendingSave(팀 스냅샷) +
  토스트(2600ms); `scrollTop=scrollHeight`; `SavedItem.id=crypto.randomUUID()`; 요약 = 개행→공백,
  120자 slice + '…'는 120 초과 시만; 날짜 "Y. M. D."(무패딩).
- 자료실/판례 목록: 정확한 필터 술어, 정렬(name localeCompare ko / date 문자열 비교, 동률 안정),
  활성 분야 칩 **네이비**(디자인 코드), kind/법원 배지, 빈 카피.
- 법령 상세: 목차 active=articles[0], 클릭→앵커 스크롤(CSS smooth + scroll-margin-top:128px, 스크롤
  스파이 없음). 판례 상세: 판시사항/판결요지/참조조문(→/laws/:id)/판결전문(【주/【이 잉크 규칙), sticky 정보 사이드바.
- 보관함: 제목 개인화, 총계 pill, 필터 빈 인라인 메시지, id로 삭제(실패 시 비관적 복구), 이어서
  상담하기(팀+pendingQ=title), 점선 빈 상태.
- 토큰/반응형/글리프/팀 색 규칙은 그리드 §H 그대로. Pretendard CDN; 모노 식별자.

## 수용 기준(테스트 가능)
`00-behavior-grid.md`의 모든 셀은 `04-test-doc.md`의 테스트 ≥1개로 매핑된다. 로직(storage,
dataClient, 필터/정렬, 요약/날짜/id, slug/폴백 해석, 상태 리셋 리듀서) → Vitest. UI 동작(전송/저장/
로그인 게이트/토글/팀 전환/pendingQ/스텁 렌더/에러 상태) → Testing Library + Playwright. 시각 충실도
→ Playwright 스크린샷(페이지×팀×인증).
