import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** 실서버 모드: env 설정 + 테스트 모드 아님. 테스트(vitest MODE='test')는 항상 데모/샘플 경로. */
export const useSupabase: boolean = Boolean(URL) && Boolean(KEY) && import.meta.env.MODE !== 'test';

export const EDGE_BASE: string = URL ? `${URL}/functions/v1` : '';

let _client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!_client) _client = createClient(URL!, KEY!);
  return _client;
}
