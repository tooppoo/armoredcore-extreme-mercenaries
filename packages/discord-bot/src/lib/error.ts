export function makeCatchesSerializable(e: unknown): unknown {
  if (e instanceof Error) {
    const obj = JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e)))

    return {
      ...obj,
      stack: obj.stack?.split('\n'),
    }
  } else {
    return e
  }
}
