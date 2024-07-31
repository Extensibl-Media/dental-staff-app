import { pgTable, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const userRolesEnum = pgEnum('user_roles', [
	'SUPERADMIN',
	// 'ADMIN',
	'CLIENT',
	'CLIENT_STAFF',
	'CANDIDATE'
]);

export const userTable = pgTable('users', {
	id: text('id').notNull().primaryKey(),
	provider: text('provider').notNull().default('email'),
	providerId: text('provider_id').notNull().default(''),
	email: text('email').notNull().unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	avatarUrl: text('avatar_url'),
	role: text('role').notNull().default('CANDIDATE'),
	verified: boolean('verified').notNull().default(false),
	receiveEmail: boolean('receive_email').notNull().default(true),
	password: text('password'),
	token: text('token').unique(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	completedOnboarding: boolean('completed_onboarding').default(false),
	blacklisted: boolean('blacklisted').default(false)
});

export const sessionTable = pgTable('sessions', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull()
});

export const userInviteTable = pgTable('user_invites', {
	id: text('id').notNull().primaryKey(),
	token: text('token').unique(),
	email: text('email').notNull(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	})
		.notNull()
		.defaultNow(),
	expiresAt: timestamp('expires_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	referrerRole: userRolesEnum('referrer_role').notNull(),
	referrerId: text('referrer_id').notNull(),
	invitedRole: text('user_role').notNull()
});

export type User = typeof userTable.$inferInsert;
export type UpdateUser = Partial<typeof userTable.$inferInsert>;
export type Session = typeof sessionTable.$inferInsert;
