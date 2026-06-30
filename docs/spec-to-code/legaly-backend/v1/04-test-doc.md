# 04 · 테스트 문서 — 리걸리 백엔드 (RED)

QA가 코드 없이 읽고 재검증 가능하게. 순수 로직·핸들러는 Vitest(외부 fetch/Claude/캐시 = stub/DI).
실 Supabase/국가법령정보/Claude 통합은 배포 후 수동 QA(아래 §수동 QA). RED 실행은 테스트 승인 직후
구현 시작점(게이트 가드 순서).

## 단위 — `tests/unit/backend/logic.test.ts`
| # | 검증 목적 | 입력 | 기대결과 |
|---|---|---|---|
| ids1 | 아이디→이메일 | `swoo1427`/` SQUFACE ` | `swoo1427@legaly.app` / trim·소문자 |
| ids2 | 팀 유효성 | 법무/세무/xxx | true/true/false |
| err1 | 코드→상태 | 7개 코드 | 401/400/404/429/504/502/500 |
| err2 | 에러 바디 | (VALIDATION,msg) | `{error:{code,message}}` |
| ret1 | tokenize 2자+ | "전세 보증금을 못…" | 전세·보증금을 포함, '못' 제외 |
| ret2 | scoreDoc 겹침 점수 | 토큰 vs 텍스트 | 관련>무관 |
| ret3 | 법무 전세질문 | retrieve(법무,전세보증금) | 근거법령에 주택임대차보호법, 법령≤3·판례≤2 |
| ret4 | 세무 경비질문 | retrieve(세무,종합소득세 경비) | 소득세법 포함 |
| ret5 | 매칭0 빈 sources | 없는단어 | throw 안 함, 빈 배열 |
| ret6 | citation id | retrieve | 모든 법령 citation id 보유 |
| pr1 | 프롬프트 페르소나+출처 | buildAnswerMessages(법무,…) | system에 법무팀, user에 질문+출처명 |
| law1 | buildLawUrl 법령 | (law,id,oc) | OC=·target=law·ID 포함 |
| law2 | buildLawUrl 판례 | (prec,…) | target=prec |
| cor1~3 | 큐레이션 목록 수/필드 | LAW_LIST/CASE_LIST | 법무12·세무11 / 법무10·세무6 / 프론트 필드 |

## 계약 — `tests/unit/backend/handlers.test.ts` (DI stub)
**handleLegal**: kind=laws/cases → 200 목록(12/6) · 잘못된 kind/누락 team → 400 VALIDATION · detail 캐시
히트 시 fetch 미호출 · 미스 시 fetch+cacheSet · 타임아웃+캐시無 → 504 · 외부실패+캐시有 → 200 폴백.
**handleAnswer**: 정상 → 200 {text,sources} · team무효/빈질문/1000초과 → 400 · rate초과 → 429 · Claude실패 → 502.

## 프론트 교체 (회귀 + 신규)
- **회귀:** 기존 128 테스트 GREEN 유지(시그니처 불변). storage/dataClient/AppContext는 supabase-js·Edge
  fetch를 **mock**해 동일 시그니처로 동작. (로그인 모달에 비번 필드 추가 = 작은 UI 변경, 해당 테스트만 갱신.)
- 신규(구현 시): storage.getSaved/addSaved/deleteSaved가 supabase select/insert/delete 호출하는지(mock),
  dataClient.getAnswer가 Edge POST 호출하는지, 실패 시 샘플 폴백.

## 🔍 수동 QA (배포 후, 실 연동)
1. SQL Editor에 `0001_init.sql` 실행 → `saved_consultations`·`legal_cache` 생성, RLS on 확인.
2. 계정 시드 실행 → Authentication에 4계정(`*@legaly.app`) 생성 확인.
3. 함수 배포 후 `curl "$URL/functions/v1/legal?kind=laws&team=법무"` → 12건 JSON.
4. `curl "$URL/functions/v1/legal?kind=law&id=housing-lease"` → 실제 조문(국가법령정보) + 2회차 캐시 빠름.
5. `curl -XPOST "$URL/functions/v1/answer" -d '{"team":"법무","question":"전세 보증금 못 받았어요"}'` →
   {text, sources} (Claude 답변 + 출처).
6. 프론트 로그인(swoo1427/legaly-temp-1234) → 상담 저장 → 다른 계정 로그인 시 안 보임(RLS).
7. 비로그인 상태 상담/열람 가능, 저장만 로그인 유도.

## QA가 더 의심해볼 변형
- 국가법령정보 응답 스키마 변형/빈 결과 → 파서 견고성·스텁 폴백.
- 동시 저장/삭제, 만료 토큰 401, rate limit 경계, 매우 긴 질문, 한자·특수문자 사건번호 URL 인코딩.
- Claude 타임아웃(20s) vs 에러 구분(504 vs 502).
