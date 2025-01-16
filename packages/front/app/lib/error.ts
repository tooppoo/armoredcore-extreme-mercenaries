
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
    const obj = JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e)))

    return {
      ...obj,
      stack: obj.stack?.split('\n'),
    }
  }
  else {
    return e
  }
}
