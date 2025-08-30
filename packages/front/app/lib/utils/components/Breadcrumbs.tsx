import React from 'react'
import { Link } from 'react-router'
import type { BreadcrumbItem } from '../../../types/breadcrumb'

type Props = {
  items: BreadcrumbItem[]
  baseUrl?: string
}

export function Breadcrumbs({ items, baseUrl }: Props) {
  // Show breadcrumbs if we have more than 1 item (proper navigation trail)
  if (!items || items.length <= 1) return null

  // Use provided baseUrl, CF_PAGES_URL, local environment variable, or production URL
  const effectiveBaseUrl =
    baseUrl ??
    import.meta.env.CF_PAGES_URL ??
    import.meta.env.VITE_LOCAL_BASE_URL ??
    'https://armoredcore-extreme-mercenaries.pages.dev'

  const itemList = items.map((it, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: it.name,
    item: new URL(it.url, effectiveBaseUrl).toString(),
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itemList,
  }

  // Basic validation for JSON-LD data before rendering
  const isValidJsonLd = (data: unknown): boolean => {
    if (!data || typeof data !== 'object') return false
    const obj = data as Record<string, unknown>
    return (
      obj['@context'] === 'https://schema.org' &&
      obj['@type'] === 'BreadcrumbList' &&
      Array.isArray(obj.itemListElement)
    )
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
        <ol className="list-none p-0 m-0 flex items-center">
          {/* First item */}
          <li className="shrink-0">
            <Link
              to={firstItem.url}
              className="whitespace-nowrap truncate block max-w-[8rem] text-sm"
            >
              {firstItem.name}
            </Link>
          </li>

          {items.length > 1 && (
            <li className="shrink-0 mx-1" aria-hidden="true">
              /
            </li>
          )}

          {/* Middle items - collapsed if more than 3 total items */}
          {shouldCollapse && middleItems.length > 0 ? (
            <li className="shrink-0 relative">
              <details className="inline">
                <summary className="cursor-pointer list-none whitespace-nowrap text-sm">
                  …
                </summary>
                <div className="absolute top-full left-0 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1 p-2 z-10 min-w-[12rem]">
                  <ol className="list-none p-0 m-0 space-y-1">
                    {middleItems.map((item) => (
                      <li key={item.url}>
                        <Link
                          to={item.url}
                          className="block whitespace-nowrap truncate max-w-[10rem] hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded text-sm"
                        >
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
            middleItems.map((item) => (
              <React.Fragment key={item.url}>
                <li className="shrink-0">
                  <Link
                    to={item.url}
                    className="whitespace-nowrap truncate block max-w-[8rem] text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
                <li className="shrink-0 mx-1" aria-hidden="true">
                  /
                </li>
              </React.Fragment>
            ))
          )}

          {shouldCollapse && middleItems.length > 0 && (
            <li className="shrink-0 mx-1" aria-hidden="true">
              /
            </li>
          )}

          {/* Last item (current page) */}
          {items.length > 1 && (
            <li className="min-w-0 overflow-hidden">
              <span
                className="whitespace-nowrap truncate block font-medium text-sm"
                aria-current="page"
              >
                {lastItem.name}
              </span>
            </li>
          )}
        </ol>
      </div>

      {/* Tablet+ layout (≥ sm): Method B - Horizontal scroll */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto no-scrollbar">
          <ol className="list-none p-0 m-0 flex items-center whitespace-nowrap">
            {items.map((item, i) => (
              <React.Fragment key={item.url}>
                <li className="shrink-0">
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
                </li>
                {i < items.length - 1 && (
                  <li className="shrink-0 mx-1" aria-hidden="true">
                    /
                  </li>
                )}
              </React.Fragment>
            ))}
          </ol>
        </div>
      </div>

      <script type="application/ld+json">
        {isValidJsonLd(jsonLd) ? JSON.stringify(jsonLd) : '{}'}
      </script>
    </nav>
  )
}

export default Breadcrumbs
