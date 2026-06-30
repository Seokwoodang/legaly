import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, seedUser, seedTeam } from '../test-utils';

beforeEach(() => localStorage.clear());

describe('상담 (D)', () => {
  it('마운트 시 팀 인사말 + 추천칩 3개', async () => {
    renderApp('/consult');
    expect(await screen.findByText(/법무팀입니다/)).toBeInTheDocument();
    expect(screen.getByText('상속 포기는 어떻게 신청하나요?')).toBeInTheDocument();
  });

  it('로그인 상태: 전송 시 사용자 메시지 + 답변(출처 포함) 추가', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/consult');
    const ta = await screen.findByRole('textbox');
    await user.type(ta, '전세 보증금 못 받았어요');
    await user.click(screen.getByRole('button', { name: '전송' }));
    expect(await screen.findByText('전세 보증금 못 받았어요')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /근거.*접기|근거 접기/ })).toBeInTheDocument();
  });

  it('빈 입력은 전송 무시', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/consult');
    const send = await screen.findByRole('button', { name: '전송' });
    await user.click(send);
    expect(screen.queryByRole('button', { name: /이 상담 저장하기/ })).toBeNull();
  });

  it('Shift+Enter는 줄바꿈(전송 안 함)', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/consult');
    const ta = await screen.findByRole('textbox');
    await user.type(ta, '첫줄{Shift>}{Enter}{/Shift}둘째줄');
    expect((ta as HTMLTextAreaElement).value).toContain('\n');
  });

  it('근거 토글 펼침/접기', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/consult');
    const ta = await screen.findByRole('textbox');
    await user.type(ta, '질문');
    await user.click(screen.getByRole('button', { name: '전송' }));
    const toggle = await screen.findByRole('button', { name: /근거/ });
    await user.click(toggle); // 접기
    await user.click(toggle); // 다시 펼침
    expect(await screen.findByText('근거 법령·예규')).toBeInTheDocument();
  });

  it('AI 로그인 필수: 비로그인 전송 → 로그인 유도 → 로그인 후 자동 전송', async () => {
    const user = userEvent.setup();
    renderApp('/consult');
    const ta = await screen.findByRole('textbox');
    await user.type(ta, '전세 보증금 못 받았어요');
    await user.click(screen.getByRole('button', { name: '전송' }));
    // 로그인 모달 등장(전송 전 게이트)
    await user.type(await screen.findByPlaceholderText('예) 김리걸'), '김리걸');
    await user.click(screen.getByRole('button', { name: '시작하기' }));
    // 로그인 후 보류 질문 자동 전송
    expect(await screen.findByText('전세 보증금 못 받았어요')).toBeInTheDocument();
  });

  it('로그인 상태 저장 → 버튼 "보관함에 저장됨"으로 전환', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/consult');
    const ta = await screen.findByRole('textbox');
    await user.type(ta, '질문');
    await user.click(screen.getByRole('button', { name: '전송' }));
    await user.click(await screen.findByRole('button', { name: '이 상담 저장하기' }));
    expect(await screen.findByText('보관함에 저장됨')).toBeInTheDocument();
  });

  it('팀 전환 시 대화가 새 팀 인사말로 리셋', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/consult');
    const ta = await screen.findByRole('textbox');
    await user.type(ta, '질문');
    await user.click(screen.getByRole('button', { name: '전송' }));
    await screen.findByText('질문');
    await user.click(screen.getByRole('button', { name: /세무팀/ }));
    await waitFor(() => expect(screen.queryByText('질문')).toBeNull());
    expect(await screen.findByText(/세무팀입니다/)).toBeInTheDocument();
  });

  it('로그인 상태에서 pendingQ가 있으면 마운트 후 자동 전송(1회)', async () => {
    seedUser('김리걸');
    seedTeam('법무');
    localStorage.setItem('legaly.pendingQ', '자동 전송 질문');
    renderApp('/consult');
    expect(await screen.findByText('자동 전송 질문')).toBeInTheDocument();
    expect(localStorage.getItem('legaly.pendingQ')).toBeNull();
  });
});
