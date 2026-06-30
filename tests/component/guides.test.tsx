import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, seedTeam, seedUser } from '../test-utils';

beforeEach(() => localStorage.clear());

describe('절차 가이드 목록 (J)', () => {
  it('법무 가이드 목록 렌더 + 서브내비 활성', async () => {
    seedTeam('법무');
    renderApp('/guides');
    expect(await screen.findByText('전세보증금 돌려받기')).toBeInTheDocument();
    expect(screen.getByText('부당해고 대응 절차')).toBeInTheDocument();
  });

  it('분야 칩 필터', async () => {
    const user = userEvent.setup();
    seedTeam('법무');
    renderApp('/guides');
    await user.click(await screen.findByRole('button', { name: '형사' }));
    expect(await screen.findByText('고소·고발 절차')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('전세보증금 돌려받기')).toBeNull());
  });

  it('검색(제목/요약/분야)', async () => {
    const user = userEvent.setup();
    seedTeam('법무');
    renderApp('/guides');
    await user.type(await screen.findByPlaceholderText(/어떤 상황/), '해고');
    expect(await screen.findByText('부당해고 대응 절차')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('협의이혼 절차')).toBeNull());
  });

  it('?field 딥링크로 진입 시 해당 분야 필터', async () => {
    seedTeam('법무');
    renderApp('/guides?field=부동산');
    expect(await screen.findByText('전세보증금 돌려받기')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('고소·고발 절차')).toBeNull());
  });

  it('?field 딥링크 후 팀 전환 시 분야 전체로 리셋 (R1)', async () => {
    const user = userEvent.setup();
    seedTeam('법무');
    renderApp('/guides?field=형사');
    await screen.findByText('고소·고발 절차');
    await user.click(screen.getByRole('button', { name: /세무팀/ }));
    expect(await screen.findByText(/종합소득세 신고/)).toBeInTheDocument();
  });

  it('카드 클릭 → 상세로 이동', async () => {
    const user = userEvent.setup();
    seedTeam('법무');
    renderApp('/guides');
    await user.click(await screen.findByText('전세보증금 돌려받기'));
    expect(await screen.findByRole('heading', { name: '단계별 절차' })).toBeInTheDocument();
  });
});

describe('절차 가이드 상세 (K)', () => {
  it('단계·필요서류·근거법령 렌더', async () => {
    seedTeam('법무');
    renderApp('/guides/deposit-return');
    expect(await screen.findByRole('heading', { name: '전세보증금 돌려받기' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '단계별 절차' })).toBeInTheDocument();
    expect(screen.getByText('필요 서류')).toBeInTheDocument();
    expect(screen.getByText('근거 법령')).toBeInTheDocument();
    expect(screen.getByText('내용증명 발송')).toBeInTheDocument();
  });

  it('근거 법령 카드 → /laws/:id 링크', async () => {
    seedTeam('법무');
    renderApp('/guides/deposit-return');
    const link = await screen.findByText('주택임대차보호법');
    expect(link.closest('a')).toHaveAttribute('href', '/laws/housing-lease');
  });

  it('CTA 클릭 → pendingQ 설정 + 상담 자동 전송', async () => {
    const user = userEvent.setup();
    seedTeam('법무'); seedUser('김리걸');
    renderApp('/guides/deposit-return');
    await user.click(await screen.findByRole('link', { name: /질문/ }));
    expect(await screen.findByText(/제 상황에도 그대로 적용되나요/)).toBeInTheDocument();
  });

  it('미상 id → 팀 첫 가이드로 폴백', async () => {
    seedTeam('세무');
    renderApp('/guides/nonexistent');
    // 세무 첫 가이드(income-tax) 제목
    expect(await screen.findByRole('heading', { name: /종합소득세 신고/ })).toBeInTheDocument();
  });
});
