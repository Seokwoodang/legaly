import { describe, it, expect, beforeEach } from 'vitest';
import { dataClient } from '../../src/lib/dataClient';
import { makeSlug } from '../../src/lib/format';

beforeEach(() => localStorage.clear());

describe('비동기 계약', () => {
  it('모든 메서드는 Promise 반환', () => {
    expect(dataClient.getLaws('법무')).toBeInstanceOf(Promise);
    expect(dataClient.getSaved()).toBeInstanceOf(Promise);
  });
});

describe('getLaws / getCases', () => {
  it('법무 법령 12건 / 세무 11건', async () => {
    expect(await dataClient.getLaws('법무')).toHaveLength(12);
    expect(await dataClient.getLaws('세무')).toHaveLength(11);
  });
  it('법무 판례 10건 / 세무 6건', async () => {
    expect(await dataClient.getCases('법무')).toHaveLength(10);
    expect(await dataClient.getCases('세무')).toHaveLength(6);
  });
  it('목록 항목은 id를 가짐', async () => {
    const laws = await dataClient.getLaws('법무');
    expect(laws.every(l => typeof l.id === 'string' && l.id.length > 0)).toBe(true);
  });
});

describe('getLaw 폴백', () => {
  it('전문 있는 법령은 isStub=false 전체 상세', async () => {
    const law = await dataClient.getLaw('법무', makeSlug('주택임대차보호법'));
    expect(law.name).toBe('주택임대차보호법');
    expect(law.isStub).toBe(false);
    expect(law.articles.length).toBeGreaterThan(0);
  });
  it('전문 없는 목록 법령은 isStub=true 스텁(목록 데이터 채움)', async () => {
    const law = await dataClient.getLaw('법무', makeSlug('민법'));
    expect(law.name).toBe('민법');
    expect(law.isStub).toBe(true);
    expect(law.articles).toEqual([]);
  });
  it('교차 팀 id 우선: 법무 팀이어도 소득세법 id면 소득세법 반환', async () => {
    const law = await dataClient.getLaw('법무', makeSlug('소득세법'));
    expect(law.name).toBe('소득세법');
    expect(law.team).toBe('세무');
    expect(law.isStub).toBe(false);
  });
  it('엉뚱한 id → 팀 대표 법령', async () => {
    const law = await dataClient.getLaw('법무', 'does-not-exist-xyz');
    expect(law.name).toBe('주택임대차보호법');
  });
});

describe('getCase 폴백', () => {
  it('전문 있는 판례는 isStub=false', async () => {
    const c = await dataClient.getCase('법무', '2022다272053');
    expect(c.number).toBe('2022다272053');
    expect(c.isStub).toBe(false);
    expect(c.holdings.length).toBeGreaterThan(0);
  });
  it('전문 없는 판례는 스텁(caseType/breadcrumb=field, courtFull=court)', async () => {
    const c = await dataClient.getCase('법무', '2021두45633');
    expect(c.isStub).toBe(true);
    expect(c.caseType).toBe(c.breadcrumb);
    expect(c.courtFull).toBe(c.court);
  });
  it('엉뚱한 id → 팀 대표 판례', async () => {
    const c = await dataClient.getCase('세무', 'nope');
    expect(c.number).toBe('2022두41733');
  });
});

describe('getAnswer (이번 작업 스텁)', () => {
  it('질문과 무관하게 팀 고정 샘플 반환', async () => {
    const a1 = await dataClient.getAnswer('법무', '전세금 질문');
    const a2 = await dataClient.getAnswer('법무', '완전히 다른 질문');
    expect(a1).toEqual(a2);
    expect(a1.text.length).toBeGreaterThan(0);
  });
  it('출처 카드(법령/판례)에 링크용 id 포함', async () => {
    const a = await dataClient.getAnswer('법무', 'q');
    expect(a.sources.laws.length).toBeGreaterThan(0);
    expect(a.sources.laws.every(l => typeof l.id === 'string' && l.id.length > 0)).toBe(true);
    expect(a.sources.cases.every(c => typeof c.id === 'string' && c.id.length > 0)).toBe(true);
  });
  it('근거 건수 = 법령 + 판례 (샘플 3건)', async () => {
    const a = await dataClient.getAnswer('법무', 'q');
    expect(a.sources.laws.length + a.sources.cases.length).toBe(3);
  });
});

describe('보관함 CRUD', () => {
  const item = { id: 'x1', team: '법무' as const, title: 't', summary: 's', date: '2026. 1. 1.' };
  it('addSaved는 앞에 추가(unshift), getSaved로 조회', async () => {
    await dataClient.addSaved(item);
    await dataClient.addSaved({ ...item, id: 'x2' });
    expect((await dataClient.getSaved()).map(s => s.id)).toEqual(['x2', 'x1']);
  });
  it('deleteSaved는 id로 제거', async () => {
    await dataClient.addSaved(item);
    await dataClient.deleteSaved('x1');
    expect(await dataClient.getSaved()).toEqual([]);
  });
});
