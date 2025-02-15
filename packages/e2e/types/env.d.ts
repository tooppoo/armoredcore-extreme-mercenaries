declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        TIMEOUT?: string
        TIMEOUT_EXPECT?: string
      }
    }
  }
}
