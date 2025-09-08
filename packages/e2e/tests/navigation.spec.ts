import { test, expect } from '@playwright/test'

test.describe('Navigation from corePages', () => {
  // Expected footer links based on corePages configuration
  const expectedFooterLinks = [
    { path: '/', text: 'TOP' },
    { path: '/rule', text: '利用規約' },
    { path: '/penalties', text: '罰則規定' },
    { path: '/updates', text: '更新履歴' },
    { path: '/archives', text: 'アーカイブ' },
  ]

  test('footer contains all expected navigation links', async ({ page }) => {
    await page.goto('/')

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // TOP リンクを確認（上部に表示）
    const topLink = footer.getByRole('link', { name: 'TOP' })
    await expect(topLink).toBeVisible()
    await expect(topLink).toHaveAttribute('href', '/')

    // その他のフッターリンクを確認
    for (const link of expectedFooterLinks.slice(1)) {
      // TOP以外
      const linkElement = footer.getByRole('link', { name: link.text })
      await expect(linkElement).toBeVisible()
      await expect(linkElement).toHaveAttribute('href', link.path)
    }
  })

  // Use parametrized tests instead of for-loops in test bodies
  expectedFooterLinks.forEach((link) => {
    test(`footer link "${link.text}" is clickable and navigates correctly`, async ({
      page,
    }) => {
      await page.goto('/')

      const footer = page.locator('footer')
      const linkElement = footer.getByRole('link', { name: link.text })

      await linkElement.click()
      await page.waitForURL(`**${link.path}`)

      // Verify the page loaded correctly
      await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/)
    })
  })

  const testPages = [
    { path: '/rule', currentLinkName: '利用規約', otherLinkName: 'TOP' },
    { path: '/', currentLinkName: 'TOP', otherLinkName: '利用規約' },
  ]

  testPages.forEach(({ path, currentLinkName, otherLinkName }) => {
    test(`aria-current is set correctly for ${currentLinkName} page`, async ({
      page,
    }) => {
      await page.goto(path)

      const footer = page.locator('footer')
      const currentLink = footer.getByRole('link', { name: currentLinkName })
      const otherLink = footer.getByRole('link', { name: otherLinkName })

      await expect(currentLink).toHaveAttribute('aria-current', 'page')
      await expect(otherLink).not.toHaveAttribute('aria-current', 'page')
    })
  })

  const pagesForConsistency = ['/rule', '/penalties', '/updates', '/archives']

  pagesForConsistency.forEach((currentPage) => {
    test(`navigation links maintain consistency on ${currentPage} page`, async ({
      page,
    }) => {
      await page.goto(currentPage)

      const footer = page.locator('footer')

      // Verify all footer links are present on this page
      for (const link of expectedFooterLinks) {
        const linkElement = footer.getByRole('link', { name: link.text })
        await expect(linkElement).toBeVisible()
        await expect(linkElement).toHaveAttribute('href', link.path)
      }
    })
  })

  test('keyboard navigation works for footer links', async ({ page }) => {
    // Test keyboard navigation for each expected footer link
    for (const link of expectedFooterLinks) {
      await page.goto('/')
      const footer = page.locator('footer')

      // Find the link element by its text content
      const linkElement = footer.getByRole('link', { name: link.text })

      await linkElement.focus()
      await expect(linkElement).toBeFocused()

      // Test Enter key navigation
      await linkElement.press('Enter')
      await page.waitForLoadState('networkidle')

      // Verify navigation worked
      await expect(page).toHaveURL(
        new RegExp(`.*${link.path.replace('/', '\\/')}$`),
      )
    }
  })
})
