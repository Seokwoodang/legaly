import { describe, it, expect, vi } from 'vitest';
import { handleLegal } from '../../../supabase/functions/_shared/legalHandler';
import { handleAnswer } from '../../../supabase/functions/_shared/answerHandler';

const u = (qs: string) => new URL(`https://x.test/legal?${qs}`);
const okLawJson = { 법령: { 기본정보: { 법령명_한글: '주택임대차보호법' } } }; // 파서가 다루는 형태(대략)
const lawSearchJson = { LawSearch: { law: [{ 법령명한글: '주택임대차보호법', 법령일련번호: '276291' }] } };

// 검색-우선: lawSearch는 일련번호, lawService는 본문을 반환하도록 URL로 분기.
const okFetch = () => vi.fn(async (input: any) => {
  const url = String(input);
  const body = url.includes('lawSearch') ? lawSearchJson : okLawJson;
  return new Response(JSON.stringify(body), { status: 200 });
});

function legalDeps(over: Partial<Parameters<typeof handleLegal>[1]> = {}) {
  return {
    oc: 'test-oc',
    fetch: okFetch(),
    cacheGet: vi.fn(async () => null),
    cacheSet: vi.fn(async () => {}),
    ...over,
  } as Parameters<typeof handleLegal>[1];
}

describe('handleLegal (국가법령정보 중계)', () => {
  it('kind=laws → 200 목록(법무 12)', async () => {
    const r = await handleLegal(u('kind=laws&team=법무'), legalDeps());
    expect(r.status).toBe(200);
    expect((r.body as unknown[]).length).toBe(12);
  });
  it('kind=cases&team=세무 → 200 목록(6)', async () => {
    const r = await handleLegal(u('kind=cases&team=세무'), legalDeps());
    expect(r.status).toBe(200);
    expect((r.body as unknown[]).length).toBe(6);
  });
  it('잘못된 kind → 400 VALIDATION', async () => {
    const r = await handleLegal(u('kind=nope'), legalDeps());
    expect(r.status).toBe(400);
    expect((r.body as any).error.code).toBe('VALIDATION');
  });
  it('laws인데 team 없음 → 400', async () => {
    const r = await handleLegal(u('kind=laws'), legalDeps());
    expect(r.status).toBe(400);
  });
  it('detail 캐시 히트 → 외부 fetch 호출 안 함', async () => {
    const deps = legalDeps({ cacheGet: vi.fn(async () => ({ id: 'housing-lease', team: '법무', name: '주택임대차보호법', isStub: false, articles: [] } as any)) });
    const r = await handleLegal(u('kind=law&id=housing-lease'), deps);
    expect(r.status).toBe(200);
    expect(deps.fetch).not.toHaveBeenCalled();
  });
  it('detail 캐시 미스 → 검색+상세 2회 조회 + 캐시 저장', async () => {
    const deps = legalDeps();
    const r = await handleLegal(u('kind=law&id=housing-lease'), deps);
    expect(r.status).toBe(200);
    expect(deps.fetch).toHaveBeenCalledTimes(2); // lawSearch → lawService
    expect(deps.cacheSet).toHaveBeenCalledOnce();
  });
  it('외부 타임아웃 + 캐시 없음 → 504', async () => {
    const deps = legalDeps({ fetch: vi.fn(async () => { throw new DOMException('aborted', 'AbortError'); }) });
    const r = await handleLegal(u('kind=law&id=unknown-x'), deps);
    expect(r.status).toBe(504);
  });
  it('외부 실패(비타임아웃) + 캐시 없음 → 큐레이션 스텁 200', async () => {
    const deps = legalDeps({ fetch: vi.fn(async () => new Response('', { status: 503 })) });
    const r = await handleLegal(u('kind=law&id=housing-lease'), deps);
    expect(r.status).toBe(200);
    expect((r.body as any).isStub).toBe(true);
  });
  it('큐레이션 항목 타임아웃 → 504(스텁으로 숨기지 않음)', async () => {
    const deps = legalDeps({ fetch: vi.fn(async () => { throw new DOMException('aborted', 'AbortError'); }) });
    const r = await handleLegal(u('kind=law&id=housing-lease'), deps);
    expect(r.status).toBe(504);
    expect((r.body as any).error.code).toBe('UPSTREAM_TIMEOUT');
  });
  it('캐시 있음 → 외부 fetch 호출 안 함(캐시 우선)', async () => {
    const deps = legalDeps({ cacheGet: vi.fn(async () => ({ id: 'housing-lease', team: '법무', name: '주택임대차보호법', isStub: false, articles: [] } as any)) });
    const r = await handleLegal(u('kind=law&id=housing-lease'), deps);
    expect(r.status).toBe(200);
    expect(deps.fetch).not.toHaveBeenCalled();
  });
});

function answerDeps(over: Partial<Parameters<typeof handleAnswer>[1]> = {}) {
  return {
    retrieve: vi.fn(() => ({ laws: [{ id: 'housing-lease', title: '주택임대차보호법', article: '제3조의3', body: '...' }], cases: [] })),
    callClaude: vi.fn(async () => '정리해 드리면…'),
    rateCheck: vi.fn(() => true),
    ...over,
  } as Parameters<typeof handleAnswer>[1];
}

describe('handleAnswer (RAG + Claude)', () => {
  it('정상 → 200 {text, sources}', async () => {
    const r = await handleAnswer({ team: '법무', question: '보증금 못 받았어요' }, answerDeps());
    expect(r.status).toBe(200);
    expect((r.body as any).text).toContain('정리');
    expect((r.body as any).sources.laws[0].title).toBe('주택임대차보호법');
  });
  it('team 무효 → 400', async () => {
    const r = await handleAnswer({ team: 'xxx', question: 'q' } as any, answerDeps());
    expect(r.status).toBe(400);
  });
  it('question 빈값 → 400', async () => {
    const r = await handleAnswer({ team: '법무', question: '  ' }, answerDeps());
    expect(r.status).toBe(400);
  });
  it('question 1000자 초과 → 400', async () => {
    const r = await handleAnswer({ team: '법무', question: 'a'.repeat(1001) }, answerDeps());
    expect(r.status).toBe(400);
  });
  it('rate 초과 → 429', async () => {
    const r = await handleAnswer({ team: '법무', question: 'q' }, answerDeps({ rateCheck: vi.fn(() => false) }));
    expect(r.status).toBe(429);
  });
  it('Claude 실패 → 502', async () => {
    const r = await handleAnswer({ team: '법무', question: 'q' }, answerDeps({ callClaude: vi.fn(async () => { throw new Error('claude down'); }) }));
    expect(r.status).toBe(502);
  });
});
