import { test, expect } from '@playwright/test'

test('title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/)
})

// レビューコメント対応: 実際のseedデータを使用したテスト
test('latest info display shows max 3 items each with seed data', async ({
  page,
}) => {
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

  // 動画アーカイブページと同じUIコンポーネントが使用されているかチェック
  const firstVideoItem = videoItems.first()
  await expect(firstVideoItem).toHaveClass(/archive-item/)
  await expect(firstVideoItem.locator('img')).toBeVisible()
  await expect(firstVideoItem.locator('.underline')).toBeVisible() // タイトル

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

  // チャレンジアーカイブページと同じテーブル形式が使用されているかチェック
  const firstChallengeRow = challengeRows.first()
  await expect(firstChallengeRow.locator('td').first()).toBeVisible() // タイトル列
  await expect(firstChallengeRow.locator('td').nth(1)).toBeVisible() // 日付列

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

// seedデータの内容をテストするための詳細なテスト
test('seed data integrity test', async ({ page }) => {
  await page.goto('/')

  // seedデータからの実際のコンテンツをテスト
  // 動画アーカイブのseedデータが正しく表示されているかチェック
  const videoSection = page.getByLabel('最新攻略動画一覧')
  const videoItems = videoSection.locator('.archive-item')

  // 最初の動画アイテムにタイトルと説明が含まれているかチェック
  if ((await videoItems.count()) > 0) {
    const firstVideo = videoItems.first()
    await expect(firstVideo.locator('.underline')).toContainText(/.+/) // 何らかのタイトルテキスト
    await expect(firstVideo.locator('img')).toHaveAttribute('src', /.*/) // 画像URL
  }

  // チャレンジアーカイブのseedデータが正しく表示されているかチェック
  const challengeTable = page.locator('table')
  const challengeRows = challengeTable.locator('tbody tr')

  if ((await challengeRows.count()) > 0) {
    const firstChallenge = challengeRows.first()
    await expect(firstChallenge.locator('td').first()).toContainText(/.+/) // タイトル
    await expect(firstChallenge.locator('td').nth(1)).toContainText(
      /\d{4}\/\d{1,2}\/\d{1,2}/,
    ) // 日付形式
  }
})
