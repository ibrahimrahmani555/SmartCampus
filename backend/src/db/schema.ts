import { sql } from 'drizzle-orm'
import {
  check,
  boolean,
  pgEnum,
  pgTable,
  index,
  text,
  timestamp,
  unique,
  uuid,
  integer,
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
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('users_email_unique').on(table.email),
    check('users_email_lowercase_check', sql`${table.email} = lower(${table.email})`),
  ],
)

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    succeeded: boolean('succeeded').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('login_attempts_email_created_at_idx').on(table.email, table.createdAt)],
)

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (table) => [index('password_reset_tokens_user_id_idx').on(table.userId)],
)

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    building: text('building').notNull(),
    floor: integer('floor'),
    capacity: integer('capacity').notNull(),
    equipment: text('equipment').array().notNull().default(sql`ARRAY[]::text[]`),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('rooms_building_name_unique').on(table.building, table.name),
    check('rooms_capacity_positive_check', sql`${table.capacity} > 0`),
    index('rooms_is_active_building_idx').on(table.isActive, table.building),
    index('rooms_capacity_idx').on(table.capacity),
  ],
)
