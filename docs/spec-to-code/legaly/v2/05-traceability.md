# 05 · 추적성 v2 (델타) — 리걸리 프론트엔드

v1 매트릭스 계승. 델타 셀 J~N ↔ 테스트 ↔ 코드 ↔ 통과(전 행 ✅, 128 테스트 기준).

| 그리드 셀(델타) | 테스트 | 코드 | 통과 |
|---|---|---|---|
| J 가이드 목록 렌더/팀필터 | `component/guides`·`unit/guides` getGuides | `pages/GuidesPage`,`lib/dataClient` | ✅ |
| J 분야 칩 필터 | `component/guides` 칩 | `pages/GuidesPage` | ✅ |
| J 검색(제목/요약/분야) | `component/guides` 검색 | `pages/GuidesPage` | ✅ |
| J `?field=` 딥링크 | `component/guides` 딥링크 | `pages/GuidesPage` | ✅ |
| J 팀전환 분야 '전체' 리셋 | `component/guides` R1 회귀 | `pages/GuidesPage`(prevTeamRef) | ✅ |
| J 빈 결과 카피 | (로드>0 && 0) 가드 | `pages/GuidesPage` | ✅ |
| K 상세 단계/서류/근거 | `component/guides` 상세 | `pages/GuideDetailPage` | ✅ |
| K 근거법령 → /laws/:lawId | `component/guides` href | `pages/GuideDetailPage`,`guidesData`(lawId) | ✅ |
| K CTA pendingQ | `component/guides` CTA | `pages/GuideDetailPage` | ✅ |
| K 미상 id → 팀 첫 폴백 | `component/guides` 폴백 | `lib/dataClient` getGuide | ✅ |
| K 로딩/없음 상태 + AuthModal | `unit`/시각 | `pages/GuideDetailPage` | ✅ |
| L 로비 히어로/질문박스/예시 | `component/lobby` | `pages/LobbyPage` | ✅ |
| L 분야 카드 → /guides?field | `component/lobby` | `pages/LobbyPage` | ✅ |
| L featured → /guides/:id | `component/lobby` | `pages/LobbyPage` | ✅ |
| L 팀카드·미리보기 제거 | `component/lobby` 부재 확인 | `pages/LobbyPage` | ✅ |
| M 아이콘 시스템(JSX) | `unit/guides` FIELD_TINT/FIELDIC + 시각 | `components/Icon`,`guidesData` | ✅ |
| M 자료실/판례 행·히어로 아이콘 | `component/laws`·`cases` 회귀 + 시각 | `pages/Laws/Cases` | ✅ |
| N 서브내비 가이드 탭/active | `component/guides` 활성 | `components/Header` | ✅ |
| 가이드 데이터(10·매핑·featured) | `unit/guides` | `lib/guidesData` | ✅ |
| 회귀(v1 전체) | v1 단위·컴포넌트(로비/authModal 갱신) | 전체 | ✅ |
