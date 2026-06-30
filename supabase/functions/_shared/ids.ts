// 순수 로직 — Deno/Node 공통(외부 의존 없음)
export type Team = '법무' | '세무';

/** 로그인 아이디 → Supabase Auth 이메일. trim + 소문자. */
export function idToEmail(id: string): string {
  return `${(id || '').trim().toLowerCase()}@legaly.app`;
}

export function isValidTeam(x: unknown): x is Team {
  return x === '법무' || x === '세무';
}
