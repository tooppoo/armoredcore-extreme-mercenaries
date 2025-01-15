
export function cloneURLSearchParams(params: URLSearchParams): URLSearchParams {
  return new URLSearchParams(params.toString())
}

export function clearQuery(url: URL): URL {
  const newUrl = new URL(url.toString())
  newUrl.search = ''

  return newUrl
}