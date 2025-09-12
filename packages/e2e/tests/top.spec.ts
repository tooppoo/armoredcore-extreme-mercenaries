import { test, expect } from '@playwright/test'

test('title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/)
})

test('latest info display shows max 3 items each', async ({ page }) => {
  await page.goto('/')

  // 最新攻略動画セクションをチェック
  const latestVideosHeading = page.locator('h4:has-text("最新攻略動画")')
  await expect(latestVideosHeading).toBeVisible()

  // 最新攻略動画があるかチェック
  const latestVideosSection = page.getByLabel('最新攻略動画一覧')
  const videoEmptyMessage = page.locator('p:has-text("まだ動画が登録されていません")')
  
  const hasVideoSection = await latestVideosSection.count() > 0
  const hasEmptyMessage = await videoEmptyMessage.count() > 0
  
  if (hasVideoSection && !hasEmptyMessage) {
    // 動画データがある場合：最大3個までの表示をチェック
    const videoItems = latestVideosSection.locator('.archive-item')
    const videoCount = await videoItems.count()
    expect(videoCount).toBeGreaterThan(0)
    expect(videoCount).toBeLessThanOrEqual(3)
  } else {
    // 動画データがない場合：空メッセージが表示されることをチェック
    await expect(videoEmptyMessage).toBeVisible()
  }

  // 最新チャレンジセクションをチェック
  const challengesHeading = page.locator('h4:has-text("最新チャレンジ")')
  await expect(challengesHeading).toBeVisible()
  
  // 最新チャレンジがあるかチェック
  const challengeTable = page.locator('table')
  const challengeEmptyMessage = page.locator('p:has-text("まだチャレンジが登録されていません")')
  
  const hasChallengeTable = await challengeTable.count() > 0
  const hasChallengeEmptyMessage = await challengeEmptyMessage.count() > 0
  
  if (hasChallengeTable && !hasChallengeEmptyMessage) {
    // チャレンジデータがある場合：最大3個までの表示をチェック
    const challengeRows = challengeTable.locator('tbody tr')
    const challengeCount = await challengeRows.count()
    expect(challengeCount).toBeGreaterThan(0)
    expect(challengeCount).toBeLessThanOrEqual(3)
  } else {
    // チャレンジデータがない場合：空メッセージが表示されることをチェック
    await expect(challengeEmptyMessage).toBeVisible()
  }

  // 更新履歴の抜粋セクションをチェック（静的データなので常に表示される）
  const updatesSection = page.locator('#recent-updates')
  await expect(updatesSection).toBeVisible()
  
  const updatesList = updatesSection.locator('ul.content-list')
  await expect(updatesList).toBeVisible()
  
  // 更新履歴は静的データなので常にある想定：最大3個までの表示をチェック
  const updateItems = updatesList.locator('li')
  const updateCount = await updateItems.count()
  expect(updateCount).toBeGreaterThan(0)
  expect(updateCount).toBeLessThanOrEqual(3)
})
