import { describe, it, expect } from 'vitest';
import { formatToday, formatSavedDate, summarize, makeSlug, initial, makeId } from '../../src/lib/format';

describe('formatToday (로비 로그인 인사 날짜, KST 무패딩)', () => {
  it('Y년 M월 D일 요일 형식, 월/일 무패딩', () => {
    // 2026-06-29 = 월요일
    const d = new Date('2026-06-29T03:00:00+09:00');
    expect(formatToday(d)).toBe('2026년 6월 29일 월요일');
  });
  it('한 자리 월/일도 패딩하지 않음', () => {
    const d = new Date('2026-01-05T12:00:00+09:00'); // 월요일
    expect(formatToday(d)).toBe('2026년 1월 5일 월요일');
  });
});

describe('formatSavedDate (SavedItem.date, 무패딩)', () => {
  it('"Y. M. D." 무패딩', () => {
    expect(formatSavedDate(new Date('2026-06-05T12:00:00+09:00'))).toBe('2026. 6. 5.');
  });
});

describe('summarize (답변 요약: 개행→공백, 120자 경계)', () => {
  it('개행을 공백으로 치환하고 trim', () => {
    expect(summarize('첫줄\n\n둘째줄  ')).toBe('첫줄 둘째줄');
  });
  it('120자 이하면 … 안 붙음', () => {
    const s = '가'.repeat(120);
    expect(summarize(s)).toBe(s);
  });
  it('120자 초과면 120자 slice + …', () => {
    const s = '가'.repeat(130);
    const out = summarize(s);
    expect(out).toBe('가'.repeat(120) + '…');
    expect(out.length).toBe(121);
  });
});

describe('makeSlug (법령명 → 안정 slug)', () => {
  it('알려진 법령은 고정 slug', () => {
    expect(makeSlug('주택임대차보호법')).toBe('housing-lease');
    expect(makeSlug('소득세법')).toBe('income-tax');
  });
  it('같은 입력은 항상 같은 slug (안정성)', () => {
    expect(makeSlug('민법')).toBe(makeSlug('민법'));
  });
  it('빈 문자열이 아닌 slug 반환', () => {
    expect(makeSlug('형법').length).toBeGreaterThan(0);
  });
});

describe('initial (아바타 이니셜, 코드포인트 안전)', () => {
  it('한글 이름 첫 글자', () => {
    expect(initial('김리걸')).toBe('김');
  });
  it('이모지/astral 문자 안전(서러게이트 반쪽 아님)', () => {
    expect(initial('😊리걸')).toBe('😊');
  });
  it('빈 문자열 → 빈 문자열', () => {
    expect(initial('')).toBe('');
  });
});

describe('makeId (SavedItem.id)', () => {
  it('호출마다 유니크', () => {
    expect(makeId()).not.toBe(makeId());
  });
});
