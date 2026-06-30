import { describe, it, expect } from 'vitest';
import { filterLaws, sortLaws } from '../../src/lib/laws';
import type { LawListItem } from '../../src/types';

const mk = (name: string, field: string, date: string): LawListItem =>
  ({ id: name, name, field, ministry: '법무부', date, glyph: '法', kind: '법령' });

const data: LawListItem[] = [
  mk('민법', '민사', '2024. 05. 17.'),
  mk('형법', '형사', '2024. 02. 09.'),
  mk('주택임대차보호법', '부동산', '2023. 07. 19.'),
  mk('상법', '상사', '2025. 01. 31.'),
];

describe('filterLaws', () => {
  it("field '전체'면 전부", () => {
    expect(filterLaws(data, '전체', '')).toHaveLength(4);
  });
  it('분야 필터', () => {
    expect(filterLaws(data, '형사', '').map(d => d.name)).toEqual(['형법']);
  });
  it('검색은 name.includes', () => {
    expect(filterLaws(data, '전체', '임대차').map(d => d.name)).toEqual(['주택임대차보호법']);
  });
  it('검색어 앞뒤 공백 trim', () => {
    expect(filterLaws(data, '전체', '  민법  ').map(d => d.name)).toEqual(['민법']);
  });
  it('분야+검색 동시(AND)', () => {
    expect(filterLaws(data, '민사', '형')).toHaveLength(0);
  });
  it('일치 없으면 빈 배열', () => {
    expect(filterLaws(data, '전체', 'zzz')).toEqual([]);
  });
});

describe('sortLaws', () => {
  it('name: 가나다순(ko)', () => {
    expect(sortLaws(data, 'name').map(d => d.name)).toEqual(['민법', '상법', '주택임대차보호법', '형법']);
  });
  it('date: 시행일 내림차순', () => {
    expect(sortLaws(data, 'date').map(d => d.date)).toEqual([
      '2025. 01. 31.', '2024. 05. 17.', '2024. 02. 09.', '2023. 07. 19.',
    ]);
  });
  it('동률 날짜는 입력 순서 유지(안정)', () => {
    const tied = [mk('가법', '민사', '2025. 01. 01.'), mk('나법', '민사', '2025. 01. 01.')];
    expect(sortLaws(tied, 'date').map(d => d.name)).toEqual(['가법', '나법']);
  });
  it('원본 배열 비변형', () => {
    const copy = [...data];
    sortLaws(data, 'name');
    expect(data).toEqual(copy);
  });
});
