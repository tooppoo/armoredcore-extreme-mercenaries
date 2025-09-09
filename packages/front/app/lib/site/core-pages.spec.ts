import { describe, it, expect } from 'vitest'
import {
  generateFooterLinks,
  generateHeaderLinks,
  findCorePage,
} from './core-pages'

describe('core-pages navigation functions', () => {
  describe('generateFooterLinks', () => {
    it('should return only pages marked for footer display', () => {
      const links = generateFooterLinks()

      expect(links).toHaveLength(5)
      expect(links.map((link) => link.href)).toEqual([
        '/',
        '/rule',
        '/penalties',
        '/updates',
        '/archives',
      ])
      expect(links.map((link) => link.text)).toEqual([
        'TOP',
        '利用規約',
        '罰則規定',
        '更新履歴',
        'アーカイブ',
      ])
    })

    it('should set aria-current for current path', () => {
      const links = generateFooterLinks('/rule')

      const ruleLink = links.find((link) => link.href === '/rule')
      const topLink = links.find((link) => link.href === '/')

      expect(ruleLink?.ariaCurrent).toBe('page')
      expect(topLink?.ariaCurrent).toBeUndefined()
    })

    it('should handle undefined currentPath', () => {
      const links = generateFooterLinks(undefined)

      links.forEach((link) => {
        expect(link.ariaCurrent).toBeUndefined()
      })
    })
  })

  describe('generateHeaderLinks', () => {
    it('should return empty array when no pages marked for header display', () => {
      const links = generateHeaderLinks()

      expect(links).toHaveLength(0)
    })

    it('should set aria-current for current path if header pages existed', () => {
      const links = generateHeaderLinks('/')

      expect(links).toHaveLength(0)
    })
  })

  describe('findCorePage', () => {
    it('should find existing page by path', () => {
      const page = findCorePage('/rule')

      expect(page).toBeDefined()
      expect(page?.path).toBe('/rule')
      expect(page?.label).toBe('利用規約')
      expect(page?.showInFooter).toBe(true)
    })

    it('should return undefined for non-existent path', () => {
      const page = findCorePage('/non-existent')

      expect(page).toBeUndefined()
    })

    it('should find sub-pages', () => {
      const challengePage = findCorePage('/archives/challenge')

      expect(challengePage).toBeDefined()
      expect(challengePage?.path).toBe('/archives/challenge')
      expect(challengePage?.label).toBe('チャレンジアーカイブ')
      expect(challengePage?.showInFooter).toBe(false)
    })
  })

  describe('navigation consistency', () => {
    it('should maintain consistency between corePages and navigation links', () => {
      const footerLinks = generateFooterLinks()

      // フッターに表示されるリンクは全て有効なcorePagesのパスであること
      footerLinks.forEach((link) => {
        const corePage = findCorePage(link.href)
        expect(corePage).toBeDefined()
        expect(corePage?.showInFooter).toBe(true)
        expect(corePage?.label).toBe(link.text)
      })
    })
  })
})
