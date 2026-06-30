# 변경 이력 — legaly

## v2 — 2026-06-29 (UPDATE: 절차 가이드 + 로비 개편 + 아이콘 시스템)
- 새 디자인(`한국 법률 AI 상담 플랫폼 (1)`)으로 갱신. `source/v2-design_files/` 보관.
- **U2 diff:** 추가(절차 가이드 2페이지+데이터, 분야 틴트 시스템, 서브내비 가이드 탭, 로비 질문박스/
  분야/featured) · 수정(아이콘 한자→SVG 횡단, 로비 헤더/히어로) · 삭제(로비 팀카드·보관함 미리보기).
- **U3 영향집합:** 신규 4파일 + 수정 8파일 + 로비 테스트 교체(`02-resolved-spec.md` 참조).
- **U4:** `00-behavior-grid.md`(v2 델타 J~N), `02-resolved-spec.md`(델타 계약). Gate 1 대기.
- **Tasks (완료):**
  - [x] guidesData.ts  [x] Icon.tsx(JSX 렌더)  [x] dataClient getGuides/getGuide  [x] App 라우트
  - [x] Header(아이콘+가이드 탭)  [x] LobbyPage 재작성  [x] GuidesPage/GuideDetailPage
  - [x] Laws/Cases 행 아이콘 · Consult 아바타  [x] 테스트 추가/교체(128 GREEN)
  - [x] 회귀 무손상 · 리뷰 r1(6)→r2 클로저 · 종합검증
- **결과:** 테스트 128 GREEN, tsc·빌드 통과, 시각 검증 완료. reviewApproved. Gate 2 대기 → 승인 시 종료.
- **Gate 2 피드백 반영:** 로비 질문 박스 `max-width:700px`(디자인 핸드오프 값) → 본문 폭 100%로 확대
  (넓은 화면에서 중앙에 잘려 보인다는 사용자 피드백). 스타일만 변경, 로직/테스트 무영향.


## v1 — 2026-06-29
- **Phase 1(인제스트 & 탐색)** 완료. `design_handoff_legaly` hifi 핸드오프로부터 신규 빌드.
  - 원본(README + 디자인 파일 8개) `source/`에 보관.
  - `v1/01-working-spec.md`로 정규화; 7개 페이지의 데이터/로직/카피/동작 모두 읽고 추출.
  - 환경: Node 22 / npm 10, 기존 프로젝트 없음 → `/Users/luke/Desktop/legaly` 신규 생성.
  - 스택: React + Vite + TS + Tailwind + React Router. 모드 checkpoint / 티어 full / 스코프 build.
  - 범위: 샘플 데이터를 `dataClient` 뒤에 둔 프론트엔드; 실제 API/AI/인증은 백엔드 작업으로 미룸.
- **Phase 2(갭 분석)** 완료. gap-hunter 5개 병렬(로비/셸, 상담, 자료실, 판례, 보관함/데이터) +
  적대적 완전성 비평가. `00-behavior-grid.md` — 모든 셀 디자인 충실하게 결정; 비평가 빈틈 ~30개를
  §I 추가분에서 메움.
- **Phase 3(갭 해소)** 완료. 사용자 확정 제품 결정 3개: 준비중 스텁 상세 폴백 · 전역 공유+로그아웃
  유지 보관함 · 프로덕션급 상호작용 마감. `02-resolved-spec.md` 작성(Gate 1 계약서) —
  dataClient/storage 인터페이스, id/slug 체계, 교차 팀 id 우선, 라우팅 확정.
- 모든 산출물 문서를 **한글로** 재작성(사용자 요청).
- **Phase 5(설계)** 완료. `03-design.md`(파일 트리, 타입, 함수 시그니처, 컴포넌트 분해, 로직/UI
  분리) + `05-traceability.md` 초안 + `deferred.md`. designApproved=true(checkpoint: 설계 검토는
  테스트 게이트에 합침).
- **Phase 6(테스트 우선, RED)** 진행. 단위 5(format/storage/laws/cases/dataClient) + 컴포넌트 7
  (authModal/accountArea/lobby/consult/laws/cases/saved) + E2E 2(navigation/screenshots) 작성,
  `04-test-doc.md`(QA 재검증용) 작성. RED 실행은 게이트 가드 순서상 Phase 7 시작점.
- **Phase 7-8(구현→GREEN)** 완료. Vite 프로젝트 스캐폴딩 + 전 계층 구현(types/theme/lib/context/
  components/pages). 단위 RED→GREEN, 컴포넌트 테스트 안정화. 최종 106 테스트 GREEN, tsc·빌드 통과.
- **Phase 9(시각 검증)** — Preview(MCP)로 로비·상담·자료실·상세 × 양 팀 캡처 검증(디자인 일치).
  Playwright 픽셀 베이스라인은 브라우저 다운로드 차단으로 deferred. 시각 검증 중 StrictMode
  pendingQ/mountedRef 버그 2건 발견·수정.
- **Phase 10(리뷰 루프)** — 독립 블라인드 리뷰 3라운드(r1 6 + r2 4 + r3 1 = 11건 수정), 각 라운드
  사용자 승인. 최종 열린 블로커/메이저 0 → reviewApproved.
- **Phase 11(종합 검증)** — 양방향 셀 커버리지·적합성·추적성(전 행 ✅)·로직UI 분리 감사. `07-verify.md`.
- **Phase 12(Gate 2)** — `08-completion.md` 작성, **사용자 최종 승인 완료**. gate2Approved=true,
  active=false. v1 프론트엔드 빌드 종료. 다음: `/spec-to-code-backend`(Supabase + 국가법령정보 API + RAG).
