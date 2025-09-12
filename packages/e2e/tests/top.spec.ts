import { test, expect } from '@playwright/test'

test('title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/)
})

test('latest info display shows max 3 items each', async ({ page }) => {
  await page.goto('/')

  // 最新攻略動画セクション：seedデータが投入されているので必ずデータがある
  const latestVideosHeading = page.locator('h4:has-text("最新攻略動画")')
  await expect(latestVideosHeading).toBeVisible()

  const latestVideosSection = page.getByLabel('最新攻略動画一覧')
  await expect(latestVideosSection).toBeVisible()

  // seedデータがあるので動画は必ず存在する：最大3個までの表示をチェック
  const videoItems = latestVideosSection.locator('.archive-item')
  const videoCount = await videoItems.count()
  expect(videoCount).toBeGreaterThan(0)
  expect(videoCount).toBeLessThanOrEqual(3)

  // 最新チャレンジセクション：seedデータが投入されているので必ずデータがある
  const challengesHeading = page.locator('h4:has-text("最新チャレンジ")')
  await expect(challengesHeading).toBeVisible()

  const challengeTable = page.locator('table')
  await expect(challengeTable).toBeVisible()

  // seedデータがあるのでチャレンジは必ず存在する：最大3個までの表示をチェック
  const challengeRows = challengeTable.locator('tbody tr')
  const challengeCount = await challengeRows.count()
  expect(challengeCount).toBeGreaterThan(0)
  expect(challengeCount).toBeLessThanOrEqual(3)

  // 更新履歴の抜粋セクション：静的データなので常に表示される
  const updatesSection = page.locator('#recent-updates')
  await expect(updatesSection).toBeVisible()

  const updatesList = updatesSection.locator('ul.content-list')
  await expect(updatesList).toBeVisible()

  // 更新履歴は静的データなので常にある：最大3個までの表示をチェック
  const updateItems = updatesList.locator('li')
  const updateCount = await updateItems.count()
  expect(updateCount).toBeGreaterThan(0)
  expect(updateCount).toBeLessThanOrEqual(3)
})
