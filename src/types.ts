export type Team = '법무' | '세무';
export type User = { name: string };

export interface LawListItem {
  id: string; name: string; field: string; ministry: string; date: string;
  glyph: string; kind: '법령' | '예규';
}
export interface LawArticle { id: string; num: string; title: string; body: string; }
export interface LawDetail {
  id: string; team: Team; name: string; breadcrumbCat: string; lawNo: string;
  effDate: string; ministry: string; kind: string; articles: LawArticle[];
  relatedCaseIds: string[]; isStub: boolean;
}
export interface CaseListItem {
  id: string; name: string; number: string; court: string; field: string; date: string;
}
export interface CaseDetail {
  id: string; team: Team; name: string; breadcrumb: string; court: string; courtFull: string;
  result: string; fullNumber: string; number: string; date: string; caseType: string;
  issues: string[]; holdings: { tag: string; text: string }[];
  refs: { law: string; article: string; lawId: string }[];
  opinion: { label: string; text: string }[]; isStub: boolean;
}
export interface LawCitation { id: string; title: string; article: string; body: string; }
export interface CaseCitation { id: string; name: string; number: string; court: string; date: string; summary: string; }
export interface AnswerPayload { text: string; sources: { laws: LawCitation[]; cases: CaseCitation[] }; }
export interface SavedItem { id: string; team: Team; title: string; summary: string; date: string; }

export type LawSort = 'name' | 'date';
export type CaseSort = 'new' | 'old';
export type CourtFilter = '전체' | '대법원' | '대법원(전합)';
export type AuthVariant = 'generic' | 'save';
export type HeaderVariant = 'lobby' | 'team';

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'ai'; kind: 'greeting'; text: string; starters: string[] }
  | { id: string; role: 'ai'; kind: 'answer'; q: string; text: string; sources: AnswerPayload['sources']; savable: true }
  | { id: string; role: 'ai'; kind: 'pending' }
  | { id: string; role: 'ai'; kind: 'error'; q: string };

// 가이드 타입은 lib/guidesData에 정의(type-only 순환 import 허용)
import type { Guide } from './lib/guidesData';
export type { Guide };

export type ModelChoice = 'sonnet' | 'opus';

export interface DataClient {
  getLaws(team: Team): Promise<LawListItem[]>;
  getLaw(team: Team, id: string): Promise<LawDetail>;
  getCases(team: Team): Promise<CaseListItem[]>;
  getCase(team: Team, id: string): Promise<CaseDetail>;
  getAnswer(team: Team, question: string, model?: ModelChoice): Promise<AnswerPayload>;
  getGuides(team: Team): Promise<Guide[]>;
  getGuide(team: Team, id: string): Promise<Guide | null>;
  getSaved(): Promise<SavedItem[]>;
  addSaved(item: SavedItem): Promise<void>;
  deleteSaved(id: string): Promise<void>;
}
