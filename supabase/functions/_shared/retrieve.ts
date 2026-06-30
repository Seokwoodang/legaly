import type { Team } from './ids.ts';
import { LAW_CORPUS, CASE_CORPUS, type LawCitation, type CaseCitation } from './corpus.ts';

const STOP = new Set(['그리고', '그런데', '하는데', '있어요', '있는데', '인가요', '어떻게', '어떡', '하나요', '입니다', '습니다']);

/** 질문 → 2자 이상 키워드 토큰(조사 일부 포함, 매칭은 부분일치로 흡수). */
export function tokenize(q: string): string[] {
  return (q || '')
    .split(/[^0-9A-Za-z가-힣]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 2 && !STOP.has(s));
}

/** 토큰이 텍스트(키워드 모음)와 겹치는 정도. 부분일치 양방향. */
export function scoreDoc(tokens: string[], text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    if (words.some(w => w === t || t.includes(w) || w.includes(t))) score += 1;
  }
  return score;
}

export function retrieve(team: Team, q: string): { laws: LawCitation[]; cases: CaseCitation[] } {
  const tokens = tokenize(q);
  const laws = LAW_CORPUS[team]
    .map(e => ({ e, s: scoreDoc(tokens, e.keywords.join(' ') + ' ' + e.name) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map(({ e }) => ({ id: e.id, title: e.name, article: e.article || '', body: e.body || `${e.name} 관련 조문` }));
  const cases = CASE_CORPUS[team]
    .map(e => ({ e, s: scoreDoc(tokens, e.keywords.join(' ') + ' ' + e.name) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map(({ e }) => ({ id: e.id, name: e.name, number: e.number, court: e.court, date: e.date, summary: e.summary }));
  return { laws, cases };
}
