// 4계정 시드(멱등). 실행:
//   node --env-file=supabase/.env.local supabase/seed/seed-users.mjs
// 필요 env: SUPABASE_PROJECT_REF, SUPABASE_SECRET_KEY (서버 전용)
import { createClient } from '@supabase/supabase-js';

const ref = process.env.SUPABASE_PROJECT_REF;
const url = process.env.SUPABASE_URL || (ref ? `https://${ref}.supabase.co` : '');
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error('SUPABASE_PROJECT_REF/URL 또는 SUPABASE_SECRET_KEY 누락'); process.exit(1); }

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const IDS = ['swoo1427', 'squface', 'squface5680', 'lyuna29'];
const PASSWORD = 'legaly-temp-1234';

for (const id of IDS) {
  const email = `${id}@legaly.app`;
  const { error } = await sb.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { name: id },
  });
  console.log(`${email} → ${error ? 'skip(' + error.message + ')' : 'created'}`);
}
console.log(`\n임시 비밀번호: ${PASSWORD} (로그인 후 변경 권장)`);
