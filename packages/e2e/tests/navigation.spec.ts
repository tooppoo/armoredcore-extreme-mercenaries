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
    for (const link of expectedFooterLinks.slice(1)) { // TOP以外
      const linkElement = footer.getByRole('link', { name: link.text })
      await expect(linkElement).toBeVisible()
      await expect(linkElement).toHaveAttribute('href', link.path)
    }
  })

  test('footer links are clickable and navigate correctly', async ({ page }) => {
    await page.goto('/')

    for (const link of expectedFooterLinks) {
      const footer = page.locator('footer')
      const linkElement = footer.getByRole('link', { name: link.text })
      
      await linkElement.click()
      await page.waitForURL(`**${link.path}`)
      
      // Verify the page loaded correctly
      await expect(page).toHaveTitle(/ARMORED CORE EXTREME MERCENARIES/)
      
      // Navigate back to test the next link
      if (link.path !== '/') {
        await page.goto('/')
      }
    }
  })

  test('aria-current is set correctly for current page', async ({ page }) => {
    // Test on rule page
    await page.goto('/rule')
    
    const footer = page.locator('footer')
    const ruleLink = footer.getByRole('link', { name: '利用規約' })
    const topLink = footer.getByRole('link', { name: 'TOP' })
    
    await expect(ruleLink).toHaveAttribute('aria-current', 'page')
    await expect(topLink).not.toHaveAttribute('aria-current', 'page')
  })

  test('aria-current is set correctly for TOP page', async ({ page }) => {
    await page.goto('/')
    
    const footer = page.locator('footer')
    const topLink = footer.getByRole('link', { name: 'TOP' })
    const ruleLink = footer.getByRole('link', { name: '利用規約' })
    
    await expect(topLink).toHaveAttribute('aria-current', 'page')
    await expect(ruleLink).not.toHaveAttribute('aria-current', 'page')
  })

  test('navigation links maintain consistency across pages', async ({ page }) => {
    for (const currentPage of ['/rule', '/penalties', '/updates', '/archives']) {
      await page.goto(currentPage)
      
      const footer = page.locator('footer')
      
      // Verify all footer links are present on every page
      for (const link of expectedFooterLinks) {
        const linkElement = footer.getByRole('link', { name: link.text })
        await expect(linkElement).toBeVisible()
        await expect(linkElement).toHaveAttribute('href', link.path)
      }
    }
  })

  test('keyboard navigation works for footer links', async ({ page }) => {
    await page.goto('/')
    
    const footer = page.locator('footer')
    
    // Tab through footer links and verify they are focusable
    await page.keyboard.press('Tab')
    
    // Find all footer links
    const expectedFooterLinksElements = await footer.getByRole('link').all()
    
    for (const linkElement of expectedFooterLinksElements) {
      // Skip external links (like Twitter)
      const href = await linkElement.getAttribute('href')
      if (href?.startsWith('http')) continue
      
      await linkElement.focus()
      await expect(linkElement).toBeFocused()
      
      // Test Enter key navigation
      await linkElement.press('Enter')
      await page.waitForLoadState('networkidle')
    }
  })
})