// Edge Function: 키워드 RAG → Claude 답변(+출처). 배포: supabase functions deploy answer --no-verify-jwt
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleAnswer } from '../_shared/answerHandler.ts';
import { retrieve } from '../_shared/retrieve.ts';
import { embedText, splitMatches, mergeSources } from '../_shared/embed.ts';
import { buildAnswerMessages } from '../_shared/prompt.ts';
import type { Team } from '../_shared/ids.ts';
import { callClaude } from '../_shared/anthropic.ts';
import { errorBody } from '../_shared/errors.ts';
import { json, preflight } from '../_shared/cors.ts';

// 간단 인메모리 rate limit: IP당 분당 20회
const hits = new Map<string, number[]>();
function rateCheck(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter(t => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5_000) { // 맵 무한증가 방지: 오래된 빈 버킷 정리
    for (const [k, v] of hits) if (v.length === 0 || now - v[v.length - 1] > 60_000) hits.delete(k);
  }
  return arr.length <= 20;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    // AI 상담은 로그인 필수: 사용자 JWT 검증(게스트/익명 → 401).
    const authHeader = req.headers.get('Authorization') ?? '';
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json(401, errorBody('UNAUTHENTICATED', '로그인이 필요합니다'));

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
    const ip = req.headers.get('x-forwarded-for') ?? 'anon';
    const body = await req.json().catch(() => ({}));

    // 하이브리드 RAG: 키워드(법률용어 정밀) + 임베딩 벡터(gte-small, 패러프레이즈 재현율)를 병합.
    // 임베딩/RPC가 불가하면 키워드 결과만 사용(절대 키워드 단독보다 나빠지지 않음).
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const hybridRetrieve = async (team: Team, q: string) => {
      const keyword = retrieve(team, q);
      try {
        const embedding = await embedText(q);
        const { data, error } = await admin.rpc('match_legal', { query_embedding: embedding, match_team: team, match_count: 8 });
        if (!error && Array.isArray(data) && data.length) {
          return mergeSources(keyword, splitMatches(data));
        }
      } catch (_e) { /* 임베딩/RPC 불가 → 키워드만 */ }
      return keyword;
    };

    const { status, body: out } = await handleAnswer(body, {
      retrieve: hybridRetrieve,
      rateCheck: () => rateCheck(ip),
      callClaude: async (team, q, sources, modelId) => {
        const m = buildAnswerMessages(team, q, sources);
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), 20_000);
        try {
          return await callClaude({ system: m.system, user: m.user, apiKey, model: modelId }, (u, init) => fetch(u, { ...init, signal: c.signal }));
        } finally { clearTimeout(t); }
      },
    });
    return json(status, out);
  } catch (e) {
    return json(500, { error: { code: 'INTERNAL', message: String(e) } });
  }
});
