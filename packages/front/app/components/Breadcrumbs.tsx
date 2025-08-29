import { Link } from 'react-router'
import type { BreadcrumbItem } from '../types/breadcrumb'

type Props = {
  items: BreadcrumbItem[]
  baseUrl?: string
}

const DEFAULT_BASE_URL = 'https://example.com'

export function Breadcrumbs({
  items,
  baseUrl = import.meta.env.VITE_SITE_BASE_URL ?? DEFAULT_BASE_URL,
}: Props) {
  // Show breadcrumbs if we have more than 1 item (proper navigation trail)
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

  // For mobile: collapse middle items if we have more than 3 items
  const shouldCollapse = items.length > 3
  const firstItem = items[0]
  const lastItem = items[items.length - 1]
  const middleItems = items.slice(1, -1)

  return (
    <nav aria-label="Breadcrumb">
      {/* Mobile layout (< sm): Method A - Collapsed middle items */}
      <div className="sm:hidden">
        <ol className="list-none p-0 m-0 flex items-center gap-1 flex-wrap">
          {/* First item */}
          <li className="min-w-0 shrink-0">
            <Link to={firstItem.url} className="whitespace-nowrap truncate block max-w-[8rem]">
              {firstItem.name}
            </Link>
            {items.length > 1 && (
              <span className="mx-1 shrink-0" aria-hidden="true">/</span>
            )}
          </li>

          {/* Middle items - collapsed if more than 3 total items */}
          {shouldCollapse && middleItems.length > 0 ? (
            <li className="min-w-0">
              <details className="inline">
                <summary className="cursor-pointer list-none whitespace-nowrap">
                  …
                  <span className="mx-1 shrink-0" aria-hidden="true">/</span>
                </summary>
                <div className="absolute bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1 p-2 z-10 min-w-[12rem]">
                  <ol className="list-none p-0 m-0 space-y-1">
                    {middleItems.map((item, idx) => (
                      <li key={item.url}>
                        <Link to={item.url} className="block whitespace-nowrap truncate max-w-[10rem] hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded">
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            </li>
          ) : (
            /* Show middle items normally if 3 or fewer total items */
            middleItems.map((item, idx) => (
              <li key={item.url} className="min-w-0 shrink-0">
                <Link to={item.url} className="whitespace-nowrap truncate block max-w-[8rem]">
                  {item.name}
                </Link>
                <span className="mx-1 shrink-0" aria-hidden="true">/</span>
              </li>
            ))
          )}

          {/* Last item (current page) */}
          {items.length > 1 && (
            <li className="min-w-0 flex-1">
              <span 
                className="whitespace-nowrap truncate block font-medium"
                aria-current="page"
              >
                {lastItem.name}
              </span>
            </li>
          )}
        </ol>
      </div>

      {/* Tablet+ layout (≥ sm): Method B - Horizontal scroll with fade */}
      <div className="hidden sm:block relative">
        <div className="overflow-x-auto no-scrollbar">
          <ol className="list-none p-0 m-0 flex items-center gap-1 min-w-max">
            {items.map((item, i) => (
              <li key={item.url} className="shrink-0 min-w-0 flex items-center">
                {i === items.length - 1 ? (
                  <span 
                    className="whitespace-nowrap truncate block font-medium max-w-[16rem] md:max-w-[20rem]"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link 
                    to={item.url} 
                    className="whitespace-nowrap truncate block max-w-[16rem] md:max-w-[20rem]"
                  >
                    {item.name}
                  </Link>
                )}
                {i < items.length - 1 && (
                  <span className="mx-1 shrink-0" aria-hidden="true">/</span>
                )}
              </li>
            ))}
          </ol>
        </div>
        
        {/* Left fade indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white dark:from-gray-950 to-transparent pointer-events-none" />
        
        {/* Right fade indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white dark:from-gray-950 to-transparent pointer-events-none" />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  )
}

export default Breadcrumbs
