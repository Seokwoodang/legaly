# 07 · 종합 검증 — 리걸리 프론트엔드

Phase 11. 전체 스위트 + 양방향 커버리지 + 적합성 + 추적성 + 로직/UI 분리 감사.

## 1. 실행 결과 (2026-06-29)
- **단위/컴포넌트 테스트(Vitest):** 12 파일 / **106 통과 / 0 실패**.
- **타입체크(`tsc --noEmit`):** 통과(0 에러).
- **프로덕션 빌드(`vite build`):** 성공(JS 232KB / gzip 73.6KB, CSS 6.5KB).
- **E2E(Playwright):** 테스트 작성 완료(`navigation`, `screenshots`). 실행은 환경상 브라우저
  다운로드 차단으로 보류 → **Preview(MCP) 캡처로 대체 시각 검증** 수행(아래 §4). `deferred.md` 기록.

## 2. 양방향 셀 커버리지
- **전방(스펙 → 그리드):** `02-resolved-spec.md`의 모든 동작이 `00-behavior-grid.md` 셀에 존재
  (페이지 C~G + 공통 A/B/B1 + 횡단 H + 비평가 보완 §I). 누락 동작 없음.
- **후방(그리드 → 테스트):** `05-traceability.md`의 모든 셀이 ≥1 테스트로 매핑되고 전부 ✅.
  - 순수 로직(storage/format/laws/cases/dataClient 폴백·id·정렬·요약·날짜) → 단위 62개.
  - UI 동작(모달/계정/로비/상담/목록/상세/보관함) → 컴포넌트 41개 + E2E 작성.
- **미커버 셀:** 없음. (시각 픽셀 회귀만 Playwright 대신 Preview 수동 검증 — deferred)

## 3. 적합성(스펙 일치) — 리뷰 3라운드로 검증
- r1(6) + r2(4) + r3(1) = **11건 수정**, 각 라운드 클로저 체크로 반영 확인.
- 핵심 적합 항목(리뷰어 확인): dataClient 폴백 순서·교차팀 id 우선; pendingQ StrictMode 안전
  (peek+발사시 clear); 상세 언마운트 alive 가드; 팀 전환 리셋/네비게이션; 보관함 재읽기·필터 리셋·
  team 보정; 모달 접근성(role/aria/trap/Esc/포커스 복귀); 필드칩 네이비; summarize 120 경계;
  KST 날짜; ScrollToTop hash 무시. 보안 이슈 없음.

## 4. 시각 검증(Preview 캡처)
로비·상담(출처 카드 펼침)·자료실·법령상세·판례상세를 **법무/세무 양 팀**으로 렌더 확인 —
디자인 토큰(네이비 로고/모달, 법무 #1b4f8a·세무 #157a57 accent, 판례 네이비 배지, Pretendard,
모노 식별자)과 레이아웃이 디자인과 일치. 교차팀 딥링크(`/laws/income-tax`@법무) 무리다이렉트 확인.
StrictMode 자동전송 1회·pendingQ 소비 라이브 확인.

## 5. 로직/UI 분리
- 순수 로직은 `src/lib/`(format·storage·laws·cases·sampleData·dataClient)에 React 비의존으로
  격리 → 단위 테스트가 컴포넌트 없이 검증. 컴포넌트는 그 위 얇은 층. 데이터 접근은 전부
  `dataClient`/`storage` 경유(컴포넌트의 localStorage 직접 접근 0건).

## 6. 잔여/미룸 (deferred.md)
- 실제 국가법령정보 API·LLM(RAG)·Supabase 인증/DB(자격증명 `.env.local` 보관).
- 전체 법령/판례 코퍼스(현재 큐레이션 샘플 + 준비중 스텁).
- Playwright 픽셀 스냅샷 베이스라인(브라우저 다운로드 가능 환경에서 `npx playwright install` 후 생성).

## 결론
스펙·그리드의 모든 셀이 테스트로 커버되고 전부 통과. 타입·빌드 클린. 3라운드 독립 리뷰로 적합성
확인. **Gate 2 진행 준비 완료.**
