# 리걸리 백엔드 (legaly-backend) — spec-to-code 매니페스트

**슬러그:** `legaly-backend` · **종류:** 백엔드(Supabase) · **버전:** v1.1 (D1 실 전문 + D2 임베딩 RAG, 배포·검증 완료)

프론트(`legaly`)의 `dataClient`/`storage`/`AppContext`를 실제 서버로 교체. Supabase Auth + Postgres(RLS)
+ Edge Functions(국가법령정보 중계, Claude RAG).

## 범위
- (A) Supabase Auth + `saved_consultations`(사용자별 보관함, RLS) — localStorage 대체
- (B) 국가법령정보 OPEN API(OC=test-oc) Edge Function 중계 → 실 법령·판례
- (C) AI 답변 RAG: 질문→검색→Claude→{text, sources}

## 산출물(v1)
source/ · v1/{00-behavior-grid, 01-working-spec, 02-resolved-spec, 03-design, 04-test-doc,
05-traceability, 06-review/, 07-verify, 08-completion} · deferred.md · CHANGELOG.md

## 외부/시크릿
국가법령정보 OC=test-oc · Anthropic API 키 · Supabase URL/anon(.env.local)/service_role(제공 예정).
Edge Function Secrets로 OC·Anthropic 보관.
