import { test, expect } from '@playwright/test';

test('title', async ({ page }) => {
  await page.goto('/penalties');

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/);
});
