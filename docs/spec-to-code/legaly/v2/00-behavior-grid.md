# 00 · 행동 그리드 v2 (델타) — 리걸리 프론트엔드

v1 그리드(`../v1/00-behavior-grid.md`)를 **그대로 계승**하고, 델타가 건드리는 셀만 추가/수정한다.
범례: 🆕 추가 · ✏️ 수정 · 🗑️ 삭제 · ✅ 디자인에서 결정.

## J. 절차 가이드 목록 `/guides` 🆕
| 축 | 동작 |
|---|---|
| 마운트 | `dataClient.getGuides(team)` 로드. 팀별 필터(g.team===team) ✅ |
| 분야 칩 | 법무: 전체/형사/노동/부동산/민사/가사 · 세무: 전체/소득세/양도/상속·증여. 활성=네이비 `#102a43` ✅ |
| 검색 | `q===''‖ title.includes ‖ summary.includes ‖ field.includes`(trim) ✅ |
| 카드 | 분야 틴트 아이콘(FIELD_TINT[field]) + 분야 pill + 제목 + 요약 + N단계 + ⏱기간 + "가이드 보기 →". 클릭 → `/guides/:id` ✅ |
| 빈 결과 | "찾는 가이드가 없어요. {팀}에게 직접 물어보시겠어요?" (guides 로드됐고 결과 0일 때만) ✅ |
| 하단 CTA | "내 상황은 좀 다른 것 같나요?" → /consult ✅ |
| 딥링크 분야 | `/guides?field=형사` 진입 시 해당 분야 칩 활성 🆕(디자인 legaly.field 대체) |
| 팀 전환 | field '전체'로 리셋, 새 팀 가이드 ✅ |
| 서브내비 활성 | 절차 가이드 ✅ |

## K. 절차 가이드 상세 `/guides/:id` 🆕
| 축 | 동작 |
|---|---|
| 로드 | getGuides → id로 찾기; 없으면 팀 첫 가이드; 로딩 중 "가이드를 불러오는 중…" ✅ |
| 히어로 | 분야 틴트 bg, breadcrumb({팀} 절차 가이드 / {분야}), 분야 아이콘, 제목, intro, 메타(기간·난이도·N단계) ✅ |
| 사이드바 | 필요 서류(✓), 기한·주의(danger 색), 비용(있을 때만) ✅ sticky |
| 단계 | 번호 원형(틴트)+연결선(마지막 제외)+제목+설명+팁(있을 때 틴트 박스) ✅ |
| 근거 법령 | 카드(법령 배지=팀색, title, mono article, note) → `/laws/:lawId` 🆕(이름→slug 매핑) |
| 참고 판례 | 있을 때만, 카드(판례 배지 네이비, name, mono number) → `/cases/:caseId` 🆕(number→id) |
| CTA "질문" | pendingQ="{title} 절차가 제 상황에도 그대로 적용되나요?" 설정 후 →/consult ✅ |
| "← 가이드 목록으로" | →/guides ✅ |
| 미상 id | 팀 첫 가이드로 폴백 ✅ |
| 팀 전환 | 새 팀 첫 가이드로 이동 ✅ |

## L. 로비 `/` ✏️개편
| 조건 | 렌더 |
|---|---|
| 헤더 | 로고(SVG) + 상단 링크 "절차 가이드"·"AI 상담" + 계정(드롭다운에 이름 헤더 행) ✅. 팀 세그먼트·서브내비 없음 ✅ |
| 히어로 비로그인 | "법이 필요한 순간,\n혼자 막막하지 않게." + 부제 ✅ |
| 히어로 로그인 | 날짜 + "○○님, 무엇을 도와드릴까요?" + 부제 ✅ |
| 질문 박스 | "어느 팀에게 물어볼까요?" 팀 토글(기본 legaly.team, 법무 파랑/세무 초록) + 입력 + "물어보기 →"(form submit) + 예시 칩(팀별) ✅ |
| 질문 전송 | submit: setTeam(askTeam); 입력 있으면 pendingQ 설정; →/consult ✅. 예시 칩 클릭: 입력란 채움(전송 아님) ✅ |
| 분야별 둘러보기 | 8개 분야 카드(틴트 아이콘 + 이름 + 팀라벨). 클릭: setTeam(분야팀) + →`/guides?field=분야` 🆕 |
| 자주 찾는 가이드 | 6개 featured(고정 순서: deposit-return,unfair-dismissal,criminal-complaint,income-tax,inheritance-renounce,capital-gains). 클릭: setTeam(g.team) + →`/guides/:id` ✅. "전체 보기 →"→/guides |
| 푸터 | SVG 로고 + 면책 ✅ |
| 🗑️ 제거 | 팀 카드 2개, 보관함 미리보기 섹션 |
| 로비 인증 모달 | 로고 SVG, generic 카피(상담 내용도 안전하게 보관) ✅ |

## M. 아이콘 시스템(횡단) ✏️🆕
| 위치 | 아이콘 |
|---|---|
| 로고(전 페이지) | ICON.scale (네이비 배경) |
| 팀 세그먼트/픽커 | 법무=scale, 세무=calc |
| ai AI 아바타 | 팀=scale/calc (한자 글리프 대체) |
| 자료실/판례 행 분야 배지 | `FIELDIC[field]`→ICON (한자 民/刑… 대체) |
| 자료실/판례/가이드 히어로 팀 배지 | 팀 아이콘 |
| 분야 카드/가이드 카드/히어로 | `FIELD_TINT[field].svg` + bg/fg 틴트 |
| 구현 | React `<Icon name>` 컴포넌트로 SVG 렌더(안전, dangerouslySetInnerHTML 미사용) ✅🆕 |
| 판례 배지·법원 배지 | 네이비 유지(불변) ✅ |

## N. 서브내비(모든 팀 페이지) ✏️
상담 · **절차 가이드** · 자료실 · 판례 · 보관함. `overflow-x:auto`, 탭 `white-space:nowrap`.
활성 = 현재 팀 accent 밑줄. 헤더 active 타입에 `'guides'` 추가.

## 라우팅 ✏️
`/guides`, `/guides/:id` 추가. `/guides`는 `?field=` 쿼리로 분야 딥링크. 그 외 v1 라우트 불변.

## 회귀(불변 셀)
v1 그리드 A~I 전부 유효(상담·자료실·판례·보관함·storage·dataClient·팀 전환). 표면(아이콘/서브내비)만
변경되며 로직 셀은 불변. **단, 로비 §C(팀 카드/미리보기/예시칩→pendingQ)는 §L로 대체** — 해당 v1 셀은
폐기, 관련 테스트 교체.

## ⚠️ 확인 필요(→ Phase 3/U4)
- 로비에서 **보관함 미리보기·팀 카드 제거** 확인(디자인 권위) — 보관함은 서브내비/드롭다운으로 접근 유지.
- `legaly.field`/`legaly.guide` → React에서 쿼리/라우트 파라미터로 대체(영속 키 미사용) 확인.
