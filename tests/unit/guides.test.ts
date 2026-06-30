import { describe, it, expect, beforeEach } from 'vitest';
import { GUIDES, FIELD_TINT, FIELDIC, FEATURED_IDS, LOBBY_FIELDS } from '../../src/lib/guidesData';
import { dataClient } from '../../src/lib/dataClient';
import { makeSlug } from '../../src/lib/format';

describe('가이드 데이터 (J/K)', () => {
  it('총 10개 (법무 7 / 세무 3)', () => {
    expect(GUIDES).toHaveLength(10);
    expect(GUIDES.filter(g => g.team === '법무')).toHaveLength(7);
    expect(GUIDES.filter(g => g.team === '세무')).toHaveLength(3);
  });
  it('각 가이드는 단계·근거법령을 가짐', () => {
    expect(GUIDES.every(g => g.steps.length > 0 && g.laws.length > 0)).toBe(true);
  });
  it('근거 법령에 lawId(slug), 판례에 caseId(번호) 매핑', () => {
    const dep = GUIDES.find(g => g.id === 'deposit-return')!;
    expect(dep.laws[0].lawId).toBe(makeSlug(dep.laws[0].title));
    expect(dep.laws.find(l => l.title === '주택임대차보호법')!.lawId).toBe('housing-lease');
    expect(dep.cases![0].caseId).toBe(dep.cases![0].number);
  });
  it('featured 6개 순서 고정', () => {
    expect(FEATURED_IDS).toEqual(['deposit-return', 'unfair-dismissal', 'criminal-complaint', 'income-tax', 'inheritance-renounce', 'capital-gains']);
    expect(FEATURED_IDS.every(id => GUIDES.some(g => g.id === id))).toBe(true);
  });
  it('로비 분야 8개', () => {
    expect(LOBBY_FIELDS).toHaveLength(8);
    expect(LOBBY_FIELDS.map(f => f.field)).toContain('형사');
  });
});

describe('FIELD_TINT / FIELDIC', () => {
  it('주요 분야 틴트 존재', () => {
    expect(FIELD_TINT['형사']).toMatchObject({ bg: expect.any(String), fg: expect.any(String) });
    expect(FIELD_TINT['소득세'].fg).toBe('#157a57');
  });
  it('목록 분야→아이콘 매핑(예규/국세일반 포함)', () => {
    expect(FIELDIC['민사']).toBe('file');
    expect(FIELDIC['국세일반']).toBeTruthy();
  });
});

describe('dataClient 가이드', () => {
  beforeEach(() => localStorage.clear());
  it('getGuides 팀 필터', async () => {
    expect(await dataClient.getGuides('세무')).toHaveLength(3);
  });
  it('getGuide id로 조회', async () => {
    const g = await dataClient.getGuide('법무', 'deposit-return');
    expect(g?.title).toBe('전세보증금 돌려받기');
  });
  it('getGuide 미상 id → 팀 첫 가이드', async () => {
    const g = await dataClient.getGuide('세무', 'nope');
    expect(g?.team).toBe('세무');
  });
});
