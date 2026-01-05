import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다')
}

const client = postgres(process.env.DATABASE_URL)
export const db = drizzle(client, { schema })
export { schema }
