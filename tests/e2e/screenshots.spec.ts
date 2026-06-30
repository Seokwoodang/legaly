import { test, expect } from '@playwright/test';

// 시각 충실도 베이스라인 (페이지 × 팀 × 인증). Gate 2에서 blessed.

const pages = [
  { name: 'lobby', path: '/' },
  { name: 'consult', path: '/consult' },
  { name: 'laws', path: '/laws' },
  { name: 'law-detail', path: '/laws/housing-lease' },
  { name: 'cases', path: '/cases' },
  { name: 'case-detail', path: `/cases/${encodeURIComponent('2022다272053')}` },
  { name: 'saved', path: '/saved' },
];

for (const team of ['법무', '세무'] as const) {
  for (const p of pages) {
    test(`screenshot ${p.name} (${team})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('legaly.team', t), team);
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`${p.name}-${team}.png`, { fullPage: true, maxDiffPixelRatio: 0.02 });
    });
  }
}
