import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, seedUser } from '../test-utils';

beforeEach(() => localStorage.clear());

describe('계정 영역 / 드롭다운 (B)', () => {
  it('로그인 시 pill + 드롭다운(내 보관함/로그아웃)', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/laws');
    await user.click(await screen.findByRole('button', { name: /김리걸님/ }));
    expect(await screen.findByRole('link', { name: '내 보관함' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  it('/saved 에서는 드롭다운 첫 항목이 "홈으로"', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/saved');
    await user.click(await screen.findByRole('button', { name: /김리걸님/ }));
    expect(await screen.findByRole('link', { name: '홈으로' })).toBeInTheDocument();
  });

  it('로그아웃 → user만 제거(로그인 버튼 복귀)', async () => {
    seedUser('김리걸');
    localStorage.setItem('legaly.saved', JSON.stringify([{ id: '1', team: '법무', title: 't', summary: 's', date: '2026. 1. 1.' }]));
    const user = userEvent.setup();
    renderApp('/laws');
    await user.click(await screen.findByRole('button', { name: /김리걸님/ }));
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(localStorage.getItem('legaly.user')).toBeNull();
    expect(localStorage.getItem('legaly.saved')).not.toBeNull(); // saved 유지
  });

  it('드롭다운 바깥 클릭 시 닫힘', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/laws');
    await user.click(await screen.findByRole('button', { name: /김리걸님/ }));
    await screen.findByRole('button', { name: '로그아웃' });
    await user.click(document.body);
    await waitFor(() => expect(screen.queryByRole('button', { name: '로그아웃' })).toBeNull());
  });
});
