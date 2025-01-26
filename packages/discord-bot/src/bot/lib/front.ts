
export function frontApi(path: string): string {
  return process.env.FRONT_URL + path
}

export type FrontErrorResponseBody = Readonly<{
  code: string
  message: string
  detail: unknown
}>
