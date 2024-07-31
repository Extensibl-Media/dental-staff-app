import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const referralKeyTable = pgTable('referral_keys', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	blocked: boolean('blocked').default(false),
	referralCode: text('referral_code')
});
