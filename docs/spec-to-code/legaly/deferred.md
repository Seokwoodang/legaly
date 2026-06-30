# deferred.md — legaly (보류/TODO)

이번 프론트 작업에서 의도적으로 미룬 항목. 각 항목은 재방문 트리거를 명시.

## 백엔드 작업(다음 단계: `/spec-to-code-backend`)
- **실제 국가법령정보 API 연동 (OC=test-oc).**
  - Where: `src/lib/dataClient.ts`의 `getLaws/getLaw/getCases/getCase`(현재 `sampleData` 반환).
  - What's missing: 법령/판례 전문·목록을 실제 API에서 조회(브라우저 CORS → 백엔드 중계 필요).
  - Done-when: 백엔드 `/api/laws` 등이 `LawListItem/LawDetail` 형태로 응답, dataClient가 fetch로 교체.
- **AI 답변(RAG) 생성.**
  - Where: `src/lib/dataClient.ts`의 `getAnswer`(현재 팀 고정 샘플).
  - What's missing: 질문 → 관련 법령/판례 검색 → LLM 답변 + 출처 카드 반환.
  - Done-when: 백엔드 `/api/answer`가 `AnswerPayload`(출처 동반) 응답, getAnswer가 호출로 교체.
- **실제 인증 + 사용자별 영속화.**
  - Where: `src/context/AppContext.tsx`(login/logout), `src/lib/storage.ts`(user/saved).
  - What's missing: 실제 로그인 세션, 사용자별 보관함(현재 전역 localStorage 단일 목록).
  - Done-when: 세션/DB 도입, `SavedItem`에 사용자 스코프, 키 의미 유지.
  - **백엔드 = Supabase** (사용자 제공). 자격증명은 `.env.local`에 보관:
    `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Supabase Auth + `saved_consultations`
    테이블(user별)로 보관함 영속화, dataClient는 Supabase 조회/Edge Function으로 교체.

## 데이터
- **가이드 참조 판례 일부가 샘플 코퍼스에 없음** (v2 r1-R6). 예: `criminal-complaint` 가이드의
  `2018도2614`(무고죄)는 `CASES` 샘플에 없어 `/cases/2018도2614` 링크가 팀 대표 판례로 폴백.
  - Done-when: 실제 대법원 종합법률정보 연동 시 자동 해소(또는 해당 판례를 샘플에 추가).
- **전체 법령/판례 코퍼스.** 현재는 디자인 큐레이션 샘플(법령 23·판례 16, 전문은 팀당 2개). 나머지
  목록 행은 "준비중 스텁" 상세. 백엔드 연동 시 실데이터로 대체되며 스텁 분기 제거.

## 접근성/품질(원하면 후속)
- 전체 ARIA 패스(모달 외 토글/탭 등), 키보드 내비 정밀화는 기본만 반영. 필요 시 별도 라운드.
