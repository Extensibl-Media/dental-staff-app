import {
	pgTable,
	text,
	timestamp,
	boolean,
	smallint,
	date,
	time,
	pgEnum,
	decimal,
	serial,
	integer
} from 'drizzle-orm/pg-core';
import { clientCompanyTable, clientProfileTable, companyOfficeLocationTable } from './client';
import { candidateProfileTable } from './candidate';
import { disciplineTable, experienceLevelTable } from './skill';

export const timeCategoryEnum = pgEnum('time_category_enum', [
	'R',
	'PTO',
	'UPTO',
	'H',
	'OT',
	'EXREIM',
	'ME'
]);

export const requisitionStatusEnum = pgEnum('requisition_status_enum', [
	'PENDING',
	'OPEN',
	'FILLED',
	'UNFULFILLED',
	'CANCELED'
]);

export const requisitionTable = pgTable('requisitions', {
	id: serial('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	status: requisitionStatusEnum('status').default('PENDING').notNull(),
	title: text('name').notNull(),
	companyId: text('client_id')
		.notNull()
		.references(() => clientCompanyTable.id),
	locationId: text('location_id')
		.notNull()
		.references(() => companyOfficeLocationTable.id),
	disciplineId: text('discipline_id')
		.notNull()
		.references(() => disciplineTable.id),
	jobDescription: text('job_description').notNull(),
	specialInstructions: text('special_instructions'),
	experienceLevelId: text('experience_level_id').references(() => experienceLevelTable.id)
});

export const recurrenceDayTable = pgTable('recurrence_days', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	date: date('date', { mode: 'string' }).notNull(),
	dayStartTime: time('day_start_time', { withTimezone: true }).notNull(),
	dayEndTime: time('day_end_time', { withTimezone: true }).notNull(),
	lunchStartTime: time('lunch_start_time', { withTimezone: true }).notNull(),
	lunchEndTime: time('lunch_end_time', { withTimezone: true }).notNull(),
	requisitionId: integer('requisition_id').references(() => requisitionTable.id, {
		onDelete: 'cascade',
		onUpdate: 'cascade'
	})
});

export const invoiceTable = pgTable('invoices', {});

export const calendarDayTable = pgTable('calendar_days', {});

export const timeSheetTable = pgTable('timesheets', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	associatedClient: text('associated_client_id')
		.references(() => clientProfileTable.id, { onDelete: 'cascade' })
		.notNull(),
	associatedCandidate: text('associated_candidate_id')
		.references(() => candidateProfileTable.id)
		.notNull(),
	validated: boolean('validated').default(false),
	totalHoursWorked: decimal('total_hours_worked'),
	totalHoursBilled: decimal('total_hours_billed'),
	awaitingClientSignature: boolean('awaiting_client_signature').default(true),
	candidateRateBase: smallint('candidate_rate_base'),
	candidateRateOT: smallint('candidate_rate_overtime'),
	requisitionId: integer('requisition_id').references(() => requisitionTable.id, {
		onDelete: 'cascade',
		onUpdate: 'cascade'
	})
});

export const workdayTable = pgTable('workdays', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	timesheetId: text('timesheet_id')
		.references(() => timeSheetTable.id)
		.notNull(),
	date: date('date', { mode: 'date' }).notNull(),
	dayStartTime: time('day_start_time', { withTimezone: true }).notNull(),
	dayEndTime: time('day_end_time', { withTimezone: true }).notNull(),
	lunchStartTime: time('lunch_start_time', { withTimezone: true }).notNull(),
	lunchEndTime: time('lunch_end_time', { withTimezone: true }).notNull(),
	hoursWorked: smallint('hours_worked').notNull(),
	hoursWorkedClient: smallint('hours_worked_client').notNull(),
	canceled: boolean('canceled').default(false),
	filledOut: boolean('filled_out').default(false),
	timeCategory: timeCategoryEnum('time_category'),
	candidateId: text('candidate_id')
		.notNull()
		.references(() => candidateProfileTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	requisitionId: integer('requisition_id')
		.notNull()
		.references(() => requisitionTable.id, {
			onDelete: 'cascade',
			onUpdate: 'cascade'
		})
});

export type Requisition = typeof requisitionTable.$inferInsert;
export type UpdateRequisition = Partial<typeof requisitionTable.$inferInsert>;
export type RecurrenceDay = typeof recurrenceDayTable.$inferInsert;
export type UpdateRecurrenceDay = Partial<typeof recurrenceDayTable.$inferInsert>;
