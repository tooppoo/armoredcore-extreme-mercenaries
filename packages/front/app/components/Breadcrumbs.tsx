import { Link } from 'react-router'
import type { BreadcrumbItem } from '../types/breadcrumb'

type Props = {
  items: BreadcrumbItem[]
  baseUrl?: string
}

const DEFAULT_BASE_URL = 'https://example.com'

export function Breadcrumbs({
  items,
  baseUrl = process.env.SITE_BASE_URL ?? DEFAULT_BASE_URL,
}: Props) {
  if (!items || items.length <= 1) return null

  const itemList = items.map((it, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: it.name,
    item: new URL(it.url, baseUrl).toString(),
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itemList,
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          gap: 6,
        }}
      >
        {items.map((it, i) => (
          <li key={it.url}>
            <Link to={it.url}>{it.name}</Link>
            {i < items.length - 1 && (
              <span style={{ margin: '0 6px' }}>{'/'}</span>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  )
}

export default Breadcrumbs
