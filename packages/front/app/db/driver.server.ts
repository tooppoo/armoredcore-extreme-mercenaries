import { drizzle } from 'drizzle-orm/d1'

export function getDB(env: Env) {
  return drizzle(env.DB)
}
export type Database = ReturnType<typeof getDB>
