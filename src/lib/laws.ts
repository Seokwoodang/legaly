import type { LawListItem, LawSort } from '../types';

export function filterLaws(data: LawListItem[], field: string, query: string): LawListItem[] {
  const q = query.trim();
  return data.filter(d => (field === '전체' || d.field === field) && (q === '' || d.name.includes(q)));
}

export function sortLaws(rows: LawListItem[], sort: LawSort): LawListItem[] {
  const copy = [...rows];
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  else copy.sort((a, b) => b.date.localeCompare(a.date));
  return copy;
}
