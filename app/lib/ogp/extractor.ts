
type Ogp = Readonly<{
  title: string
  description: string
  imageUrl: string
}>
export function extractOgpFromHtml(html: string): Ogp {
  const domParser = new DOMParser()
  const dom = domParser.parseFromString(html, 'text/html')

  const ogp = Object.fromEntries([...dom.head.children]
    .filter((node) =>
      node.tagName === 'META'
      && node.getAttribute('property')?.startsWith('og:')
    )
    .map((node) => [
      node.getAttribute('property'),
      node.getAttribute('content'),
    ])
  ) as Record<string, string>

  return {
    title: ogp['og:title'],
    description: ogp['og:description'],
    imageUrl: ogp['og:image'],
  }
}
