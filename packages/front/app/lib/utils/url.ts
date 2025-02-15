export function cloneURLSearchParams(params: URLSearchParams): URLSearchParams {
  return new URLSearchParams(params.toString())
}

export function clearParameters(url: URL): URL {
  const newUrl = new URL(url.toString())
  newUrl.search = ''
  newUrl.hash = ''

  return newUrl
}
