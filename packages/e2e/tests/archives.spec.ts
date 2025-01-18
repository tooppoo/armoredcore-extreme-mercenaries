import { test, expect } from '@playwright/test';

test('title', async ({ page }) => {
  // test.skip()
  test.slow()

  await page.goto('/archives');

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/);
});
