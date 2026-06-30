# 02 · 확정 스펙 v2 (Gate 1 델타 계약) — 리걸리 프론트엔드

v1 위에 적용하는 델타. 동작은 `00-behavior-grid.md`(v2 델타) + v1 그리드(불변분). 디자인
`../source/v2-design_files/*` 가 hex/px/카피 권위. **열린 갭 없음.**

## 확정 결정 (U4)
1. **로비 개편 — 팀 카드·보관함 미리보기 제거 확정**(디자인 권위). 로비 = 질문 박스 + 분야별
   둘러보기 + 자주 찾는 가이드. 보관함은 서브내비/계정 드롭다운으로 접근 유지.
2. **딥링크 영속 키 → 라우팅 파라미터로 대체**: 디자인의 `legaly.field`/`legaly.guide` 대신 React는
   `/guides?field=<분야>` 쿼리, `/guides/:id` 라우트 파라미터 사용(공유·뒤로가기 친화, 영속 키 불필요).
3. **아이콘은 React 컴포넌트로 안전 렌더**(`dangerouslySetInnerHTML` 미사용). ICON/FIELD_TINT/FIELDIC를
   `guidesData.ts`에 이식.
4. v1 deferred 항목(백엔드 API/AI/Supabase, 전체 코퍼스, Playwright 픽셀 베이스라인, 사용자별 보관함)은
   **이번 v2에 끌어오지 않음**(트리거 미발화 — 백엔드 미착수). 가이드 데이터도 정적 샘플(향후 백엔드 연동).

## 영향 집합 (U3) — 추가/수정/삭제 파일
**🆕 추가**
- `src/lib/guidesData.ts` — GUIDES(10), ICON, FIELD_TINT, FIELDIC, 팀별 칩, featured 순서, lawId/caseId 매핑.
- `src/components/Icon.tsx` — `name` prop으로 SVG 아이콘 렌더(13종).
- `src/pages/GuidesPage.tsx` `/guides`, `src/pages/GuideDetailPage.tsx` `/guides/:id`.
- 테스트: `tests/unit/guides.test.ts`(필터/검색/featured/lawId 매핑), `tests/component/guides.test.tsx`(목록·상세·딥링크·CTA).

**✏️ 수정**
- `src/components/Header.tsx` — SVG 로고/세그먼트, 서브내비 +"절차 가이드"(overflow-x), active 타입 `'guides'` 추가; 로비 variant 상단 링크(절차 가이드/AI 상담) + 드롭다운 이름 헤더.
- `src/pages/LobbyPage.tsx` — **재작성**: 질문 박스(팀 토글+입력+submit→/consult+예시), 분야 카드 8, featured 6. 팀카드/미리보기 제거.
- `src/pages/LawsPage.tsx`·`CasesPage.tsx` — 행 분야 배지 SVG 아이콘(FIELDIC), 히어로 팀 아이콘.
- `src/pages/ConsultPage.tsx` — AI 아바타 한자→팀 SVG 아이콘.
- `src/App.tsx` — `/guides`, `/guides/:id` 라우트 + 제목.
- `src/types.ts` — Guide 타입, nav active `'guides'`.
- `src/lib/dataClient.ts` — `getGuides(team)`, `getGuide(id)`(폴백: id→팀첫→전체첫) async.
- `src/lib/format.ts` 또는 guidesData — 가이드 law name→slug(makeSlug 재사용), case number→id.

**🗑️ 삭제/교체**
- `LobbyPage`의 팀카드·보관함 미리보기 마크업/로직, 관련 EXAMPLE_CHIPS 사용처.
- `tests/component/lobby.test.tsx` — v1 케이스(카드 제목/미리보기/예시칩 pendingQ) **교체**: 새 로비
  (히어로 카피, 질문 박스 submit→pendingQ+팀, 분야 카드→/guides?field, featured→/guides/:id).

## dataClient 인터페이스 추가
```ts
interface Guide { id:string; team:Team; field:string; title:string; summary:string; duration:string;
  difficulty:string; intro:string; steps:{t:string;d:string;tip?:string}[]; documents:string[];
  deadlines:{k:string;v:string}[]; costs?:{k:string;v:string}[];
  laws:{title:string;article:string;note:string;lawId:string}[]; cases?:{name:string;number:string;caseId:string}[]; }
getGuides(team: Team): Promise<Guide[]>;
getGuide(team: Team, id: string): Promise<Guide | null>;  // id→매칭, 없으면 팀 첫, 없으면 null(로딩/없음 UI)
```

## 수용 기준
v2 그리드 J~N의 모든 셀 ≥1 테스트. 가이드 필터/검색/featured/매핑·로비 동작 → 단위+컴포넌트. 회귀:
v1 전체 스위트 통과(로비 교체 테스트 제외, 명시). 시각: 가이드 목록/상세·새 로비 Preview 캡처.

## CHANGELOG Tasks 체크리스트 → CHANGELOG.md v2 항목 참조
```
[ ] guidesData.ts (데이터+아이콘+틴트+매핑)   [ ] Icon.tsx
[ ] dataClient getGuides/getGuide            [ ] App 라우트 /guides,/guides/:id
[ ] Header 아이콘+서브내비 가이드 탭          [ ] LobbyPage 재작성
[ ] GuidesPage / GuideDetailPage             [ ] Laws/Cases 행 아이콘, Consult 아바타 아이콘
[ ] 테스트(추가/교체) RED→GREEN              [ ] 회귀 전체 GREEN + 리뷰 + Gate 2
```
