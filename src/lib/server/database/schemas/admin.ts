import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { userTable } from './auth';

export const adminNoteTable = pgTable('admin_notes', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
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
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
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
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	closedAt: timestamp('closed_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	additionalNotes: text('additional_notes'),
	closedById: text('closed_by_id').references(() => userTable.id, { onDelete: 'set null' }),
	reportedById: text('reported_by')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	resolutionDetails: text('resolution_details'),
	stepsToReproduce: text('steps_to_reproduce'),
	expectedResult: text('expected_result'),
	actualResult: text('actual_result'),
	status: supportTicketStatusEnum('status').default('NEW')
});

export const actionHistoryTable = pgTable('action_history', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	entityId: text('entity_id').notNull()
});
