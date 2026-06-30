import { isValidTeam, type Team } from './ids.ts';
import { errorBody, statusFor } from './errors.ts';
import { LAW_LIST, CASE_LIST, LAW_CORPUS, CASE_CORPUS } from './corpus.ts';
import { buildLawUrl, buildSearchUrl, parseLaw, parseCase, parseLawSearchId, parseCaseSearchId } from './lawApi.ts';

export interface LegalDeps {
  oc: string;
  fetch: typeof fetch;
  cacheGet: (key: string) => Promise<unknown | null>;
  cacheSet: (key: string, value: unknown) => Promise<void>;
}

// 슬러그/사건번호 → 국가법령정보 실 ID(MST/판례일련번호) 강제 매핑(선택).
// 비어 있으면 검색-우선으로 실시간 해석(법령명→MST, 사건번호→판례일련번호).
const LAW_API_ID: Record<string, string> = {};

/** 검색-우선: 큐레이션 항목명/사건번호로 실 ID(MST/일련번호) 해석. fetch 실패는 throw(상위에서 처리). */
async function resolveRealId(
  kind: 'law' | 'prec', id: string, name: string, deps: LegalDeps,
): Promise<string | null> {
  if (LAW_API_ID[id]) return LAW_API_ID[id];
  if (!name) return null;
  const res = await deps.fetch(buildSearchUrl(kind, name, deps.oc));
  if (!res.ok) throw Object.assign(new Error(`upstream ${res.status}`), { name: 'UpstreamError' });
  const json = await res.json();
  return kind === 'law' ? parseLawSearchId(json, name) : parseCaseSearchId(json);
}

function findLaw(id: string) {
  for (const t of ['법무', '세무'] as Team[]) { const e = LAW_CORPUS[t].find(x => x.id === id); if (e) return { t, e }; }
  return null;
}
function findCase(id: string) {
  for (const t of ['법무', '세무'] as Team[]) { const e = CASE_CORPUS[t].find(x => x.id === id); if (e) return { t, e }; }
  return null;
}

function stubLaw(id: string) {
  const f = findLaw(id); if (!f) return null;
  return { id, team: f.t, name: f.e.name, breadcrumbCat: f.e.field, lawNo: '', effDate: f.e.date, ministry: f.e.ministry, kind: '법률', articles: [], relatedCaseIds: [], isStub: true };
}
function stubCase(id: string) {
  const f = findCase(id); if (!f) return null;
  return { id, team: f.t, name: f.e.name, breadcrumb: f.e.field, court: f.e.court, courtFull: f.e.court, result: '', fullNumber: f.e.number, number: f.e.number, date: f.e.date, caseType: f.e.field, issues: [], holdings: [], refs: [], opinion: [], isStub: true };
}

export async function handleLegal(url: URL, deps: LegalDeps): Promise<{ status: number; body: unknown }> {
  const kind = url.searchParams.get('kind');
  const team = url.searchParams.get('team');
  const id = url.searchParams.get('id') ?? '';

  if (kind === 'laws' || kind === 'cases') {
    if (!isValidTeam(team)) return { status: 400, body: errorBody('VALIDATION', 'team이 필요합니다') };
    return { status: 200, body: kind === 'laws' ? LAW_LIST[team] : CASE_LIST[team] };
  }
  if (kind === 'law' || kind === 'case') {
    if (!id) return { status: 400, body: errorBody('VALIDATION', 'id가 필요합니다') };
    const cacheKey = `${kind}:${id}`;
    const cached = await deps.cacheGet(cacheKey);
    if (cached) return { status: 200, body: cached };
    try {
      const apiKind = kind === 'law' ? 'law' : 'prec';
      // 검색-우선으로 실 ID 해석. 법령은 법령명, 판례는 사건번호로 검색(미큐레이션이면 id 자체로 시도).
      const query = kind === 'law' ? (findLaw(id)?.e.name ?? id) : (findCase(id)?.e.number ?? id);
      const realId = await resolveRealId(apiKind, id, query, deps);
      // OPEN DB에 없으면(검색 0건) 큐레이션 스텁으로 폴백.
      if (!realId) {
        const stub = kind === 'law' ? stubLaw(id) : stubCase(id);
        if (stub) { await deps.cacheSet(cacheKey, stub); return { status: 200, body: stub }; }
        return { status: statusFor('UPSTREAM_ERROR'), body: errorBody('UPSTREAM_ERROR', '법령정보 조회에 실패했어요') };
      }
      const res = await deps.fetch(buildLawUrl(apiKind, realId, deps.oc));
      if (!res.ok) throw Object.assign(new Error(`upstream ${res.status}`), { name: 'UpstreamError' });
      const data = await res.json();
      let detail: unknown;
      if (kind === 'law') {
        const fl = findLaw(id); const p = parseLaw(data);
        detail = { id, team: fl?.t ?? team ?? '법무', name: p.name || fl?.e.name || id, breadcrumbCat: fl?.e.field ?? '', lawNo: p.lawNo, effDate: p.effDate || fl?.e.date || '', ministry: fl?.e.ministry ?? '', kind: '법률', articles: p.articles, relatedCaseIds: [], isStub: p.articles.length === 0 };
      } else {
        const fc = findCase(id); const p = parseCase(data);
        detail = { id, team: fc?.t ?? team ?? '법무', name: p.name || fc?.e.name || id, breadcrumb: fc?.e.field ?? '', court: p.court, courtFull: p.court, result: '', fullNumber: fc?.e.number ?? id, number: fc?.e.number ?? id, date: p.date || fc?.e.date || '', caseType: fc?.e.field ?? '', issues: p.issues, holdings: p.holdings, refs: [], opinion: p.opinion, isStub: p.holdings.length === 0 };
      }
      await deps.cacheSet(cacheKey, detail);
      return { status: 200, body: detail };
    } catch (e) {
      // 타임아웃은 명시적으로 504(스텁으로 숨기지 않음, 스펙 C). 캐시는 이미 위에서 처리됨.
      if ((e as Error)?.name === 'AbortError') {
        return { status: statusFor('UPSTREAM_TIMEOUT'), body: errorBody('UPSTREAM_TIMEOUT', '법령정보 조회가 지연됐어요') };
      }
      // 그 외(4xx/5xx/파싱실패): 큐레이션 항목이면 스텁 200(UX 보호), 아니면 502
      const stub = kind === 'law' ? stubLaw(id) : stubCase(id);
      if (stub) return { status: 200, body: stub };
      return { status: statusFor('UPSTREAM_ERROR'), body: errorBody('UPSTREAM_ERROR', '법령정보 조회에 실패했어요') };
    }
  }
  return { status: 400, body: errorBody('VALIDATION', 'kind는 laws|cases|law|case') };
}
