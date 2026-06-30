# 08 · 완료 보고 (Gate 2) — 리걸리 백엔드

## 무엇을 만들었나
프론트(`legaly`)의 `dataClient`/`storage`/`AppContext`를 **Supabase 백엔드**로 연결. 3 워크스트림 완성·배포.

- **(A) 인증 + 보관함** — Supabase Auth(이메일+비번), `saved_consultations`(+RLS 본인만), 계정 4개 시드.
  프론트 로그인/보관함이 DB 연동(localStorage 대체). 라이브 RLS 격리 검증.
- **(B) 국가법령정보 중계** — Edge Function `legal`: 팀별 큐레이션 목록 + **상세 실 전문**(+`legal_cache` TTL) +
  타임아웃/폴백. **v1.1**: 검색-우선(법령명→MST, 사건번호→판례일련번호)으로 실 조문(가지번호·항)·판시사항/
  판결요지 라이브 조회. 미수록 사건은 스텁 폴백.
- **(C) AI 답변 RAG** — Edge Function `answer`: **하이브리드 검색**(키워드+임베딩 벡터)→Claude→{text, sources}.
  **로그인 필수**(프론트 게이트 + 서버 JWT 검증). 라이브: 로그인 200/게스트 401 검증.
  **v1.1**: pgvector + Edge 내장 gte-small(384d) + `match_legal` RPC로 의미검색 추가, 키워드와 병합.

## 아키텍처
Supabase(도쿄): Auth · Postgres(`saved_consultations`,`legal_cache`+RLS) · Edge Functions(Deno) `legal`·`answer`.
순수 로직(_shared/*.ts)은 Deno/Node 공통 → Vitest 단위/계약 테스트. 프론트는 **이중 모드**(env+테스트
아님 → 실서버, 그 외 → localStorage/샘플 폴백)로 기존 128 테스트 무손상.

## 배포 상태(라이브)
- 함수 2개 deployed (`--no-verify-jwt`; answer는 내부 getUser로 인증).
- 시크릿: `ANTHROPIC_API_KEY`, `LAW_OC` (function secrets).
- DB: 마이그레이션 적용(테이블 2 + RLS). 계정 4개 시드(`*@legaly.app`, 비번 `123456`).

## 로그인 계정
`swoo1427` / `squface` / `squface5680` / `lyuna29` — 비번 **`123456`** (로그인 후 변경 권장).

## 실행
```bash
cd ~/Desktop/legaly && npm run dev     # 실서버 연동(.env.local의 Supabase URL/anon 사용)
npm test                               # 162 tests
```
- 비로그인: 자료실/판례/가이드 열람·로비 둘러보기 가능. **AI 상담·보관함은 로그인 필요.**
- 재배포: `supabase functions deploy legal answer embed --project-ref <ref> --no-verify-jwt` (env: SUPABASE_ACCESS_TOKEN)
- 마이그레이션: `0001_init.sql`·`0002_embeddings.sql` (SQL Editor 또는 Management API).
- 계정 시드: `node --env-file=supabase/.env.local supabase/seed/seed-users.mjs`
- 임베딩 시드: `embed` 함수에 `POST {offset,limit}` (헤더 `x-seed-token: $EMBED_SEED_TOKEN`)로 청크 호출(코퍼스 39행).

## 잔여/다음 (deferred.md)
- ✅ (v1.1) 국가법령정보 실 전문(검색-우선) · ✅ (v1.1) 임베딩 RAG(pgvector + gte-small, 하이브리드).
- 임베딩 모델 업그레이드(gte-small→운영급, 외부 키 필요) — 한국어 법률 패러프레이즈 순위 개선.
- **시크릿 로테이트**(채팅 평문 노출분: Anthropic 키·service_role·access token).
- 비번 정책/실서비스용 비번, 가이드 콘텐츠 서버화.

## 결론
리걸리 풀스택 완성 — 프론트(v1·v2) + 백엔드(A/B/C) 구현·검증·배포. AI 상담이 실제 Claude+RAG로,
보관함이 사용자별 DB로, AI는 로그인 필수로 동작.
