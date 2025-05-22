import { pgTable, text, timestamp, boolean, pgEnum, integer } from 'drizzle-orm/pg-core';

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
	onboardingStep: integer('onboarding_step').default(1),
	blacklisted: boolean('blacklisted').default(false),
	stripeCustomerId: text('stripe_customer_id').unique(),
	timezone: text('timezone').default('America/New_York')
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
	invitedRole: text('user_role').notNull(),
	staffRole: text('staff_role'),
	companyId: text('company_id')
});

export const companyStaffInviteLocations = pgTable('staff_invite_locations', {
	token: text('token').unique(),
	locationId: text('location_id').notNull(),
	isPrimary: boolean('is_primary').notNull().default(true)
});

export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;
export type UpdateUser = Partial<typeof userTable.$inferInsert>;
export type Session = typeof sessionTable.$inferSelect;
export type NewSession = typeof sessionTable.$inferInsert;
export type NewUserInvite = typeof userInviteTable.$inferInsert;
export type NewStaffLocationInvite = typeof companyStaffInviteLocations.$inferInsert;
