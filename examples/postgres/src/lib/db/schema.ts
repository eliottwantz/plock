import { createId } from '@paralleldrive/cuid2';
import { pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

const createdAt = timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp('updated_at', { withTimezone: true })
	.notNull()
	.defaultNow()
	.$onUpdateFn(() => new Date());

export const userTable = pgTable('user', {
	id: text('id').primaryKey().$default(createId),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	picture: text('picture'),
	createdAt,
	updatedAt
});
export type User = typeof userTable.$inferSelect;
export const insertUserSchema = createInsertSchema(userTable);
export const selectUserSchema = createSelectSchema(userTable);

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	userAgent: text('user_agent'),
	ip: text('ip'),
	createdAt,
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull()
});
export type Session = typeof sessionTable.$inferSelect;
export const sessionSchema = createSelectSchema(sessionTable);

export const authProviderEnum = ['google', 'github'] as const;
export const accountTable = pgTable(
	'account',
	{
		provider: text('provider', { enum: authProviderEnum }).notNull(),
		providerUserId: text('provider_user_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		createdAt,
		updatedAt
	},
	(table) => ({
		pk: primaryKey({ columns: [table.provider, table.providerUserId] })
	})
);

export const challengeTable = pgTable('challenge', {
	id: text('id').primaryKey(),
	challenge: text('challenge').notNull(),
	userId: text('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
	createdAt
});
export type Challenge = typeof challengeTable.$inferSelect;
export const challengeSchema = createSelectSchema(challengeTable);

export const algorithmEnum = ['RS256', 'ES256'] as const;
export const credentialTable = pgTable(
	'credential',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		publicKey: text('public_key').notNull(),
		algorithm: text('algorithm', { enum: algorithmEnum }).notNull(),
		createdAt,
		updatedAt
	},
	(table) => ({
		unique_name: uniqueIndex('unique_name').on(table.userId, table.name)
	})
);
export const credentialSchema = createSelectSchema(credentialTable);
export type Credential = z.infer<typeof credentialSchema>;
