
export type ErrorData<
  C extends string,
  T extends object = object
> = ErrorResponse<C, T>
export type ErrorResponse<
  C extends string,
  T extends object = object
> = Readonly<T & {
  code: C
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
