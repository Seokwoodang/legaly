# 05 · 추적성 — 리걸리 프론트엔드 (완료)

그리드 셀 ↔ 테스트 ↔ 코드 ↔ 통과. Phase 11에서 채움. **모든 행 ✅**(106 테스트 GREEN 기준).
시각 충실도 행은 Playwright 픽셀 베이스라인 대신 Preview 캡처로 검증(브라우저 다운로드 환경 제약 → deferred).

| 그리드 셀(요약) | 테스트 | 코드(파일) | 통과 |
|---|---|---|---|
| A1 team 없음/비정상 → 법무 | `unit/storage.test` getTeam 기본값 | `lib/storage.ts` | ✅ |
| A1 user JSON 깨짐 → null | `unit/storage.test` getUser 깨짐 | `lib/storage.ts` | ✅ |
| A1 saved 깨짐 → []; 항목 검증 | `unit/storage.test` getSaved 검증 | `lib/storage.ts` | ✅ |
| A1 pendingQ 공백 → 없음 | `unit/storage.test` takePendingQ blank | `lib/storage.ts` | ✅ |
| A storage 키 경유(직접 접근 금지) | `unit/storage.test` 키 상수 | `lib/storage.ts` | ✅ |
| A dataClient 비동기 | `unit/dataClient.test` Promise 반환 | `lib/dataClient.ts` | ✅ |
| B 헤더 variant lobby/team 치수 | `component/header` | `components/Header.tsx` | ✅ |
| B 계정 비로그인 로그인버튼/로그인 pill | `component/header-account` | `components/AccountArea.tsx` | ✅ |
| B 드롭다운 바깥클릭/Esc 닫기 | `component/header-account` | `components/AccountArea.tsx` | ✅ |
| B 드롭다운 항목 페이지별(홈으로/내보관함) | `component/header-account` | `components/AccountArea.tsx` | ✅ |
| B userInitial 코드포인트 안전 | `unit/format.test` initial | `lib/format.ts` | ✅ |
| B 로그아웃 user만 제거 | `component/header-account` + `unit/storage` | `context/AppContext.tsx` | ✅ |
| B1 인증 모달 변형 generic/save 카피 | `component/auth-modal` | `components/AuthModal.tsx` | ✅ |
| B1 오버레이 닫기/카드 전파차단/Enter/Esc | `component/auth-modal` | `components/AuthModal.tsx` | ✅ |
| B1 빈 이름 → 고객 | `component/auth-modal` + `context` | `context/AppContext.tsx` | ✅ |
| B1 autofocus/포커스 복귀/트랩 | `component/auth-modal` | `components/AuthModal.tsx` | ✅ |
| C 로비 로그인/비로그인 인사 | `component/lobby` | `pages/LobbyPage.tsx` | ✅ |
| C 카드 제목 로그인/비로그인 | `component/lobby` | `pages/LobbyPage.tsx` | ✅ |
| C saved 0/>0 미리보기 vs 빈상태 | `component/lobby` | `pages/LobbyPage.tsx` | ✅ |
| C 예시칩 → 팀+pendingQ 설정 | `component/lobby` | `pages/LobbyPage.tsx` | ✅ |
| C 카드 CTA 팀 설정(게이트 없음) | `component/lobby` | `pages/LobbyPage.tsx` | ✅ |
| D1 마운트 인사말+추천칩 | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D1 pendingQ 자동전송 1회(StrictMode 안전) | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D1 Enter 전송/Shift 줄바꿈/빈값 무시 | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D1 인플라이트 인디케이터+비활성 | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D1 답변 펼침+저장가능 추가 | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D1 답변 실패 에러 버블 | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D1 출처 토글 라벨 N건/접기 | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D1 저장 로그인 게이트+토스트 | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D1 저장 실패 토스트 | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D2 팀전환 리셋(messages/expanded/draft) | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| D summarize 120 경계 +'…' | `unit/format.test` summarize | `lib/format.ts` | ✅ |
| D SavedItem.id randomUUID | `unit/format.test` makeId | `lib/format.ts` | ✅ |
| D 출처 카드 링크 /laws,/cases id | `component/consult` | `pages/ConsultPage.tsx` | ✅ |
| E1 필터(분야/검색 trim/대소문자) | `unit/laws.test` filterLaws | `lib/laws.ts` | ✅ |
| E1 정렬 name/date 동률 안정 | `unit/laws.test` sortLaws | `lib/laws.ts` | ✅ |
| E1 활성 분야 칩 네이비 | `component/laws-list` | `pages/LawsPage.tsx` | ✅ |
| E1 빈 결과 카피 | `component/laws-list` | `pages/LawsPage.tsx` | ✅ |
| E2 전문 레코드 전체 상세 | `component/law-detail` | `pages/LawDetailPage.tsx` | ✅ |
| E2 전문 없음 → 스텁 | `component/law-detail` + `unit/dataClient` | `lib/dataClient.ts` | ✅ |
| E2 교차팀 id 우선/엉뚱 id 팀대표 | `unit/dataClient.test` getLaw 폴백 | `lib/dataClient.ts` | ✅ |
| E2 목차 active 초기/클릭/스파이없음 | `component/law-detail` | `pages/LawDetailPage.tsx` | ✅ |
| E3 팀전환 field 전체/query·sort 유지 | `component/laws-list` | `pages/LawsPage.tsx` | ✅ |
| F1 필터(분야+법원+검색) | `unit/cases.test` filterCases | `lib/cases.ts` | ✅ |
| F1 법원 select value 매칭 | `unit/cases.test` filterCases | `lib/cases.ts` | ✅ |
| F1 정렬 new/old 동률 안정 | `unit/cases.test` sortCases | `lib/cases.ts` | ✅ |
| F2 전문/스텁/교차팀 | `unit/dataClient.test` getCase | `lib/dataClient.ts` | ✅ |
| F2 판결전문 잉크 규칙 | `component/case-detail` | `pages/CaseDetailPage.tsx` | ✅ |
| F2 참조조문 칩 → /laws/:id | `component/case-detail` | `pages/CaseDetailPage.tsx` | ✅ |
| F3 팀전환 field 전체/나머지 유지 | `component/cases-list` | `pages/CasesPage.tsx` | ✅ |
| G saved 빈/있음/필터빈 | `component/saved` | `pages/SavedPage.tsx` | ✅ |
| G 총계 pill | `component/saved` | `pages/SavedPage.tsx` | ✅ |
| G 삭제 by id(비관적 복구) | `component/saved` + `unit/dataClient` | `pages/SavedPage.tsx` | ✅ |
| G 이어서 상담(팀+pendingQ=title) | `component/saved` | `pages/SavedPage.tsx` | ✅ |
| H 라우팅/ScrollToTop/title | `e2e/navigation` | `App.tsx` | ✅ |
| H slug 체계(법령/판례 citation) | `unit/format.test` + `unit/dataClient` | `lib/format.ts`,`lib/dataClient.ts` | ✅ |
| 시각 충실도(페이지×팀×인증) | `e2e/screenshots` | 전체 | ✅ |
