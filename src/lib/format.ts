const KST = 'Asia/Seoul';

function partsKST(d: Date) {
  const fmt = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'long',
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) map[p.type] = p.value;
  return {
    year: map.year.replace(/[^0-9]/g, ''),
    month: map.month.replace(/[^0-9]/g, ''),
    day: map.day.replace(/[^0-9]/g, ''),
    weekday: map.weekday, // "월요일"
  };
}

/** "2026년 6월 29일 월요일" (KST, 무패딩) */
export function formatToday(d: Date): string {
  const p = partsKST(d);
  return `${p.year}년 ${p.month}월 ${p.day}일 ${p.weekday}`;
}

/** "2026. 6. 5." (무패딩) */
export function formatSavedDate(d: Date): string {
  const p = partsKST(d);
  return `${p.year}. ${p.month}. ${p.day}.`;
}

/** 답변 요약: 개행→공백, trim, 120자 초과 시 slice + '…' */
export function summarize(text: string): string {
  const t = text.replace(/\n+/g, ' ').trim();
  return t.length > 120 ? t.slice(0, 120) + '…' : t;
}

const SLUG_MAP: Record<string, string> = {
  주택임대차보호법: 'housing-lease',
  소득세법: 'income-tax',
};

/** 법령명 → 안정 slug. 라우트 파라미터는 디코드되어 들어오므로 인코딩하지 않고
 *  사람이 읽는 원문(공백→하이픈) id를 사용한다(React Router가 URL만 인코딩, 파라미터는 원문 복원). */
export function makeSlug(name: string): string {
  if (SLUG_MAP[name]) return SLUG_MAP[name];
  return name.trim().replace(/\s+/g, '-');
}

/** 아바타 이니셜(코드포인트 안전) */
export function initial(name: string): string {
  return [...name][0] ?? '';
}

export function makeId(): string {
  return crypto.randomUUID();
}
