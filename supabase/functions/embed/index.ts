// Edge Function: 큐레이션 코퍼스를 gte-small로 임베딩해 legal_embeddings에 시드(업서트).
// 관리자 1회성 호출. 배포: supabase functions deploy embed --no-verify-jwt
// 호출: POST {} with header  x-seed-token: <EMBED_SEED_TOKEN>
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { buildSeedRows, embedText } from '../_shared/embed.ts';
import { json, preflight } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight();
  // 시드는 토큰 보호(서버 시크릿과 일치해야 실행).
  const token = req.headers.get('x-seed-token') ?? '';
  const expected = Deno.env.get('EMBED_SEED_TOKEN') ?? '';
  if (!expected || token !== expected) return json(401, { error: { code: 'UNAUTHENTICATED', message: 'invalid seed token' } });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const params = await req.json().catch(() => ({}));
  const all = buildSeedRows();
  // 컴퓨트 한도 회피: offset/limit으로 청크 시드(기본 8건).
  const offset = Number.isInteger(params?.offset) ? params.offset : 0;
  const limit = Number.isInteger(params?.limit) ? params.limit : 8;
  const rows = all.slice(offset, offset + limit);
  let ok = 0;
  const errors: string[] = [];
  for (const r of rows) {
    try {
      const embedding = await embedText(r.content);
      const { error } = await admin.from('legal_embeddings').upsert(
        { team: r.team, kind: r.kind, ref_id: r.ref_id, content: r.content, payload: r.payload, embedding, updated_at: new Date().toISOString() },
        { onConflict: 'team,kind,ref_id' },
      );
      if (error) errors.push(`${r.kind}:${r.ref_id} ${error.message}`);
      else ok++;
    } catch (e) {
      errors.push(`${r.kind}:${r.ref_id} ${String(e)}`);
    }
  }
  return json(200, { seeded: ok, batch: rows.length, total: all.length, offset, limit, next: offset + limit < all.length ? offset + limit : null, errors });
});
