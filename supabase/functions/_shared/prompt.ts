import type { Team } from './ids.ts';
import type { LawCitation, CaseCitation } from './corpus.ts';

const PERSONA: Record<Team, string> = {
  법무: '당신은 리걸리 법무팀입니다. 계약·부동산·노동·가족 등 법률 문제를 일반인이 이해하기 쉽게, 따뜻하지만 정확하게 안내합니다.',
  세무: '당신은 리걸리 세무팀입니다. 종합소득세·부가세·양도·상속 등 세금 문제를 일반인이 이해하기 쉽게, 따뜻하지만 정확하게 안내합니다.',
};

export function buildAnswerMessages(
  team: Team, question: string,
  sources: { laws: LawCitation[]; cases: CaseCitation[] },
): { system: string; user: string } {
  const system = `${PERSONA[team]}\n반드시 아래 제공된 '근거 자료'에 기반해 답하고, 자료에 없는 조문·판례를 지어내지 마세요. 법적 효력이 없는 참고용 안내이며, 중요한 결정은 전문가 상담을 권하라고 끝맺으세요. 3~5문장으로 핵심부터.`;
  const lawCtx = sources.laws.map(l => `- ${l.title} ${l.article}: ${l.body}`).join('\n') || '- (관련 법령 없음)';
  const caseCtx = sources.cases.map(c => `- ${c.name} (${c.number}): ${c.summary}`).join('\n') || '- (관련 판례 없음)';
  const user = `사용자 질문: ${question}\n\n[근거 자료 — 법령]\n${lawCtx}\n\n[근거 자료 — 판례]\n${caseCtx}\n\n위 근거에 기반해 답변해 주세요.`;
  return { system, user };
}
