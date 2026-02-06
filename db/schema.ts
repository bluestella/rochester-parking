import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  pgEnum
} from 'drizzle-orm/pg-core'
import { AdapterAccount } from 'next-auth/adapters'

export const roleEnum = pgEnum('Role', ['ADMIN', 'GUARD', 'RESIDENT'])
export const parkingStatusEnum = pgEnum('ParkingStatus', ['ACTIVE', 'EXITED'])

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: roleEnum('role').default('RESIDENT'),
  buildingName: text('buildingName'),
  unitNumber: text('unitNumber'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow()
})

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state')
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId]
    })
  })
)

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull()
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull()
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] })
  })
)

export const parkingRecords = pgTable('parkingRecord', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  plateNumber: text('plateNumber').notNull(),
  entryTimestamp: timestamp('entryTimestamp', { mode: 'date' }).defaultNow(),
  exitTimestamp: timestamp('exitTimestamp', { mode: 'date' }),
  buildingName: text('buildingName').notNull(),
  unitNumber: text('unitNumber').notNull(),
  codename: text('codename').notNull(),
  status: parkingStatusEnum('status').default('ACTIVE'),
  residentId: text('residentId').references(() => users.id),
  createdById: text('createdById').references(() => users.id),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow()
})
