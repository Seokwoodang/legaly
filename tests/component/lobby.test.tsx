import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, seedUser } from '../test-utils';

beforeEach(() => localStorage.clear());

describe('로비 v2 (L)', () => {
  it('비로그인 히어로 카피', async () => {
    renderApp('/');
    expect(await screen.findByText(/혼자 막막하지 않게/)).toBeInTheDocument();
  });

  it('로그인 히어로 개인화', async () => {
    seedUser('김리걸');
    renderApp('/');
    expect(await screen.findByRole('heading', { name: '김리걸님, 무엇을 도와드릴까요?' })).toBeInTheDocument();
  });

  it('질문 박스: 팀 선택 + 입력 + 물어보기 → 상담 자동 전송', async () => {
    seedUser('김리걸');
    const user = userEvent.setup();
    renderApp('/');
    await user.click(await screen.findByRole('button', { name: /세무팀/ }));
    await user.type(screen.getByRole('textbox'), '부가세 신고를 놓쳤어요');
    await user.click(screen.getByRole('button', { name: /물어보기/ }));
    expect(localStorage.getItem('legaly.team')).toBe('세무');
    expect(await screen.findByText('부가세 신고를 놓쳤어요')).toBeInTheDocument();
  });

  it('예시 칩 클릭 → 입력란 채움(전송 아님)', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(await screen.findByText('전세 보증금을 못 받고 있어요'));
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('전세 보증금을 못 받고 있어요');
  });

  it('분야 카드 클릭 → 해당 분야 가이드 목록으로', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(await screen.findByRole('link', { name: '형사 법무팀' }));
    expect(await screen.findByText('고소·고발 절차')).toBeInTheDocument();
    expect(localStorage.getItem('legaly.team')).toBe('법무');
  });

  it('자주 찾는 가이드 카드 클릭 → 가이드 상세로', async () => {
    const user = userEvent.setup();
    renderApp('/');
    // featured 영역의 "전세보증금 돌려받기"
    await user.click(await screen.findByText('전세보증금 돌려받기'));
    expect(await screen.findByRole('heading', { name: '단계별 절차' })).toBeInTheDocument();
  });

  it('보관함 미리보기·팀 카드는 더 이상 로비에 없음', async () => {
    seedUser('김리걸');
    renderApp('/');
    await screen.findByRole('heading', { name: /무엇을 도와드릴까요/ });
    expect(screen.queryByText('나의 법무팀')).toBeNull();
    expect(screen.queryByText('지금 상담 대기 중')).toBeNull();
  });
});
