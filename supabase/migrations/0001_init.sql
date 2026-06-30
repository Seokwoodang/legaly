-- 리걸리 백엔드 초기 스키마 (additive·reversible). Supabase SQL Editor에서 실행.

-- 보관함: 사용자별 상담 저장
create table if not exists public.saved_consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team text not null check (team in ('법무', '세무')),
  title text not null,
  summary text not null,
  date text not null,
  created_at timestamptz not null default now()
);

alter table public.saved_consultations enable row level security;

drop policy if exists own_select on public.saved_consultations;
drop policy if exists own_insert on public.saved_consultations;
drop policy if exists own_delete on public.saved_consultations;
create policy own_select on public.saved_consultations for select using (user_id = auth.uid());
create policy own_insert on public.saved_consultations for insert with check (user_id = auth.uid());
create policy own_delete on public.saved_consultations for delete using (user_id = auth.uid());

create index if not exists saved_consultations_user_created_idx
  on public.saved_consultations (user_id, created_at desc);

-- 법령/판례 상세 캐시(Edge Function 전용; service_role만 접근, RLS로 클라 차단)
create table if not exists public.legal_cache (
  key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.legal_cache enable row level security;
-- 정책 없음 = 익명/사용자 키로는 접근 불가. Edge Function의 service_role은 RLS 우회.

-- 롤백:
-- drop table if exists public.legal_cache;
-- drop table if exists public.saved_consultations;
