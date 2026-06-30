-- 임베딩 RAG: pgvector + 큐레이션 코퍼스 벡터 검색
-- 임베딩은 Supabase Edge 내장 gte-small(384차원, 정규화)으로 생성.

create extension if not exists vector;

create table if not exists legal_embeddings (
  id        bigint generated always as identity primary key,
  team      text not null check (team in ('법무', '세무')),
  kind      text not null check (kind in ('law', 'case')),
  ref_id    text not null,                 -- 법령 슬러그 / 판례 사건번호
  content   text not null,                 -- 임베딩 대상 텍스트(이름·분야·키워드·조문·요지)
  payload   jsonb not null,                -- 프론트 인용 객체(LawCitation/CaseCitation) 그대로
  embedding vector(384),
  updated_at timestamptz not null default now(),
  unique (team, kind, ref_id)
);

-- 코사인 거리 기반 근접 검색 인덱스
create index if not exists legal_embeddings_vec
  on legal_embeddings using hnsw (embedding vector_cosine_ops);

-- 서버 전용(service_role만 접근). 정책 미부여 → anon/authenticated 직접 접근 불가.
alter table legal_embeddings enable row level security;

-- 질문 임베딩 → 같은 팀에서 유사도 상위 match_count건. SECURITY DEFINER로 RLS 우회(읽기 전용).
create or replace function match_legal(
  query_embedding vector(384),
  match_team text,
  match_count int default 8
)
returns table (kind text, ref_id text, payload jsonb, similarity float)
language sql
stable
security definer
set search_path = public
as $$
  select e.kind, e.ref_id, e.payload, 1 - (e.embedding <=> query_embedding) as similarity
  from legal_embeddings e
  where e.team = match_team and e.embedding is not null
  order by e.embedding <=> query_embedding
  limit greatest(match_count, 1)
$$;

-- 익명 사용자도 RPC 호출은 가능(SECURITY DEFINER 함수). 테이블 직접 접근은 여전히 차단.
grant execute on function match_legal(vector, text, int) to anon, authenticated, service_role;
