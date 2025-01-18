import { test, expect } from '@playwright/test';

test('title', async ({ page }) => {
  await page.goto('/updates/ccbb6c5c-90e5-9506-a6fb-701f142db1c1');

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/);
});
