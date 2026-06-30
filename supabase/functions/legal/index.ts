// Edge Function: 국가법령정보 중계(목록 큐레이션 + 상세 실조회 + 캐시).
// 배포: supabase functions deploy legal --no-verify-jwt  (게스트 공개)
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleLegal } from '../_shared/legalHandler.ts';
import { json, preflight } from '../_shared/cors.ts';

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function timedFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 8000);
  return fetch(input, { ...init, signal: c.signal }).finally(() => clearTimeout(t));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const cacheGet = async (key: string) => {
      const { data } = await sb.from('legal_cache').select('payload,fetched_at').eq('key', key).maybeSingle();
      if (!data) return null;
      if (Date.now() - new Date(data.fetched_at).getTime() > TTL_MS) return null;
      return data.payload;
    };
    const cacheSet = async (key: string, value: unknown) => {
      await sb.from('legal_cache').upsert({ key, payload: value, fetched_at: new Date().toISOString() });
    };
    const { status, body } = await handleLegal(new URL(req.url), {
      oc: Deno.env.get('LAW_OC') ?? '', fetch: timedFetch, cacheGet, cacheSet,
    });
    return json(status, body);
  } catch (e) {
    return json(500, { error: { code: 'INTERNAL', message: String(e) } });
  }
});
