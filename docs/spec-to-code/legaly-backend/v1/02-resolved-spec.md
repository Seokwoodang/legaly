# 02 · 확정 스펙 (Gate 1 계약) — 리걸리 백엔드

동작은 `00-behavior-grid.md`. 프론트 `dataClient`/`storage`/`AppContext` 시그니처가 권위(불변).
**열린 갭 없음**(⚠️ 3건은 Gate 1 확인).

## 아키텍처
Supabase: **Auth**(이메일+비밀번호) · **Postgres**(`saved_consultations`,`legal_cache` + RLS) ·
**Edge Functions(Deno)** `legal`(국가법령정보 중계)·`answer`(키워드 RAG+Claude). 프론트는 `supabase-js`
도입, 인증/보관함은 직접 SDK, 법령/판례/답변은 Edge Function fetch.

## 확정 결정
1. **(A) 인증 = 이메일+비밀번호.** 아이디→`<id>@legaly.app` 변환. 시드 4계정(swoo1427·squface·
   squface5680·lyuna29), 임시 비번 `legaly-temp-1234`, `name` metadata=아이디. admin seed(service_role).
2. **(A) 보관함 = 사용자별(RLS).** `saved_consultations` 본인 행만. v1 전역공유 deferred 해소.
3. **(B) 법령/판례 = 하이브리드.** 큐레이션 목록 + 상세 국가법령정보 실조회 + `legal_cache` TTL.
   외부 실패 시 캐시→스텁 폴백.
4. **(C) RAG = 키워드 검색.** 코퍼스 매칭 상위 N → Claude. 임베딩(pgvector)은 deferred.
5. **공개 범위:** laws/cases/answer 게스트 허용; saved만 인증 필요.
6. **에러 모델/CORS/시크릿/검증** = 그리드 E.

## 엔드포인트/계약(요약 — 상세는 03-design)
- `supabase.auth.signInWithPassword` / `signOut` / `onAuthStateChange` (프론트 직접).
- `saved_consultations` PostgREST(RLS): select(own)·insert·delete.
- Edge `legal`: `GET ?kind=laws|cases&team=` → 목록; `GET ?kind=law|case&id=` → 상세(LawDetail/CaseDetail).
- Edge `answer`: `POST {team,question}` → `{text, sources:{laws,cases}}`.
- 모든 함수: CORS + 에러 `{error:{code,message}}`.

## DB (마이그레이션 — additive/reversible, 사용자 적용)
```sql
create table saved_consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team text not null check (team in ('법무','세무')),
  title text not null, summary text not null, date text not null,
  created_at timestamptz not null default now()
);
alter table saved_consultations enable row level security;
create policy own_select on saved_consultations for select using (user_id = auth.uid());
create policy own_insert on saved_consultations for insert with check (user_id = auth.uid());
create policy own_delete on saved_consultations for delete using (user_id = auth.uid());
create index on saved_consultations(user_id, created_at desc);

create table legal_cache ( key text primary key, payload jsonb not null, fetched_at timestamptz not null default now() );
```

## 시크릿 (Function Secrets — 클라 금지)
`ANTHROPIC_API_KEY`(보관됨 supabase/.env.local), `LAW_OC=test-oc`. service_role=서버 시드 전용.

## 프론트 교체(시그니처 불변)
- `src/lib/supabaseClient.ts` 신규(@supabase/supabase-js, VITE_SUPABASE_URL/anon).
- `storage` saved → supabase 쿼리; team/pendingQ는 localStorage 유지(세션 무관 UI 상태).
- `AppContext` login/logout/user → Supabase Auth(아이디 변환·onAuthStateChange).
- `dataClient` getLaws/getLaw/getCases/getCase/getAnswer → Edge Function fetch(샘플 폴백 유지 옵션).
- **컴포넌트·기존 테스트 무수정**(시그니처 동일) — 회귀 보호.

## 수용 기준
순수 로직(아이디→이메일·키워드 추출/점수·국가법령정보 파서·캐시 키·에러 매핑·RAG 컨텍스트 빌더)
단위 테스트(외부 fetch stub). Edge 핸들러=계약 테스트(요청→상태/형태/에러코드, fetch mock). 실 Supabase/
외부/Claude 연동 = 키 제공·배포 후 수동 QA(curl + DB peek). 프론트 기존 128 테스트 회귀 유지.

## Gate 1 ⚠️ 확인
(C)키워드 시작 · 임시비번 `legaly-temp-1234` · 게스트 공개 범위 — 동의 여부.
