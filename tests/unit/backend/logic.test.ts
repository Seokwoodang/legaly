import { describe, it, expect } from 'vitest';
import { idToEmail, isValidTeam } from '../../../supabase/functions/_shared/ids';
import { statusFor, errorBody, ApiError } from '../../../supabase/functions/_shared/errors';
import { tokenize, scoreDoc, retrieve } from '../../../supabase/functions/_shared/retrieve';
import { buildAnswerMessages } from '../../../supabase/functions/_shared/prompt';
import { buildLawUrl, buildSearchUrl, parseLaw, parseCase, parseLawSearchId, parseCaseSearchId } from '../../../supabase/functions/_shared/lawApi';
import { LAW_LIST, CASE_LIST } from '../../../supabase/functions/_shared/corpus';
import { buildSeedRows, splitMatches, mergeSources } from '../../../supabase/functions/_shared/embed';

describe('ids', () => {
  it('아이디 → @legaly.app 이메일', () => {
    expect(idToEmail('swoo1427')).toBe('swoo1427@legaly.app');
    expect(idToEmail('  SQUFACE ')).toBe('squface@legaly.app'); // trim+소문자
  });
  it('isValidTeam', () => {
    expect(isValidTeam('법무')).toBe(true);
    expect(isValidTeam('세무')).toBe(true);
    expect(isValidTeam('xxx')).toBe(false);
  });
});

describe('errors (에러 모델)', () => {
  it('코드→상태 매핑', () => {
    expect(statusFor('UNAUTHENTICATED')).toBe(401);
    expect(statusFor('VALIDATION')).toBe(400);
    expect(statusFor('NOT_FOUND')).toBe(404);
    expect(statusFor('RATE_LIMITED')).toBe(429);
    expect(statusFor('UPSTREAM_TIMEOUT')).toBe(504);
    expect(statusFor('UPSTREAM_ERROR')).toBe(502);
    expect(statusFor('INTERNAL')).toBe(500);
  });
  it('errorBody 형태', () => {
    expect(errorBody('VALIDATION', '잘못된 요청')).toEqual({ error: { code: 'VALIDATION', message: '잘못된 요청' } });
  });
  it('ApiError는 code 보유', () => {
    expect(new ApiError('NOT_FOUND', '없음').code).toBe('NOT_FOUND');
  });
});

describe('retrieve (키워드 RAG 검색)', () => {
  it('tokenize: 2자+ 토큰, 빈/짧은 토큰 제거', () => {
    const t = tokenize('전세 보증금을 못 받고 있어요');
    expect(t).toContain('전세');
    expect(t).toContain('보증금을');
    expect(t).not.toContain('못'); // 1자 제거
  });
  it('scoreDoc: 토큰이 텍스트와 겹칠수록 점수↑', () => {
    const s1 = scoreDoc(['전세', '보증금'], '전세 보증금 임대차 대항력');
    const s0 = scoreDoc(['양도', '세금'], '전세 보증금 임대차 대항력');
    expect(s1).toBeGreaterThan(s0);
  });
  it('법무 전세 질문 → 주택임대차보호법이 근거 법령에', () => {
    const r = retrieve('법무', '전세 계약이 끝났는데 보증금을 못 받고 있어요');
    expect(r.laws.map(l => l.title)).toContain('주택임대차보호법');
    expect(r.laws.length).toBeLessThanOrEqual(3);
    expect(r.cases.length).toBeLessThanOrEqual(2);
  });
  it('세무 경비 질문 → 소득세법이 근거 법령에', () => {
    const r = retrieve('세무', '프리랜서 종합소득세 경비 처리가 궁금해요');
    expect(r.laws.map(l => l.title)).toContain('소득세법');
  });
  it('매칭 0건이어도 빈 sources 반환(throw 안 함)', () => {
    const r = retrieve('법무', 'zzzqqq 없는단어');
    expect(Array.isArray(r.laws)).toBe(true);
    expect(Array.isArray(r.cases)).toBe(true);
  });
  it('citation은 링크용 id 보유', () => {
    const r = retrieve('법무', '전세 보증금 대항력');
    expect(r.laws.every(l => typeof l.id === 'string' && l.id.length > 0)).toBe(true);
  });
});

describe('prompt (Claude 메시지 빌더)', () => {
  it('팀 페르소나 + 질문 + 출처 컨텍스트 포함', () => {
    const sources = { laws: [{ id: 'housing-lease', title: '주택임대차보호법', article: '제3조의3', body: '...' }], cases: [] };
    const m = buildAnswerMessages('법무', '보증금 못 받았어요', sources);
    expect(m.system).toContain('법무팀');
    expect(m.user).toContain('보증금 못 받았어요');
    expect(m.user).toContain('주택임대차보호법'); // 출처가 컨텍스트로
  });
  it('세무 페르소나', () => {
    const m = buildAnswerMessages('세무', 'q', { laws: [], cases: [] });
    expect(m.system).toContain('세무팀');
  });
});

describe('lawApi.buildLawUrl', () => {
  it('법령 본문 URL(OC·target·ID 포함)', () => {
    const u = buildLawUrl('law', '001234', 'test-oc');
    expect(u).toContain('OC=test-oc');
    expect(u).toContain('target=law');
    expect(u).toContain('001234');
  });
  it('판례 URL(target=prec)', () => {
    expect(buildLawUrl('prec', '2022다272053', 'test-oc')).toContain('target=prec');
  });
});

describe('lawApi 검색-우선 (실 전문)', () => {
  it('buildSearchUrl: 법령은 query, 판례는 nb(사건번호)', () => {
    expect(buildSearchUrl('law', '주택임대차보호법', 'oc')).toContain('lawSearch.do');
    expect(buildSearchUrl('law', '주택임대차보호법', 'oc')).toContain('query=');
    expect(buildSearchUrl('prec', '2017다56226', 'oc')).toMatch(/target=prec.*nb=/);
  });
  it('parseLawSearchId: 정확 법령명 우선 매칭(시행령 제외)', () => {
    const json = { LawSearch: { law: [
      { 법령명한글: '주택임대차보호법', 법령일련번호: '276291' },
      { 법령명한글: '주택임대차보호법 시행령', 법령일련번호: '280995' },
    ] } };
    expect(parseLawSearchId(json, '주택임대차보호법')).toBe('276291');
  });
  it('parseLawSearchId: 결과 없으면 null', () => {
    expect(parseLawSearchId({ LawSearch: { totalCnt: 0 } }, '없는법')).toBeNull();
  });
  it('parseCaseSearchId: 판례일련번호 추출', () => {
    const json = { PrecSearch: { prec: [{ 사건번호: '2017다56226', 판례일련번호: '217321' }] } };
    expect(parseCaseSearchId(json)).toBe('217321');
  });
  it('parseLaw: 가지번호(제N조의M)·항 본문 결합, 시행일자 포맷', () => {
    const json = { 법령: {
      기본정보: { 법령명_한글: '주택임대차보호법', 시행일자: '20260102', 공포번호: '20429' },
      조문: { 조문단위: [
        { 조문번호: '1', 조문여부: '조문', 조문제목: '목적', 조문내용: '제1조(목적) 이 법은 주거용 건물의 임대차에 관한 특례를 규정한다.' },
        { 조문번호: '3', 조문가지번호: '2', 조문여부: '조문', 조문제목: '보증금의 회수', 조문내용: '제3조의2(보증금의 회수)', 항: [{ 항내용: '① 임차인이 보증금반환청구소송의 확정판결에 따라 …' }] },
      ] },
    } };
    const p = parseLaw(json);
    expect(p.name).toBe('주택임대차보호법');
    expect(p.effDate).toBe('2026. 01. 02.');
    expect(p.articles[0].num).toBe('제1조');
    expect(p.articles[1].num).toBe('제3조의2');         // 가지번호 반영
    expect(p.articles[1].body).toContain('① 임차인');    // 항 본문 결합
    expect(p.articles[1].body).not.toMatch(/^제3조의2\(보증금의 회수\)$/); // 머리표기 중복 제거
  });
  it('parseCase: HTML 제거 + [n] 단위 분리', () => {
    const json = { PrecService: {
      사건명: '손해배상(기)', 법원명: '대법원', 선고일자: '20240725',
      판시사항: '<br/> [1] 첫 번째 쟁점<br/> [2] 두 번째 쟁점',
      판결요지: '[1] 첫 요지 [2] 둘째 요지',
    } };
    const p = parseCase(json);
    expect(p.name).toBe('손해배상(기)');
    expect(p.date).toBe('2024. 07. 25.');
    expect(p.issues.length).toBe(2);
    expect(p.issues[0]).not.toContain('<br');
    expect(p.holdings[0].tag).toBe('[1]');
    expect(p.holdings[1].tag).toBe('[2]');
  });
});

describe('embed (임베딩 RAG)', () => {
  it('buildSeedRows: 법무+세무 법령·판례 전 항목, content/payload 보유', () => {
    const rows = buildSeedRows();
    // 법령 23(12+11) + 판례 16(10+6) = 39
    expect(rows.length).toBe(LAW_LIST['법무'].length + LAW_LIST['세무'].length + CASE_LIST['법무'].length + CASE_LIST['세무'].length);
    const law = rows.find(r => r.kind === 'law' && r.ref_id === 'housing-lease')!;
    expect(law.content).toContain('주택임대차보호법');
    expect((law.payload as any).title).toBe('주택임대차보호법');
    const cas = rows.find(r => r.kind === 'case')!;
    expect((cas.payload as any).number).toBeTruthy();
    expect(rows.every(r => r.content.length > 0 && r.team && r.ref_id)).toBe(true);
  });
  it('splitMatches: kind별 분배 + 상한(laws≤3, cases≤2), 순서 보존', () => {
    const rows = [
      { kind: 'law', payload: { id: 'a', title: 'A' } },
      { kind: 'case', payload: { id: 'c1', name: 'C1' } },
      { kind: 'law', payload: { id: 'b', title: 'B' } },
      { kind: 'law', payload: { id: 'c', title: 'C' } },
      { kind: 'law', payload: { id: 'd', title: 'D' } }, // 4번째 법령 → 잘림
      { kind: 'case', payload: { id: 'c2', name: 'C2' } },
      { kind: 'case', payload: { id: 'c3', name: 'C3' } }, // 3번째 판례 → 잘림
    ];
    const s = splitMatches(rows);
    expect(s.laws.map(l => (l as any).id)).toEqual(['a', 'b', 'c']);
    expect(s.cases.map(c => (c as any).id)).toEqual(['c1', 'c2']);
  });
  it('splitMatches: 빈 입력 안전', () => {
    expect(splitMatches([])).toEqual({ laws: [], cases: [] });
  });
  it('mergeSources: 키워드 우선 + 벡터로 빈 슬롯 채움, id 중복 제거', () => {
    const keyword = { laws: [{ id: 'housing-lease', title: '주택임대차보호법', article: '', body: '' }], cases: [] };
    const vector = {
      laws: [
        { id: 'housing-lease', title: '주택임대차보호법', article: '', body: '' }, // 중복 → 제거
        { id: 'civil', title: '민법', article: '', body: '' },                      // 보강
      ],
      cases: [{ id: '2022다272053', name: '임대차보증금 반환', number: '2022다272053', court: '대법원', date: '', summary: '' }],
    };
    const m = mergeSources(keyword, vector);
    expect(m.laws.map(l => l.id)).toEqual(['housing-lease', 'civil']); // 키워드가 앞, 중복 1회
    expect(m.cases.map(c => c.id)).toEqual(['2022다272053']);          // 키워드 0건 → 벡터로 채움
  });
  it('mergeSources: 키워드 단독보다 결코 나빠지지 않음(키워드 항목 항상 포함)', () => {
    const keyword = { laws: [{ id: 'income-tax', title: '소득세법', article: '', body: '' }], cases: [] };
    const m = mergeSources(keyword, { laws: [], cases: [] });
    expect(m.laws.map(l => l.id)).toContain('income-tax');
  });
});

describe('corpus (큐레이션 목록)', () => {
  it('법무 법령 12 / 세무 11', () => {
    expect(LAW_LIST['법무'].length).toBe(12);
    expect(LAW_LIST['세무'].length).toBe(11);
  });
  it('법무 판례 10 / 세무 6', () => {
    expect(CASE_LIST['법무'].length).toBe(10);
    expect(CASE_LIST['세무'].length).toBe(6);
  });
  it('목록 항목은 프론트 타입 필드 보유', () => {
    const l = LAW_LIST['법무'][0];
    expect(l).toMatchObject({ id: expect.any(String), name: expect.any(String), field: expect.any(String), date: expect.any(String) });
  });
});
