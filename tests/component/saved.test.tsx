import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, seedUser, seedSaved } from '../test-utils';

beforeEach(() => localStorage.clear());

const items = [
  { id: '1', team: '법무', title: '법무 질문', summary: '요약1', date: '2026. 1. 1.' },
  { id: '2', team: '세무', title: '세무 질문', summary: '요약2', date: '2026. 1. 2.' },
];

describe('보관함 (G)', () => {
  it('빈 보관함: 점선 빈 상태', async () => {
    renderApp('/saved');
    expect(await screen.findByText('아직 저장된 상담이 없어요')).toBeInTheDocument();
  });

  it('로그인 시 제목 개인화', async () => {
    seedUser('김리걸');
    seedSaved(items);
    renderApp('/saved');
    expect(await screen.findByText('김리걸님의 보관함')).toBeInTheDocument();
  });

  it('필터 pill 총계 + 필터 동작', async () => {
    seedSaved(items);
    const user = userEvent.setup();
    renderApp('/saved');
    expect(await screen.findByRole('button', { name: '전체 2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '법무팀 1' }));
    expect(screen.getByText('법무 질문')).toBeInTheDocument();
    expect(screen.queryByText('세무 질문')).toBeNull();
  });

  it('삭제 → 목록에서 제거 + localStorage 반영', async () => {
    seedSaved([items[0]]);
    const user = userEvent.setup();
    renderApp('/saved');
    await screen.findByText('법무 질문');
    await user.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(screen.queryByText('법무 질문')).toBeNull());
    expect(JSON.parse(localStorage.getItem('legaly.saved')!)).toEqual([]);
  });

  it('이어서 상담하기 → 세무팀 설정 + 상담으로 제목 자동 전송', async () => {
    seedUser('김리걸'); seedSaved([items[1]]);
    const user = userEvent.setup();
    renderApp('/saved');
    await user.click(await screen.findByRole('link', { name: '이어서 상담하기' }));
    expect(localStorage.getItem('legaly.team')).toBe('세무');
    // pendingQ(제목)는 상담 진입 시 소비되어 자동 전송됨
    expect(await screen.findAllByText('세무 질문')).not.toHaveLength(0);
  });

  it('이어서 상담하기 2회차에도 자동 전송됨 (N3 회귀)', async () => {
    seedUser('김리걸'); seedSaved([items[1]]);
    const user = userEvent.setup();
    renderApp('/saved');
    // 1회차
    await user.click(await screen.findByRole('link', { name: '이어서 상담하기' }));
    expect(await screen.findByText('세무 질문')).toBeInTheDocument();
    // 보관함으로 돌아가기 → 2회차
    await user.click(screen.getByRole('link', { name: '보관함' }));
    await user.click(await screen.findByRole('link', { name: '이어서 상담하기' }));
    expect(await screen.findByText('세무 질문')).toBeInTheDocument();
  });
});
