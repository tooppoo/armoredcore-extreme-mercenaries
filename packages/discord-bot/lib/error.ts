
export function makeCatchesSerializable(e: unknown): unknown {
  if (e instanceof Error) {
    return JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e)))
  }
  else {
    return e
  }
}
