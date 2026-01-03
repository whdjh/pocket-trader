import { pgTable, varchar, timestamp } from 'drizzle-orm/pg-core';

// Users: pk(UUID), id(로그인용, 고유), password(bcrypt), name
export const users = pgTable('users', {
  pk: varchar('pk', { length: 255 }).primaryKey(),
  id: varchar('id', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
