import { test, expect } from '@playwright/test';

test('title', async ({ page }) => {
  /**
   * https://github.com/cloudflare/workers-sdk/issues/7572
   * wrangler pages dev だと↑のエラーが出るので remix:vite で代用しているが
   * 今度はD1へのアクセスがplaywright経由だと非常に遅くタイムアウトする
   * 一旦、↑の問題が解消するまでskip
   */
  test.skip()
  test.slow()

  await page.goto('/archives');

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/);
});
