import type { CaseListItem, CaseSort, CourtFilter } from '../types';

export function filterCases(
  data: CaseListItem[], field: string, court: CourtFilter, query: string,
): CaseListItem[] {
  const q = query.trim();
  return data.filter(d =>
    (field === '전체' || d.field === field) &&
    (court === '전체' || d.court === court) &&
    (q === '' || d.name.includes(q) || d.number.includes(q)),
  );
}

export function sortCases(rows: CaseListItem[], sort: CaseSort): CaseListItem[] {
  const copy = [...rows];
  copy.sort((a, b) => (sort === 'new' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  return copy;
}
