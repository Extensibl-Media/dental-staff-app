import { jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { userTable } from './auth';

export const adminNoteTable = pgTable('admin_notes', {
	id: text('id').notNull().primaryKey(),
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
	title: text('title').notNull(),
	createdById: text('created_by_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	forUserId: text('for_user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	body: text('body').notNull()
});

export const adminNoteCommentsTable = pgTable('admin_note_comments', {
	id: text('id').notNull().primaryKey(),
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
	adminNoteId: text('admin_note_id')
		.notNull()
		.references(() => adminNoteTable.id, { onDelete: 'cascade' }),
	createdById: text('created_by_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	body: text('body').notNull()
});

export const supportTicketStatusEnum = pgEnum('support_ticket_status', [
	'NEW',
	'PENDING',
	'CLOSED'
]);

export const supportTicketTable = pgTable('support_tickets', {
	id: text('id').notNull().primaryKey(),
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
	closedAt: timestamp('closed_at', {
		withTimezone: true,
		mode: 'date'
	}),
	additionalNotes: text('additional_notes'),
	closedById: text('closed_by_id').references(() => userTable.id, { onDelete: 'set null' }),
	reportedById: text('reported_by')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	resolutionDetails: text('resolution_details'),
	stepsToReproduce: text('steps_to_reproduce'),
	expectedResult: text('expected_result'),
	actualResults: text('actual_result'),
	status: supportTicketStatusEnum('status').default('NEW'),
	title: text('title').notNull()
});

export const supportTicketCommentTable = pgTable('support_ticket_comments', {
	id: text('id').notNull().primaryKey(),
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
	supportTicketId: text('support_ticket_id')
		.notNull()
		.references(() => supportTicketTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	fromId: text('from_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
	body: text('comment_body').notNull()
});

export const actionHistoryTable = pgTable('action_history', {
	id: text('id').notNull().primaryKey(),
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
	entityId: text('entity_id').notNull(),
	entityType: text('entity_type').notNull(),
	userId: text("user_id").notNull().references(() => userTable.id),
	action: text('action').notNull(),
	changes: jsonb('changes').$type<{
		before?: Record<string, any>,
		after?: Record<string, any>
	}>(),
	metadata: jsonb('metadata').$type<Record<string, any>>().default({})
});

export type AdminNote = typeof adminNoteTable.$inferInsert;
export type UpdateAdminNote = Partial<typeof adminNoteTable.$inferInsert>;
export type AdminNoteComment = typeof adminNoteCommentsTable.$inferInsert;
export type UpdateAdminNoteComment = Partial<typeof adminNoteCommentsTable.$inferInsert>;
export type SupportTicket = typeof supportTicketTable.$inferInsert;
export type UpdateSuportTicket = Partial<typeof supportTicketTable.$inferInsert>;
export type SupportTicketComment = typeof supportTicketCommentTable.$inferInsert;
export type UpdateSuportTicketComment = Partial<typeof supportTicketCommentTable.$inferInsert>;
export type ActionHistory = typeof actionHistoryTable.$inferInsert;
