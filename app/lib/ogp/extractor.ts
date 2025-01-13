
export type OGPExtractor = (url: string) => Promise<Ogp>

type Ogp = Readonly<{
  title: string
  description: string
  imageUrl: string
}>

export const withYoutubeAPI: OGPExtractor = async (url) => {
  const target = `https://www.youtube.com/oembed?url=${url}`
  const res = await fetch(target, {
    headers: {
      accept: 'application/json'
    }
  })
  if (400 < res.status) {
    const body = await res.text()
    throw new Error(body)
  }

  const ogp = await res.json<YoutubeOembedResponse>()

  return {
    title: ogp.title,
    imageUrl: ogp.thumbnail_url,
    description: '',
  }
}
export const withDomParser: OGPExtractor = async (url) => {
  const target = `https://corsproxy.io/?url=${encodeURI(url)}`
  const res = await fetch(target)
  if (400 < res.status) {
    const body = await res.text()
    throw new Error(body)
  }
  const html = await res.text()

  return extractOgpFromHtml(html)
}
export const withOGPScanner: OGPExtractor = async (url) => {
  // https://ogp-scanner.kunon.jp/
  const target = `https://ogp-scanner.kunon.jp/v1/ogp_info?url=${encodeURI(url)}`
  const res = await fetch(target, {
    headers: {
      accept: 'application/json'
    }
  })
  if (400 < res.status) {
    const body = await res.text()
    throw new Error(body)
  }
  const { ogp } = await res.json<OGPScannerResponse>()

  return {
    title: ogp['og:title'][0],
    description: ogp['og:description'][0],
    imageUrl: ogp['og:image'][0],
  }
}
type OGPScannerResponse = Readonly<{
  ogp: {
    'og:title': [string]
    'og:description': [string]
    'og:image': [string]
  }
}>
type YoutubeOembedResponse = Readonly<{
  title: string
  thumbnail_url: string
}>
function extractOgpFromHtml(html: string): Ogp {
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

