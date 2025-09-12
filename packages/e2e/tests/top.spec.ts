import { test, expect } from '@playwright/test'

test('title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/)
})

test('latest info display shows max 3 items each', async ({ page }) => {
  await page.goto('/')

  // 最新攻略動画セクションをチェック
  const latestVideosSection = page.getByLabel('最新攻略動画一覧')
  
  // 最新攻略動画があることを確認（0個以上、3個以下）
  const videoItems = latestVideosSection.locator('.archive-item')
  const videoCount = await videoItems.count()
  expect(videoCount).toBeGreaterThanOrEqual(0)
  expect(videoCount).toBeLessThanOrEqual(3)

  // 最新チャレンジセクションをチェック
  // h4で「最新チャレンジ」の見出しを見つける
  const challengesHeading = page.locator('h4:has-text("最新チャレンジ")')
  await expect(challengesHeading).toBeVisible()
  
  // 最新チャレンジテーブルの行数をチェック（ヘッダー行は除く）
  const challengeRows = page.locator('tbody tr')
  const challengeCount = await challengeRows.count()
  expect(challengeCount).toBeLessThanOrEqual(3)

  // 更新履歴の抜粋セクションをチェック
  const updatesSection = page.locator('#recent-updates')
  const updatesList = updatesSection.locator('ul.content-list')
  
  // 更新履歴があるかチェック
  if (await updatesList.count() > 0) {
    const updateItems = updatesList.locator('li')
    const updateCount = await updateItems.count()
    expect(updateCount).toBeLessThanOrEqual(3)
  }
})
