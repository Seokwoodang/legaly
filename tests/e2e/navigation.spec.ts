import { test, expect } from '@playwright/test';

// 라우팅/내비게이션 + 딥링크 자동전송 E2E (실제 브라우저)

test('로비 → 법무팀 상담 시작', async ({ page }) => {
  await page.goto('/');
  await page.getByText('나의 법무팀').waitFor();
  await page.locator('a', { hasText: '상담 시작하기' }).first().click();
  await expect(page).toHaveURL(/\/consult/);
  await expect(page.getByText(/법무팀입니다/)).toBeVisible();
});

test('예시 칩 → 상담 자동 전송', async ({ page }) => {
  await page.goto('/');
  await page.getByText('전세금을 못 받고 있어요').click();
  await expect(page).toHaveURL(/\/consult/);
  await expect(page.getByText(/보증금을 안 돌려/)).toBeVisible();
});

test('서브내비로 자료실/판례 이동', async ({ page }) => {
  await page.goto('/consult');
  await page.getByRole('link', { name: '자료실' }).click();
  await expect(page).toHaveURL(/\/laws/);
  await page.getByText('주택임대차보호법').first().click();
  await expect(page).toHaveURL(/\/laws\//);
});

test('자료실 행 → 법령 상세 → 관련 판례', async ({ page }) => {
  await page.goto('/laws');
  await page.getByText('주택임대차보호법').first().click();
  await expect(page.getByRole('heading', { name: '대항력 등' })).toBeVisible();
});

test('알 수 없는 경로는 홈으로', async ({ page }) => {
  await page.goto('/nonsense');
  await expect(page).toHaveURL(/\/$/);
});
