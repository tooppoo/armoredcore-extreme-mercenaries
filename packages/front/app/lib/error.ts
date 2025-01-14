
export type ErrorData<T extends object = object> = ErrorResponse<T>
export type ErrorResponse<T extends object = object> = Readonly<T & {
  code: string
  message: string
}>

export function makeCatchesSerializable(e: unknown): unknown {
  if (e instanceof Error) {
    return JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e)))
  }
  else {
    return e
  }
}
