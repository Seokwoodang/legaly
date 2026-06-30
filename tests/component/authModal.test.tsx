import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test-utils';

beforeEach(() => localStorage.clear());

describe('인증 모달 (B1)', () => {
  it('로비 로그인 버튼 → generic 변형 "리걸리 시작하기"', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getAllByRole('button', { name: '로그인' })[0]);
    expect(await screen.findByRole('heading', { name: '리걸리 시작하기' })).toBeInTheDocument();
  });

  it('빈 이름 제출 → "고객"으로 로그인', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getAllByRole('button', { name: '로그인' })[0]);
    await user.click(screen.getByRole('button', { name: '시작하기' }));
    expect(await screen.findByRole('heading', { name: '고객님, 무엇을 도와드릴까요?' })).toBeInTheDocument();
  });

  it('이름 입력 후 Enter 제출', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getAllByRole('button', { name: '로그인' })[0]);
    const input = await screen.findByPlaceholderText('예) 김리걸');
    await user.type(input, '박변호{Enter}');
    expect(await screen.findByRole('heading', { name: '박변호님, 무엇을 도와드릴까요?' })).toBeInTheDocument();
  });

  it('Esc로 닫힘', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getAllByRole('button', { name: '로그인' })[0]);
    await screen.findByRole('heading', { name: '리걸리 시작하기' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('heading', { name: '리걸리 시작하기' })).toBeNull());
  });

  it('상담 페이지: 비로그인 전송 시 로그인 모달 등장(AI 로그인 게이트)', async () => {
    const user = userEvent.setup();
    renderApp('/consult');
    const send = await screen.findByRole('button', { name: '전송' });
    await user.type(screen.getByRole('textbox'), '질문입니다');
    await user.click(send);
    expect(await screen.findByRole('heading', { name: '리걸리 시작하기' })).toBeInTheDocument();
  });
});
