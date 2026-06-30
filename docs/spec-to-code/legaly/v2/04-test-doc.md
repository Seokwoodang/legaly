# 04 · 테스트 문서 v2 (델타) — 리걸리 프론트엔드

v1 테스트 계승 + 델타. RED 실행은 게이트 가드 순서상 테스트 승인 직후 구현 시작점.

## 추가(Added)
### `tests/unit/guides.test.ts`
- GUIDES 10개(법무 7/세무 3), 각 단계·근거법령 보유.
- lawId=makeSlug(title)(주택임대차보호법→housing-lease), caseId=number 매핑.
- FEATURED_IDS 6개 순서 고정, LOBBY_FIELDS 8개.
- FIELD_TINT(형사/소득세 fg), FIELDIC(민사→file, 국세일반 존재).
- dataClient.getGuides(팀 필터), getGuide(id/미상→팀첫).

### `tests/component/guides.test.tsx`
- 목록: 렌더+서브내비 활성, 분야 칩 필터, 검색(제목/요약/분야), `?field=` 딥링크, 카드→상세.
- 상세: 단계·필요서류·근거법령 렌더, 법령 카드 href `/laws/housing-lease`, CTA→pendingQ 자동전송,
  미상 id→팀 첫 가이드 폴백.

## 교체(Modified — 로비 재작성)
### `tests/component/lobby.test.tsx` (v1 케이스 폐기)
- 비로그인/로그인 히어로 카피, 질문 박스(팀 선택+입력+물어보기→pendingQ+팀+상담 자동전송),
  예시 칩→입력란 채움(전송 아님), 분야 카드→해당 분야 가이드 목록, featured→가이드 상세,
  보관함 미리보기·팀 카드 부재 확인.

## 회귀(Regression — 불변, 전부 GREEN 유지)
v1 단위(format/storage/laws/cases/dataClient) + 컴포넌트(authModal/accountArea/consult/laws/cases/
saved) + e2e. **의도적 변경:** lobby.test.tsx(교체). 그 외 적색 발생 시 블라스트 래디우스 — 중단·조사.

## 수동 QA(추가)
홈 질문 박스에 팀 고르고 질문 → 상담 자동전송 / 분야 카드 클릭 → 가이드 목록 분야 필터 / featured →
상세(단계·서류·기한·근거) / 상세 CTA → 상담에 "…적용되나요?" 자동전송 / 서브내비 "절차 가이드" 이동 /
자료실·판례 행 아이콘이 한자 아닌 SVG / 팀 전환 시 색·아이콘 전환.
