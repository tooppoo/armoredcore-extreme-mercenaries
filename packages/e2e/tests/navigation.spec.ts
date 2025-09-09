import { test, expect } from '@playwright/test'

test.describe('Navigation from corePages', () => {
  // Test critical navigation links without hardcoding full list
  const criticalLinks = [
    { path: '/', text: 'TOP' },
    { path: '/rule', text: '利用規約' },
  ]

  test('footer contains critical navigation links', async ({ page }) => {
    await page.goto('/')

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Verify critical links exist and are functional
    for (const link of criticalLinks) {
      const linkElement = footer.getByRole('link', { name: link.text })
      await expect(linkElement).toBeVisible()
      await expect(linkElement).toHaveAttribute('href', link.path)
    }

    // Ensure footer has multiple navigation links (without hardcoding all)
    const navigationLinks = await footer.locator('a[href^="/"]').count()
    expect(navigationLinks).toBeGreaterThan(2) // Should have at least TOP + 2 other links
  })

  // Test critical links navigation without full enumeration
  criticalLinks.forEach((link) => {
    test(`critical link "${link.text}" is clickable and navigates correctly`, async ({
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

      // Verify critical links are present on this page
      for (const link of criticalLinks) {
        const linkElement = footer.getByRole('link', { name: link.text })
        await expect(linkElement).toBeVisible()
        await expect(linkElement).toHaveAttribute('href', link.path)
      }

      // Ensure consistent footer structure
      const navigationLinks = await footer.locator('a[href^="/"]').count()
      expect(navigationLinks).toBeGreaterThan(2)
    })
  })

  test('keyboard navigation works for critical footer links', async ({
    page,
  }) => {
    // Test keyboard navigation for critical links only
    for (const link of criticalLinks) {
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
