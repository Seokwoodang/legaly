import { isValidTeam, type Team } from './ids.ts';
import { errorBody, statusFor } from './errors.ts';
import type { LawCitation, CaseCitation } from './corpus.ts';

type Sources = { laws: LawCitation[]; cases: CaseCitation[] };

// 사용자가 고를 수 있는 모델(화이트리스트). 임의 문자열 주입 방지 + 비용 통제.
export type ModelChoice = 'sonnet' | 'opus';
const MODEL_MAP: Record<ModelChoice, string> = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-8',
};
const DEFAULT_CHOICE: ModelChoice = 'sonnet';
export function resolveModel(choice: unknown): string {
  return MODEL_MAP[(choice as ModelChoice)] ?? MODEL_MAP[DEFAULT_CHOICE];
}

export interface AnswerDeps {
  // 동기(키워드) 또는 비동기(임베딩 벡터) 검색 모두 허용.
  retrieve: (team: Team, q: string) => Sources | Promise<Sources>;
  callClaude: (team: Team, q: string, sources: Sources, modelId: string) => Promise<string>;
  rateCheck: () => boolean;
}

export async function handleAnswer(
  body: { team?: unknown; question?: unknown; model?: unknown },
  deps: AnswerDeps,
): Promise<{ status: number; body: unknown }> {
  const team = body?.team;
  if (!isValidTeam(team)) return { status: 400, body: errorBody('VALIDATION', 'team은 법무|세무') };
  const q = typeof body?.question === 'string' ? body.question.trim() : '';
  if (q.length < 1 || q.length > 1000) return { status: 400, body: errorBody('VALIDATION', '질문은 1~1000자') };
  if (!deps.rateCheck()) return { status: 429, body: errorBody('RATE_LIMITED', '잠시 후 다시 시도해 주세요') };

  const modelId = resolveModel(body?.model); // 화이트리스트 외 값은 기본(sonnet)으로
  const sources = await deps.retrieve(team, q);
  try {
    const text = await deps.callClaude(team, q, sources, modelId);
    return { status: 200, body: { text, sources } };
  } catch (e) {
    const code = (e as Error)?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR';
    return { status: statusFor(code), body: errorBody(code, 'AI 답변 생성에 실패했어요') };
  }
}
