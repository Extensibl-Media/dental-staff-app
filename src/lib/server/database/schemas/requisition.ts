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
	integer,
	primaryKey,
	json,
	index,
	uuid
} from 'drizzle-orm/pg-core';
import {
	clientCompanyTable,
	clientProfileTable,
	companyOfficeLocationTable,
	type ClientCompanySelect
} from './client';
import { candidateProfileTable, type CandidateProfileSelect } from './candidate';
import { disciplineTable, experienceLevelTable } from './skill';

export type RawTimesheetHours = {
	date: string;
	hours: number;
	startTime: string;
	endTime: string;
};

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

export const recurrenceDayStatusEnum = pgEnum('workday_status_enum', [
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
	experienceLevelId: text('experience_level_id').references(() => experienceLevelTable.id),
	archived: boolean('archived').default(false),
	archivedDate: timestamp('archived_at', {
		mode: 'date'
	}),
	hourlyRate: smallint('hourly_rate'),
	permanentPosition: boolean('permanent_position').default(false)
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
	status: recurrenceDayStatusEnum('status').default('OPEN').notNull(),
	date: date('date', { mode: 'string' }).notNull(),
	dayStartTime: time('day_start_time', { withTimezone: true }).notNull(),
	dayEndTime: time('day_end_time', { withTimezone: true }).notNull(),
	lunchStartTime: time('lunch_start_time', { withTimezone: true }).notNull(),
	lunchEndTime: time('lunch_end_time', { withTimezone: true }).notNull(),
	requisitionId: integer('requisition_id').references(() => requisitionTable.id, {
		onDelete: 'cascade',
		onUpdate: 'cascade'
	}),
	archived: boolean('archived').default(false),
	archivedDate: timestamp('archived_at', {
		mode: 'date'
	})
});

export const invoiceStatusEnum = pgEnum('invoice_status', [
	'DRAFT',
	'PENDING',
	'PAID',
	'VOID',
	'OVERDUE'
]);

export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

export const invoiceTable = pgTable(
	'invoices',
	{
		id: uuid('id').notNull().unique().defaultRandom().primaryKey(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'date'
		}).notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'date'
		}).notNull(),
		status: invoiceStatusEnum('status').notNull().default('DRAFT'),
		invoiceNumber: text('invoice_number').notNull(),
		dueDate: timestamp('due_date', {
			withTimezone: true,
			mode: 'date'
		}),
		paidDate: timestamp('paid_date', {
			withTimezone: true,
			mode: 'date'
		}),
		totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
		candidateId: text('candidate_id')
			.notNull()
			.references(() => candidateProfileTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		requisitionId: integer('requisition_id')
			.notNull()
			.references(() => requisitionTable.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade'
			}),
		clientId: text('client_id')
			.references(() => clientProfileTable.id, { onDelete: 'cascade' })
			.notNull(),
		timesheetId: text('timesheet_id')
			.references(() => timeSheetTable.id, { onDelete: 'cascade' })
			.notNull()
	},
	(table) => ({
		statusIdx: index('invoice_status_idx').on(table.status),
		candidateIdx: index('invoice_candidate_idx').on(table.candidateId),
		clientIdx: index('invoice_client_idx').on(table.clientId),
		dueDateIdx: index('invoice_due_date_idx').on(table.dueDate),
		clientStatusIdx: index('invoice_client_status_idx').on(table.clientId, table.status),
		statusDueDateIdx: index('invoice_status_due_date_idx').on(table.status, table.dueDate)
	})
);

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
	candidateId: text('candidate_id')
		.notNull()
		.references(() => candidateProfileTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	requisitionId: integer('requisition_id')
		.notNull()
		.references(() => requisitionTable.id, {
			onDelete: 'cascade',
			onUpdate: 'cascade'
		}),
	recurrenceDayId: text('recurrence_day_id').references(() => recurrenceDayTable.id, {
		onDelete: 'cascade',
		onUpdate: 'cascade'
	})
});

export const timesheetStatusEnum = pgEnum('timesheet_status', [
	'PENDING',
	'APPROVED',
	'DISCREPANCY',
	'REJECTED',
	'VOID'
]);

export const timeSheetTable = pgTable(
	'timesheets',
	{
		id: text('id').notNull().primaryKey(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'date'
		}).notNull(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'date'
		}).notNull(),
		associatedClientId: text('associated_client_id')
			.references(() => clientProfileTable.id, { onDelete: 'cascade' })
			.notNull(),
		associatedCandidateId: text('associated_candidate_id')
			.references(() => candidateProfileTable.id)
			.notNull(),
		validated: boolean('validated').default(false),
		totalHoursWorked: decimal('total_hours_worked'),
		totalHoursBilled: decimal('total_hours_billed'),
		awaitingClientSignature: boolean('awaiting_client_signature').default(true),
		candidateRateBase: decimal('candidate_rate_base'),
		candidateRateOT: decimal('candidate_rate_overtime'),
		requisitionId: integer('requisition_id').references(() => requisitionTable.id, {
			onDelete: 'set null',
			onUpdate: 'set null'
		}),
		workdayId: text('workday_id')
			.references(() => workdayTable.id)
			.notNull(),
		weekBeginDate: date('week_begin_date', {
			mode: 'string'
		}).notNull(),
		hoursRaw: json('hours_raw').$type<RawTimesheetHours[]>().notNull().default([]),
		status: timesheetStatusEnum('status').default('PENDING').notNull()
	},
	(table) => ({
		candidateIdx: index('timesheet_candidate_idx').on(table.associatedCandidateId),
		clientIdx: index('timesheet_client_idx').on(table.associatedClientId),
		weekBeginIdx: index('timesheet_week_begin_idx').on(table.weekBeginDate),
		requisitionIdx: index('timesheet_requisition_idx').on(table.requisitionId)
	})
);

export const requisitionApplicationStatusEnum = pgEnum('requisition_application_status', [
	'PENDING',
	'APPROVED',
	'DENIED'
]);

export const requisitionApplicationTable = pgTable('requisition_application', {
	id: text('id').notNull().primaryKey(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'date'
	}).notNull(),
	clientId: text('client_id')
		.notNull()
		.references(() => clientProfileTable.id),
	requisitionId: integer('requisition_id')
		.references(() => requisitionTable.id, { onDelete: 'cascade', onUpdate: 'cascade' })
		.notNull(),
	candidateId: text('candidate_id')
		.references(() => candidateProfileTable.id, { onDelete: 'cascade', onUpdate: 'cascade' })
		.notNull(),
	status: requisitionApplicationStatusEnum('application_status').default('PENDING'),
	archived: boolean('archived').default(false),
	archivedDate: timestamp('archived_at', {
		mode: 'date'
	})
});

export const candidateRequisitionSavesTable = pgTable(
	'candidate_saved_requisitions',
	{
		candidateId: text('candidate_id')
			.notNull()
			.references(() => candidateProfileTable.id, { onDelete: 'cascade' }),
		requisitionId: integer('requisition_id')
			.notNull()
			.references(() => requisitionTable.id, { onDelete: 'cascade' }),
		savedAt: timestamp('saved_at', {
			withTimezone: true,
			mode: 'date'
		})
			.notNull()
			.defaultNow()
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.candidateId, table.requisitionId] })
		};
	}
);

export type Requisition = typeof requisitionTable.$inferInsert;
export type UpdateRequisition = Partial<typeof requisitionTable.$inferInsert>;

export type RecurrenceDay = typeof recurrenceDayTable.$inferInsert;
export type UpdateRecurrenceDay = Partial<typeof recurrenceDayTable.$inferInsert>;

export type RequisitionApplication = typeof requisitionApplicationTable.$inferInsert;

export type Invoice = typeof invoiceTable.$inferInsert;
export type UpdateInvoice = Partial<typeof invoiceTable.$inferInsert>;

export type TimeSheet = typeof timeSheetTable.$inferInsert;
export type UpdateTimeSheet = Partial<typeof timeSheetTable.$inferInsert>;

export type Workday = typeof workdayTable.$inferInsert;
export type UpdateWorkday = Partial<typeof workdayTable.$inferInsert>;

export type CandidateRequisitionSave = typeof candidateRequisitionSavesTable.$inferInsert;
export type UpdateCandidateRequisitionSave = Partial<
	typeof candidateRequisitionSavesTable.$inferInsert
>;

// Add select types for more precise querying
export type RequisitionSelect = typeof requisitionTable.$inferSelect;
export type RecurrenceDaySelect = typeof recurrenceDayTable.$inferSelect;
export type InvoiceSelect = typeof invoiceTable.$inferSelect;
export type TimeSheetSelect = typeof timeSheetTable.$inferSelect;
export type WorkdaySelect = typeof workdayTable.$inferSelect;
export type RequisitionApplicationSelect = typeof requisitionApplicationTable.$inferSelect;
export type CandidateRequisitionSaveSelect = typeof candidateRequisitionSavesTable.$inferSelect;
export type RecurrenceDayWithWorkdaySelect = {
	recurrenceDay: RecurrenceDaySelect;
	workday: WorkdaySelect;
};

type UserSelect = {
	id: string;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
};

// Timesheet query result type
export type TimesheetWithRelations = {
	timesheet: TimeSheetSelect;
	candidate: CandidateProfileSelect;
	clientCompany?: ClientCompanySelect;
	user: Partial<UserSelect>;
	requisition: RequisitionSelect | null; // null because of leftJoin // null because of leftJoin
};

export type InvoiceWithRelations = {
	invoice: InvoiceSelect;
	candidate: CandidateProfileSelect & {
		avatarUrl?: string | null;
		firstName?: string;
		lastName?: string;
	};
	user?: UserSelect;
	timesheet: TimeSheetSelect;
	requisition: RequisitionSelect; // null because of leftJoin
};
