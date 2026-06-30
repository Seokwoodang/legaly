import type { Team } from './ids.ts';
import { LAW_CORPUS, CASE_CORPUS, type LawCitation, type CaseCitation } from './corpus.ts';

export const EMBED_DIM = 384;
const TEAMS: Team[] = ['법무', '세무'];

/** Edge 런타임 내장 gte-small(384d)로 텍스트 임베딩. Node/테스트 런타임엔 없음 → Edge에서만 호출. */
export async function embedText(text: string): Promise<number[]> {
  // @ts-ignore Supabase 전역은 Edge(Deno) 런타임에서만 제공
  const session = new Supabase.ai.Session('gte-small');
  // mean_pool+normalize → 코사인 유사도에 바로 사용 가능한 정규화 벡터
  // @ts-ignore
  const out = await session.run(text, { mean_pool: true, normalize: true });
  return Array.from(out as Iterable<number>);
}

export interface SeedRow {
  team: Team;
  kind: 'law' | 'case';
  ref_id: string;
  content: string; // 임베딩 대상 텍스트
  payload: LawCitation | CaseCitation; // RPC가 그대로 반환할 인용 객체
}

/** 큐레이션 코퍼스 → 임베딩 시드 행. content는 검색 텍스트, payload는 프론트 인용 그대로. */
export function buildSeedRows(): SeedRow[] {
  const rows: SeedRow[] = [];
  for (const team of TEAMS) {
    for (const l of LAW_CORPUS[team]) {
      const payload: LawCitation = { id: l.id, title: l.name, article: l.article ?? '', body: l.body ?? '' };
      const content = [l.name, l.field, (l.keywords ?? []).join(' '), l.article, l.body].filter(Boolean).join(' · ');
      rows.push({ team, kind: 'law', ref_id: l.id, content, payload });
    }
    for (const c of CASE_CORPUS[team]) {
      const payload: CaseCitation = { id: c.id, name: c.name, number: c.number, court: c.court, date: c.date, summary: c.summary };
      const content = [c.name, c.field, (c.keywords ?? []).join(' '), c.summary].filter(Boolean).join(' · ');
      rows.push({ team, kind: 'case', ref_id: c.id, content, payload });
    }
  }
  return rows;
}

/** match_legal RPC 결과(유사도 내림차순) → {laws≤lawMax, cases≤caseMax} 인용으로 분배. */
export function splitMatches(
  rows: { kind?: string; payload?: unknown }[],
  lawMax = 3,
  caseMax = 2,
): { laws: LawCitation[]; cases: CaseCitation[] } {
  const laws: LawCitation[] = [];
  const cases: CaseCitation[] = [];
  for (const r of rows ?? []) {
    if (r?.kind === 'law' && laws.length < lawMax) laws.push(r.payload as LawCitation);
    else if (r?.kind === 'case' && cases.length < caseMax) cases.push(r.payload as CaseCitation);
  }
  return { laws, cases };
}

type Sources = { laws: LawCitation[]; cases: CaseCitation[] };
function dedupCap<T extends { id: string }>(items: T[], cap: number): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (!it || seen.has(it.id)) continue;
    seen.add(it.id); out.push(it);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * 하이브리드 병합: primary(키워드=법률용어에 정밀)를 앞에 두고, secondary(임베딩=패러프레이즈 재현율)로
 * 빈 슬롯을 채움. 키워드 단독 결과보다 절대 나빠지지 않으면서 의미검색 재현율을 더한다.
 */
export function mergeSources(primary: Sources, secondary: Sources, lawMax = 3, caseMax = 2): Sources {
  return {
    laws: dedupCap([...(primary?.laws ?? []), ...(secondary?.laws ?? [])], lawMax),
    cases: dedupCap([...(primary?.cases ?? []), ...(secondary?.cases ?? [])], caseMax),
  };
}
