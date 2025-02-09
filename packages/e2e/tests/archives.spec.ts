import { test, expect } from '@playwright/test';

test('title', async ({ page }) => {
  test.slow()

  await page.goto('/archives');

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/);
  await expect(
    page.locator('a[href="/archives/challenge"]')
  ).toHaveCount(1);
  await expect(
    page.locator('a[href="/archives/video"]')
  ).toHaveCount(1);
});
