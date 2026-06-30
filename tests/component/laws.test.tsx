import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test-utils';

beforeEach(() => localStorage.clear());

describe('자료실 목록 (E1)', () => {
  it('법무 법령 목록 렌더', async () => {
    renderApp('/laws');
    expect(await screen.findByText('주택임대차보호법')).toBeInTheDocument();
    expect(screen.getByText('민법')).toBeInTheDocument();
  });

  it('검색 필터(name.includes)', async () => {
    const user = userEvent.setup();
    renderApp('/laws');
    await screen.findByText('민법');
    await user.type(screen.getByPlaceholderText(/검색/), '임대차');
    expect(await screen.findByText('주택임대차보호법')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('형법')).toBeNull());
  });

  it('분야 칩 필터', async () => {
    const user = userEvent.setup();
    renderApp('/laws');
    await user.click(await screen.findByRole('button', { name: '형사' }));
    expect(await screen.findByText('형법')).toBeInTheDocument();
    expect(screen.queryByText('민법')).toBeNull();
  });

  it('검색 결과 없으면 빈 카피', async () => {
    const user = userEvent.setup();
    renderApp('/laws');
    await screen.findByText('민법');
    await user.type(screen.getByPlaceholderText(/검색/), 'zzz없는법');
    expect(await screen.findByText('검색 결과가 없어요. 다른 키워드로 찾아보시겠어요?')).toBeInTheDocument();
  });

  it('팀 전환 시 분야 전체로 리셋, 세무 목록', async () => {
    const user = userEvent.setup();
    renderApp('/laws');
    await user.click(await screen.findByRole('button', { name: '형사' }));
    await user.click(screen.getByRole('button', { name: /세무팀/ }));
    expect(await screen.findByText('소득세법')).toBeInTheDocument();
  });

  it('목록 페이지 헤더 로그인이 실제로 동작 (R1)', async () => {
    const user = userEvent.setup();
    renderApp('/laws');
    await user.click(await screen.findByRole('button', { name: '로그인' }));
    await user.type(await screen.findByPlaceholderText('예) 김리걸'), '김리걸');
    await user.click(screen.getByRole('button', { name: '시작하기' }));
    expect(await screen.findByRole('button', { name: /김리걸님/ })).toBeInTheDocument();
  });
});

describe('상세에서 팀 전환 → 목록 이동 (R2)', () => {
  it('법령 상세에서 세무팀 전환 시 세무 자료실 목록으로 이동', async () => {
    const user = userEvent.setup();
    renderApp('/laws/housing-lease');
    await screen.findByRole('heading', { name: '대항력 등' }); // 상세 진입 확인
    await user.click(screen.getByRole('button', { name: /세무팀/ }));
    expect(await screen.findByText('세법과 자료 찾아보기')).toBeInTheDocument();
  });
});

describe('법령 상세 (E2)', () => {
  it('전문 있는 법령: 조문 목차 + 본문', async () => {
    const user = userEvent.setup();
    renderApp('/laws');
    await user.click(await screen.findByText('주택임대차보호법'));
    expect(await screen.findByRole('heading', { name: '대항력 등' })).toBeInTheDocument();
  });

  it('전문 없는 법령: 준비중 스텁', async () => {
    const user = userEvent.setup();
    renderApp('/laws');
    await user.click(await screen.findByText('민법'));
    expect(await screen.findByText(/준비 중/)).toBeInTheDocument();
  });
});
