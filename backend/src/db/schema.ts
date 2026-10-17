import { sql } from 'drizzle-orm'
import {
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['student', 'staff', 'admin'])
export const userStatusEnum = pgEnum('user_status', ['active', 'disabled'])

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('student'),
    status: userStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('users_email_unique').on(table.email),
    check('users_email_lowercase_check', sql`${table.email} = lower(${table.email})`),
  ],
)
