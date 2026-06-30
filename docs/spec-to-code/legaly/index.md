# 리걸리(Legaly) — spec-to-code 매니페스트

**슬러그:** `legaly` · **종류:** 프론트엔드(UI) · **최신 버전:** v2(진행 중)

리걸리는 "나만의 법무팀 & 세무팀" 컨셉의 한국 법률·세무 종합 웹앱. 7개 페이지, 팀(법무/세무) 전역
상태, AI 상담(출처 카드 동반), 법령/판례 열람, 보관함.

## 버전
- **v1** — `design_handoff_legaly` hifi 핸드오프 신규 빌드(완료).
- **v2**(완료) — UPDATE: 절차 가이드 신설 + 로비 개편 + 한자→SVG 아이콘. 테스트 128 GREEN, 리뷰 r1→r2, Gate 2 승인 완료. `v2/` 문서.

## 범위
- 이번 작업: 디자인 샘플 데이터를 타입 지정 `dataClient` 뒤에 둔 **프론트엔드**. localStorage 영속 유지.
- 미룸(백엔드 작업): 국가법령정보 API 중계(OC=test-oc), Claude RAG 답변, 실제 인증 + DB.

## 산출물(v1)
| 파일 | 단계 | 상태 |
|---|---|---|
| `source/` | 1 | ✅ 보관(README + 디자인 파일 8개) |
| `v1/01-working-spec.md` | 1 | ✅ |
| `v1/00-behavior-grid.md` | 2 | ✅ (gap-hunter 5 + 비평가) |
| `v1/02-resolved-spec.md` | 3 | ✅ (Gate 1 대기) |
| `v1/03-design.md` | 5 | ✅ |
| `v1/04-test-doc.md` | 6 | ✅ (테스트 게이트 대기) |
| `v1/05-traceability.md` | 5/11 | ✅ 완료(전 행 ✅) |
| `v1/06-review/` | 10 | ✅ r1·r2·r3 (11건 수정) |
| `v1/07-verify.md` | 11 | ✅ |
| `v1/08-completion.md` | 12 | ✅ (Gate 2 대기) |
| `deferred.md` | — | ✅ |

## 기술
React 18 + Vite + TypeScript + Tailwind + React Router v6. 테스트: Vitest + Testing Library(로직/UI
동작) · Playwright(E2E/스크린샷).
