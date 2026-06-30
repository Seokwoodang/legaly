import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test-utils';

beforeEach(() => localStorage.clear());

describe('판례 목록 (F1)', () => {
  it('법무 판례 목록 렌더', async () => {
    renderApp('/cases');
    expect(await screen.findByText('통상임금 — 정기상여금의 통상임금성')).toBeInTheDocument();
  });

  it('법원 필터(전합)', async () => {
    const user = userEvent.setup();
    renderApp('/cases');
    await screen.findByText('통상임금 — 정기상여금의 통상임금성');
    await user.selectOptions(screen.getByRole('combobox'), '대법원(전합)');
    expect(await screen.findByText('통상임금 — 정기상여금의 통상임금성')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('부당해고 구제 — 경영상 해고의 정당성 요건')).toBeNull());
  });

  it('사건번호로 검색', async () => {
    const user = userEvent.setup();
    renderApp('/cases');
    await screen.findByText('통상임금 — 정기상여금의 통상임금성');
    await user.type(screen.getByPlaceholderText(/검색/), '2022다272053');
    expect(await screen.findByText(/임대차보증금 반환/)).toBeInTheDocument();
  });
});

describe('판례 상세 (F2)', () => {
  it('전문 있는 판례: 판시사항/판결요지/참조조문', async () => {
    const user = userEvent.setup();
    renderApp('/cases');
    await user.click(await screen.findByText(/임대차보증금 반환/));
    expect(await screen.findByRole('heading', { name: '판시사항' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '참조조문' })).toBeInTheDocument();
  });

  it('전문 없는 판례: 준비중 스텁', async () => {
    const user = userEvent.setup();
    renderApp('/cases');
    await user.click(await screen.findByText('통상임금 — 정기상여금의 통상임금성'));
    expect(await screen.findByText(/준비 중/)).toBeInTheDocument();
  });
});
