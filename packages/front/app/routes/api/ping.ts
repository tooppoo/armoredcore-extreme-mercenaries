
// A minimal health-check endpoint that simply returns 200

/**
 * https://playwright.dev/docs/api/class-testconfig#test-config-web-server
 * > The url on your http server that is expected to return a 2xx, 3xx, 400, 401, 402, or 403 status code when the server is ready to accept connections.
 * > Redirects (3xx status codes) are being followed and the new location is checked. Either port or url should be specified.
 *
 * playwrightでサーバーを起動したときに、死活監視で叩かせる用のエンドポイント.
 * DBレコードや外部APIに依存せず、常に200を返す.
 */
export const loader = async () => {
  return new Response(null, { status: 200 })
}
