
export function frontApi(path: string): string {
  return process.env.FRONT_URL + path
}
