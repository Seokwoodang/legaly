import type { LawListItem, CaseListItem } from './corpus.ts';

const BASE = 'https://www.law.go.kr/DRF';
const enc = (s: string) => encodeURIComponent(s);

/** 국가법령정보 상세조회 URL. kind=law→lawService(MST), prec→판례(ID=판례일련번호). */
export function buildLawUrl(kind: 'law' | 'prec', id: string, oc: string): string {
  const target = kind === 'prec' ? 'prec' : 'law';
  const idParam = kind === 'prec' ? 'ID' : 'MST';
  return `${BASE}/lawService.do?OC=${enc(oc)}&target=${target}&type=JSON&${idParam}=${enc(id)}`;
}

/** 검색 URL. 법령은 법령명(query), 판례는 사건번호(nb)로 정확 매칭. */
export function buildSearchUrl(kind: 'law' | 'prec', query: string, oc: string): string {
  if (kind === 'prec') return `${BASE}/lawSearch.do?OC=${enc(oc)}&target=prec&type=JSON&nb=${enc(query)}`;
  return `${BASE}/lawSearch.do?OC=${enc(oc)}&target=law&type=JSON&query=${enc(query)}&display=20`;
}

/** 법령 검색결과 → 법령일련번호(MST). exactName 우선 정확매칭(시행령 등 제외). */
export function parseLawSearchId(json: any, exactName?: string): string | null {
  const items = arr(pick(pick(json, 'LawSearch') ?? json ?? {}, 'law'));
  const mstOf = (it: any) => { const m = pick(it, '법령일련번호', 'lawSn', '법령MST'); return m != null ? String(m) : null; };
  if (exactName) {
    const hit = items.find((it: any) => String(pick(it, '법령명한글', '법령명_한글', '법령명') ?? '').trim() === exactName.trim());
    if (hit) return mstOf(hit);
  }
  for (const it of items) { const m = mstOf(it); if (m) return m; }
  return null;
}

/** 판례 검색결과 → 판례일련번호. */
export function parseCaseSearchId(json: any): string | null {
  const items = arr(pick(pick(json, 'PrecSearch') ?? json ?? {}, 'prec'));
  for (const it of items) { const s = pick(it, '판례일련번호', 'precSeq'); if (s != null) return String(s); }
  return null;
}

export interface ParsedLaw { name: string; lawNo: string; effDate: string; articles: { id: string; num: string; title: string; body: string }[]; }
export interface ParsedCase { name: string; court: string; date: string; issues: string[]; holdings: { tag: string; text: string }[]; opinion: { label: string; text: string }[]; }

const pick = (o: any, ...keys: string[]) => { for (const k of keys) { if (o && o[k] != null) return o[k]; } return undefined; };
const arr = (x: any) => (Array.isArray(x) ? x : x == null ? [] : [x]);

/** YYYYMMDD → "YYYY. MM. DD." (그 외는 원문 유지). */
function fmtDate(s: string): string {
  const m = String(s ?? '').trim().match(/^(\d{4})(\d{2})(\d{2})$/);
  return m ? `${m[1]}. ${m[2]}. ${m[3]}.` : String(s ?? '').trim();
}

/** 조문번호(+가지번호) → "제N조" / "제N조의M". */
function articleNum(a: any): string {
  const n = String(pick(a, '조문번호') ?? '').trim();
  const branch = String(pick(a, '조문가지번호') ?? '').trim();
  if (!n) return '';
  return branch && branch !== '0' ? `제${n}조의${branch}` : `제${n}조`;
}

/** 국가법령정보 법령 응답(JSON) → 조문 파싱(가지번호·항 포함, 스키마 변형에 관대). */
export function parseLaw(json: any): ParsedLaw {
  const root = pick(json, '법령', 'Law', 'law') ?? json ?? {};
  const basic = pick(root, '기본정보', 'lawInfo') ?? {};
  const name = String(pick(basic, '법령명_한글', '법령명', 'lawNm') ?? pick(root, '법령명_한글') ?? '');
  const lawNo = String(pick(basic, '공포번호', '법령ID') ?? '');
  const effDate = fmtDate(String(pick(basic, '시행일자') ?? ''));
  const rawArticles = arr(pick(pick(root, '조문', 'articles') ?? {}, '조문단위') ?? pick(root, '조문') ?? []);
  const articles = rawArticles
    .filter((a: any) => String(pick(a, '조문여부') ?? '조문') === '조문')
    .map((a: any, i: number) => {
      const num = articleNum(a) || `제${i + 1}조`;
      const title = String(pick(a, '조문제목') ?? '').trim();
      // 조문내용(머리줄: "제N조(제목) …") + 항내용들을 합쳐 본문 구성.
      const head = String(pick(a, '조문내용', '조문') ?? '').trim();
      const clauses = arr(pick(a, '항')).map((h: any) => String(pick(h, '항내용') ?? '').trim()).filter(Boolean);
      let body = [head, ...clauses].filter(Boolean).join('\n').trim();
      // 본문 첫 줄이 "제N조(제목)" 머리표기뿐이면 중복 제거.
      const headOnly = new RegExp(`^제\\s*\\d+조(?:의\\d+)?\\s*\\([^)]*\\)\\s*$`);
      body = body.split('\n').filter((ln, idx) => !(idx === 0 && headOnly.test(ln.trim()))).join('\n').trim() || head;
      return { id: `art${num}`, num, title, body };
    })
    .filter((a: any) => a.body);
  return { name, lawNo, effDate, articles };
}

const stripTags = (s: any) => String(s ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
/** 판례 본문에서 "[1] …[2] …" 또는 줄바꿈으로 항목 분리. */
function splitItems(s: any): string[] {
  const t = stripTags(s);
  if (!t) return [];
  const byTag = t.split(/(?=\[\d+\])/).map(x => x.trim()).filter(Boolean);
  if (byTag.length > 1) return byTag;
  return t.split(/\n+/).map(x => x.trim()).filter(Boolean);
}

export function parseCase(json: any): ParsedCase {
  const root = pick(json, 'PrecService', '판례', 'prec') ?? json ?? {};
  const name = stripTags(pick(root, '사건명'));
  const court = stripTags(pick(root, '법원명')) || '대법원';
  const date = fmtDate(stripTags(pick(root, '선고일자')));
  const issues = splitItems(pick(root, '판시사항'));
  const holdings = splitItems(pick(root, '판결요지')).map((text, i) => {
    const m = text.match(/^\[(\d+)\]\s*/);
    return { tag: m ? `[${m[1]}]` : `[${i + 1}]`, text: text.replace(/^\[\d+\]\s*/, '') };
  });
  const opinion = splitItems(pick(root, '판례내용', '전문')).map(text => ({ label: '', text }));
  return { name, court, date, issues, holdings, opinion };
}

/** 큐레이션 목록을 그대로 노출(프론트 타입). */
export type { LawListItem, CaseListItem };
