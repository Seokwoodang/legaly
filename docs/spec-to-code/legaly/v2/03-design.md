# 03 · 설계 v2 (델타) — 리걸리 프론트엔드

v1 설계(`../v1/03-design.md`) 계승 + 델타. 동작은 v2 그리드, 파일/함수는 아래.

## 신규 파일
### `src/lib/guidesData.ts`
```ts
export type Guide = { id; team; field; title; summary; duration; difficulty; intro;
  steps:{t;d;tip?}[]; documents:string[]; deadlines:{k;v}[]; costs?:{k;v}[];
  laws:{title;article;note;lawId}[]; cases?:{name;number;caseId}[] };
export const GUIDES: Guide[]            // 디자인 10개 이식; laws에 lawId=makeSlug(title), cases에 caseId=number
export const ICON: Record<IconName,string[]>   // 13종 SVG path 배열(viewBox 24)
export type IconName = 'scale'|'calc'|'file'|'gavel'|'briefcase'|'home'|'heart'|'store'|'landmark'|'wallet'|'receipt'|'trending'|'gift';
export const FIELD_TINT: Record<string,{bg;fg;icon:IconName}>   // 분야→틴트+아이콘
export const FIELDIC: Record<string,IconName>   // 목록 분야→아이콘(법인세/국세일반/지방세 포함)
export const GUIDE_CHIPS: Record<Team,string[]>; export const FEATURED_IDS: string[];
export const LOBBY_FIELDS: {name;field;team:Team}[];   // 8개
```
순수 데이터/매핑 → 단위 테스트.

### `src/components/Icon.tsx`
```tsx
Icon({ name, size=18, color }): JSX  // <svg viewBox=0 0 24 24 stroke=currentColor>{paths}</svg>
```
ICON[name] path 문자열을 `dangerouslySetInnerHTML` 없이 `<svg>` 안에 렌더(path를 React로). 안전.
구현: ICON 값을 `{paths:string}`로 두고 `<svg dangerouslySetInnerHTML>` 대신 path를 `g`로 주입 —
실무상 정적 신뢰 SVG이므로 `<svg ... dangerouslySetInnerHTML={{__html:paths}}/>` 허용하되 입력은 상수만.

### `src/pages/GuidesPage.tsx` `/guides`
- 로컬: `field`(초기 = `?field=` 쿼리 or '전체'), `query`, `guides`(getGuides(team)).
- 파생: 팀+분야+검색 필터. 카드 → `/guides/:id`. 칩(GUIDE_CHIPS), 검색, 빈상태, CTA.
- 팀 전환 시 field '전체' 리셋.

### `src/pages/GuideDetailPage.tsx` `/guides/:id`
- 로컬: `guide`(getGuide(team,id)), 로딩/없음 처리. 히어로(틴트)·사이드바·단계·근거법령(→/laws/:lawId)·
  참고판례(→/cases/:caseId)·CTA(pendingQ="{title} 절차가 제 상황에도 그대로 적용되나요?"→/consult).
- 팀 전환 시 새 팀 첫 가이드로 navigate. 비동기 alive 가드.

## 수정 파일
- `Header.tsx`: 로고/세그먼트 `<Icon>`; 서브내비 배열에 `{key:'guides',label:'절차 가이드',href:'/guides'}`
  (상담 다음), 컨테이너 `overflowX:auto`, 탭 `whiteSpace:nowrap`; active 타입 `'guides'`; lobby variant은
  상단 링크(절차 가이드/AI 상담) + 드롭다운 이름 헤더.
- `LobbyPage.tsx`: 재작성 — 질문 박스(askTeam 토글 기본 team, 입력, submit: setTeam+pendingQ(있으면)+nav
  /consult, 예시 칩 = 입력 채움), 분야 카드(LOBBY_FIELDS→`/guides?field=`+setTeam), featured(FEATURED_IDS→
  `/guides/:id`+setTeam), 푸터. 팀카드/미리보기 제거. saved 로드 제거.
- `LawsPage.tsx`/`CasesPage.tsx`: 행 분야 배지 `<Icon name={FIELDIC[field]}>`, 히어로 팀 배지 `<Icon>`.
- `ConsultPage.tsx`: AI 아바타 `<Icon name={team==='법무'?'scale':'calc'}>`.
- `App.tsx`: `<Route path="/guides">`, `<Route path="/guides/:id">`.
- `types.ts`: `Guide` 재노출, nav active union에 `'guides'`.
- `dataClient.ts`: `getGuides(team)=GUIDES.filter(team)`, `getGuide(team,id)=byId||팀첫||null`.
- `theme.ts`: 변경 없음(틴트는 guidesData).

## 로직/UI 분리
guidesData(데이터·매핑)·필터(가이드)는 순수 → 단위. Icon은 표현 컴포넌트. 페이지는 얇은 층.

## 테스트(델타) — 04 참조
unit: guides 필터/검색/featured/lawId·caseId 매핑/FIELDIC. component: 가이드 목록(칩·검색·딥링크
?field·카드→상세), 가이드 상세(단계·근거→/laws·CTA pendingQ·미상 id 폴백·팀전환), 로비 재작성(히어로·
질문박스 submit→pendingQ+팀·예시 채움·분야→/guides?field·featured→/guides/:id), 서브내비 가이드 탭.
회귀: v1 전체(로비 v1 테스트는 교체).
