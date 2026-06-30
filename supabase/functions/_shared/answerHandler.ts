import { isValidTeam, type Team } from './ids.ts';
import { errorBody, statusFor } from './errors.ts';
import type { LawCitation, CaseCitation } from './corpus.ts';

type Sources = { laws: LawCitation[]; cases: CaseCitation[] };
export interface AnswerDeps {
  // 동기(키워드) 또는 비동기(임베딩 벡터) 검색 모두 허용.
  retrieve: (team: Team, q: string) => Sources | Promise<Sources>;
  callClaude: (team: Team, q: string, sources: Sources) => Promise<string>;
  rateCheck: () => boolean;
}

export async function handleAnswer(
  body: { team?: unknown; question?: unknown },
  deps: AnswerDeps,
): Promise<{ status: number; body: unknown }> {
  const team = body?.team;
  if (!isValidTeam(team)) return { status: 400, body: errorBody('VALIDATION', 'team은 법무|세무') };
  const q = typeof body?.question === 'string' ? body.question.trim() : '';
  if (q.length < 1 || q.length > 1000) return { status: 400, body: errorBody('VALIDATION', '질문은 1~1000자') };
  if (!deps.rateCheck()) return { status: 429, body: errorBody('RATE_LIMITED', '잠시 후 다시 시도해 주세요') };

  const sources = await deps.retrieve(team, q);
  try {
    const text = await deps.callClaude(team, q, sources);
    return { status: 200, body: { text, sources } };
  } catch (e) {
    const code = (e as Error)?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR';
    return { status: statusFor(code), body: errorBody(code, 'AI 답변 생성에 실패했어요') };
  }
}
