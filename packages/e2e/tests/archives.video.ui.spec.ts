import { test, expect, type APIRequestContext } from '@playwright/test'

async function uploadVideo(request: APIRequestContext, url: string) {
  await request.post('/api/archives/video', {
    data: {
      url,
      discord_user: { id: 'e2e', name: 'e2e' },
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test_upload_token',
    },
  })
}

test.describe('動画アーカイブ UI', () => {
  test('サイト種別フィルタ: YouTubeのみ表示', async ({ page, request }) => {
    test.slow()

    const ts = Date.now()
    await uploadVideo(request, `https://www.youtube.com/watch?v=abcd${ts}`)
    await uploadVideo(request, `https://x.com/e2e/status/${ts}`)
    await uploadVideo(request, `https://www.nicovideo.jp/watch/sm${ts}`)

    await page.goto('/archives/video')

    // フィルタで YouTube を選択
    await page.selectOption('#source', 'yt')
    await page.click('button:has-text("適用")')

    // カード一覧（またはリスト一覧）が表示されていること
    await expect(
      page.locator(
        'section[aria-label="動画アーカイブ一覧（カード）"], section[aria-label="動画アーカイブ一覧（リスト）"]',
      ),
    ).toBeVisible()

    // YouTube バッジが1つ以上存在し、他サイトのバッジが存在しないこと
    await expect(page.locator('text=YouTube').first()).toBeVisible()
    await expect(page.locator('text=X/Twitter')).toHaveCount(0)
    await expect(page.locator('text=ニコニコ動画')).toHaveCount(0)
  })

  test('表示モード切替: カード <-> リスト', async ({ page }) => {
    test.slow()

    await page.goto('/archives/video')

    // 初期はカード（セクションが存在する）
    await expect(
      page.locator('section[aria-label="動画アーカイブ一覧（カード）"]'),
    ).toBeVisible()

    // リストに切替
    await page.selectOption('#view', 'list')
    await page.click('button:has-text("適用")')

    await expect(
      page.locator('section[aria-label="動画アーカイブ一覧（リスト）"]'),
    ).toBeVisible()
    await expect(
      page.locator('section[aria-label="動画アーカイブ一覧（カード）"]'),
    ).toHaveCount(0)

    // カードに戻す
    await page.selectOption('#view', 'card')
    await page.click('button:has-text("適用")')
    await expect(
      page.locator('section[aria-label="動画アーカイブ一覧（カード）"]'),
    ).toBeVisible()
  })
})
