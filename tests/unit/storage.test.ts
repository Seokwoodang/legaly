import { describe, it, expect, beforeEach } from 'vitest';
import {
  KEYS, getTeam, setTeam, getUser, setUser, clearUser,
  getSaved, setSaved, takePendingQ, setPendingQ,
} from '../../src/lib/storage';
import type { SavedItem } from '../../src/types';

beforeEach(() => localStorage.clear());

describe('team', () => {
  it('없으면 기본 법무', () => expect(getTeam()).toBe('법무'));
  it('비정상 값 → 법무', () => {
    localStorage.setItem(KEYS.team, 'xxx');
    expect(getTeam()).toBe('법무');
  });
  it('set/get 왕복', () => { setTeam('세무'); expect(getTeam()).toBe('세무'); });
});

describe('user', () => {
  it('없으면 null', () => expect(getUser()).toBeNull());
  it('JSON 깨지면 null', () => {
    localStorage.setItem(KEYS.user, '{not json');
    expect(getUser()).toBeNull();
  });
  it('set/clear', () => {
    setUser({ name: '김리걸' });
    expect(getUser()).toEqual({ name: '김리걸' });
    clearUser();
    expect(getUser()).toBeNull();
  });
  it('clearUser는 saved/team을 지우지 않음', () => {
    setTeam('세무');
    setSaved([{ id: 'a', team: '법무', title: 't', summary: 's', date: '2026. 1. 1.' }]);
    setUser({ name: 'x' });
    clearUser();
    expect(getTeam()).toBe('세무');
    expect(getSaved()).toHaveLength(1);
  });
});

describe('saved', () => {
  const item: SavedItem = { id: 'a', team: '법무', title: 't', summary: 's', date: '2026. 1. 1.' };
  it('없으면 []', () => expect(getSaved()).toEqual([]));
  it('JSON 깨지면 []', () => {
    localStorage.setItem(KEYS.saved, 'broken');
    expect(getSaved()).toEqual([]);
  });
  it('필수 필드 없는 항목은 읽기 시 제거', () => {
    localStorage.setItem(KEYS.saved, JSON.stringify([item, { id: 'b' }, { foo: 1 }]));
    expect(getSaved()).toEqual([item]);
  });
  it('team 미상 항목은 버리지 않고 법무로 보정해 유지 (R4)', () => {
    localStorage.setItem(KEYS.saved, JSON.stringify([
      { id: 'x', team: '법률', title: 't', summary: 's', date: '2026. 1. 1.' },
    ]));
    const out = getSaved();
    expect(out).toHaveLength(1);
    expect(out[0].team).toBe('법무');
  });
  it('set/get 왕복', () => { setSaved([item]); expect(getSaved()).toEqual([item]); });
});

describe('pendingQ', () => {
  it('없으면 null', () => expect(takePendingQ()).toBeNull());
  it('공백만 있으면 null로 처리', () => {
    setPendingQ('   ');
    expect(takePendingQ()).toBeNull();
  });
  it('읽으면 제거됨(1회성)', () => {
    setPendingQ('질문');
    expect(takePendingQ()).toBe('질문');
    expect(takePendingQ()).toBeNull();
  });
});

describe('키 상수', () => {
  it('정확한 localStorage 키', () => {
    expect(KEYS).toEqual({
      team: 'legaly.team', user: 'legaly.user',
      saved: 'legaly.saved', pendingQ: 'legaly.pendingQ',
    });
  });
});
