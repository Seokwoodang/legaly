import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Team, User } from '../types';
import * as storage from '../lib/storage';
import { useSupabase, supabase } from '../lib/supabaseClient';

interface AppCtx {
  team: Team; user: User | null; isLoggedIn: boolean;
  setTeam(t: Team): void;
  login(id: string, password?: string): Promise<User | null>;
  logout(): void | Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);

const idToEmail = (id: string) => `${(id || '').trim().toLowerCase()}@legaly.app`;
function sessionUser(session: { user?: { user_metadata?: Record<string, unknown>; email?: string } } | null): User | null {
  const u = session?.user;
  if (!u) return null;
  const name = (u.user_metadata?.name as string) || (u.email ? u.email.split('@')[0] : '사용자');
  return { name };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [team, setTeamState] = useState<Team>(() => storage.getTeam());
  const [user, setUser] = useState<User | null>(() => (useSupabase ? null : storage.getUser()));

  // 실서버 모드: Supabase 세션 동기화
  useEffect(() => {
    if (!useSupabase) return;
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => setUser(sessionUser(data.session)));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(sessionUser(session)));
    return () => sub.subscription.unsubscribe();
  }, []);

  const setTeam = (t: Team) => { storage.setTeam(t); setTeamState(t); };

  const login = async (id: string, password?: string): Promise<User | null> => {
    if (!useSupabase) {
      const u: User = { name: (id || '').trim() || '고객' };
      storage.setUser(u); setUser(u); return u;
    }
    const { data, error } = await supabase().auth.signInWithPassword({ email: idToEmail(id), password: password ?? '' });
    if (error) return null;
    const u = sessionUser(data.session); if (u) setUser(u); return u;
  };

  const logout = async () => {
    if (!useSupabase) { storage.clearUser(); setUser(null); return; }
    await supabase().auth.signOut(); setUser(null);
  };

  return (
    <Ctx.Provider value={{ team, user, isLoggedIn: !!user, setTeam, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
