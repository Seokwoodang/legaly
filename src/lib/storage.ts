import type { Team, User, SavedItem } from '../types';

export const KEYS = {
  team: 'legaly.team',
  user: 'legaly.user',
  saved: 'legaly.saved',
  pendingQ: 'legaly.pendingQ',
} as const;

export function getTeam(): Team {
  try {
    const t = localStorage.getItem(KEYS.team);
    return t === '법무' || t === '세무' ? t : '법무';
  } catch { return '법무'; }
}
export function setTeam(t: Team): void {
  try { localStorage.setItem(KEYS.team, t); } catch { /* noop */ }
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(KEYS.user);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u && typeof u.name === 'string' ? { name: u.name } : null;
  } catch { return null; }
}
export function setUser(u: User): void {
  try { localStorage.setItem(KEYS.user, JSON.stringify(u)); } catch { /* noop */ }
}
export function clearUser(): void {
  try { localStorage.removeItem(KEYS.user); } catch { /* noop */ }
}

/** 필수 필드(id/title/summary/date)만 검증 — team은 별도 보정한다. */
export function hasRequiredFields(x: unknown): x is Omit<SavedItem, 'team'> & { team?: unknown } {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.title === 'string' &&
    typeof o.summary === 'string' && typeof o.date === 'string';
}
export function getSaved(): SavedItem[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEYS.saved) || '[]');
    if (!Array.isArray(arr)) return [];
    // 필수필드 누락 항목은 제거, team 미상 항목은 '법무'로 보정해 유지(스펙 A1)
    return arr.filter(hasRequiredFields).map(o => ({
      id: o.id, title: o.title, summary: o.summary, date: o.date,
      team: (o.team === '법무' || o.team === '세무') ? o.team : '법무',
    } as SavedItem));
  } catch { return []; }
}
export function setSaved(items: SavedItem[]): void {
  // throw를 전파(호출측이 에러 처리)
  localStorage.setItem(KEYS.saved, JSON.stringify(items));
}

export function takePendingQ(): string | null {
  try {
    const q = localStorage.getItem(KEYS.pendingQ);
    if (q) localStorage.removeItem(KEYS.pendingQ);
    const trimmed = (q || '').trim();
    return trimmed ? trimmed : null;
  } catch { return null; }
}
/** 제거하지 않고 읽기만(StrictMode 이중 마운트 안전: 실제 발사 시점에 clearPendingQ로 제거) */
export function peekPendingQ(): string | null {
  try { const q = (localStorage.getItem(KEYS.pendingQ) || '').trim(); return q || null; } catch { return null; }
}
export function clearPendingQ(): void {
  try { localStorage.removeItem(KEYS.pendingQ); } catch { /* noop */ }
}
export function setPendingQ(q: string): void {
  try { localStorage.setItem(KEYS.pendingQ, q); } catch { /* noop */ }
}
