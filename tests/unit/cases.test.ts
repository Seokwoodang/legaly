import { describe, it, expect } from 'vitest';
import { filterCases, sortCases } from '../../src/lib/cases';
import type { CaseListItem } from '../../src/types';

const mk = (name: string, number: string, court: string, field: string, date: string): CaseListItem =>
  ({ id: number, name, number, court, field, date });

const data: CaseListItem[] = [
  mk('임대차보증금 반환', '2022다272053', '대법원', '민사', '2022. 04. 28.'),
  mk('통상임금', '2017다56226', '대법원(전합)', '노동', '2021. 12. 22.'),
  mk('부당해고 구제', '2021두45633', '대법원', '노동', '2021. 11. 11.'),
];

describe('filterCases', () => {
  it("field/court '전체'면 전부", () => {
    expect(filterCases(data, '전체', '전체', '')).toHaveLength(3);
  });
  it('법원 필터는 value 문자열로 매칭', () => {
    expect(filterCases(data, '전체', '대법원(전합)', '').map(d => d.number)).toEqual(['2017다56226']);
  });
  it('검색은 사건명 OR 사건번호', () => {
    expect(filterCases(data, '전체', '전체', '2021두').map(d => d.number)).toEqual(['2021두45633']);
    expect(filterCases(data, '전체', '전체', '통상임금').map(d => d.number)).toEqual(['2017다56226']);
  });
  it('분야+법원+검색 동시(AND)', () => {
    expect(filterCases(data, '노동', '대법원', '해고').map(d => d.number)).toEqual(['2021두45633']);
  });
  it('검색어 trim', () => {
    expect(filterCases(data, '전체', '전체', '  임대차 ')).toHaveLength(1);
  });
});

describe('sortCases', () => {
  it('new: 선고일 최신순', () => {
    expect(sortCases(data, 'new').map(d => d.date)).toEqual([
      '2022. 04. 28.', '2021. 12. 22.', '2021. 11. 11.',
    ]);
  });
  it('old: 오래된순', () => {
    expect(sortCases(data, 'old').map(d => d.date)).toEqual([
      '2021. 11. 11.', '2021. 12. 22.', '2022. 04. 28.',
    ]);
  });
  it('동률 안정 정렬', () => {
    const tied = [mk('A', 'n1', '대법원', '민사', '2022. 01. 01.'), mk('B', 'n2', '대법원', '민사', '2022. 01. 01.')];
    expect(sortCases(tied, 'new').map(d => d.name)).toEqual(['A', 'B']);
  });
});
