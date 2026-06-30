import type {
  Team, DataClient, LawDetail, CaseDetail, LawListItem, CaseListItem, AnswerPayload, SavedItem,
} from '../types';
import { LAWS, CASES, LAW_DETAILS, CASE_DETAILS, ANSWERS } from './sampleData';
import { GUIDES } from './guidesData';
import * as storage from './storage';
import { useSupabase, EDGE_BASE, supabase } from './supabaseClient';

const TEAMS: Team[] = ['법무', '세무'];
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// ── 샘플 폴백(실서버 미사용/실패 시) ─────────────────────────────
function findLawItem(id: string): { team: Team; item: LawListItem } | null {
  for (const t of TEAMS) { const item = LAWS[t].find(l => l.id === id); if (item) return { team: t, item }; }
  return null;
}
function findCaseItem(id: string): { team: Team; item: CaseListItem } | null {
  for (const t of TEAMS) { const item = CASES[t].find(c => c.id === id); if (item) return { team: t, item }; }
  return null;
}
function stubLaw(team: Team, item: LawListItem): LawDetail {
  return { id: item.id, team, name: item.name, breadcrumbCat: item.field, lawNo: '', effDate: item.date, ministry: item.ministry, kind: item.kind, articles: [], relatedCaseIds: [], isStub: true };
}
function stubCase(team: Team, item: CaseListItem): CaseDetail {
  return { id: item.id, team, name: item.name, breadcrumb: item.field, court: item.court, courtFull: item.court, result: '', fullNumber: item.number, number: item.number, date: item.date, caseType: item.field, issues: [], holdings: [], refs: [], opinion: [], isStub: true };
}
function sampleLaw(team: Team, id: string): LawDetail {
  for (const t of TEAMS) if (LAW_DETAILS[t].id === id) return LAW_DETAILS[t];
  const f = findLawItem(id); if (f) return stubLaw(f.team, f.item);
  return LAW_DETAILS[team];
}
function sampleCase(team: Team, id: string): CaseDetail {
  for (const t of TEAMS) if (CASE_DETAILS[t].id === id) return CASE_DETAILS[t];
  const f = findCaseItem(id); if (f) return stubCase(f.team, f.item);
  return CASE_DETAILS[team];
}

// ── Edge Function 호출 ───────────────────────────────────────────
const edgeHeaders = () => ({ 'content-type': 'application/json', apikey: ANON ?? '', authorization: `Bearer ${ANON ?? ''}` });
async function edgeGet<T>(qs: string): Promise<T> {
  const res = await fetch(`${EDGE_BASE}/legal?${qs}`, { headers: edgeHeaders() });
  if (!res.ok) throw new Error(`legal ${res.status}`);
  return res.json() as Promise<T>;
}

export const dataClient: DataClient = {
  async getLaws(team) {
    if (!useSupabase) return LAWS[team];
    try { return await edgeGet<LawListItem[]>(`kind=laws&team=${encodeURIComponent(team)}`); }
    catch { return LAWS[team]; }
  },
  async getLaw(team, id) {
    if (!useSupabase) return sampleLaw(team, id);
    try { return await edgeGet<LawDetail>(`kind=law&id=${encodeURIComponent(id)}&team=${encodeURIComponent(team)}`); }
    catch { return sampleLaw(team, id); }
  },
  async getCases(team) {
    if (!useSupabase) return CASES[team];
    try { return await edgeGet<CaseListItem[]>(`kind=cases&team=${encodeURIComponent(team)}`); }
    catch { return CASES[team]; }
  },
  async getCase(team, id) {
    if (!useSupabase) return sampleCase(team, id);
    try { return await edgeGet<CaseDetail>(`kind=case&id=${encodeURIComponent(id)}&team=${encodeURIComponent(team)}`); }
    catch { return sampleCase(team, id); }
  },
  async getAnswer(team, question, model) {
    if (!useSupabase) return ANSWERS[team];
    // AI 답변은 로그인 필수 → 사용자 세션 JWT를 Authorization으로 전송.
    const { data } = await supabase().auth.getSession();
    const token = data.session?.access_token ?? ANON ?? '';
    const res = await fetch(`${EDGE_BASE}/answer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: ANON ?? '', authorization: `Bearer ${token}` },
      body: JSON.stringify({ team, question, model }), // model: 'sonnet'|'opus' (서버에서 화이트리스트 검증)
    });
    if (!res.ok) throw new Error(`answer ${res.status}`);
    return res.json() as Promise<AnswerPayload>;
  },

  async getGuides(team) { return GUIDES.filter(g => g.team === team); },
  async getGuide(team, id) { return GUIDES.find(g => g.id === id) || GUIDES.find(g => g.team === team) || null; },

  async getSaved() {
    if (!useSupabase) return storage.getSaved();
    const { data, error } = await supabase().from('saved_consultations').select('id,team,title,summary,date').order('created_at', { ascending: false });
    if (error) throw error; // 호출측(SavedPage)이 에러 상태 처리
    return (data ?? []) as SavedItem[];
  },
  async addSaved(item) {
    if (!useSupabase) { const arr = storage.getSaved(); arr.unshift(item); storage.setSaved(arr); return; }
    const { data: u } = await supabase().auth.getUser();
    if (!u?.user) throw new Error('로그인이 필요합니다');
    const { error } = await supabase().from('saved_consultations').insert({ user_id: u.user.id, team: item.team, title: item.title, summary: item.summary, date: item.date });
    if (error) throw error;
  },
  async deleteSaved(id) {
    if (!useSupabase) { storage.setSaved(storage.getSaved().filter(x => x.id !== id)); return; }
    const { error } = await supabase().from('saved_consultations').delete().eq('id', id);
    if (error) throw error;
  },
};
