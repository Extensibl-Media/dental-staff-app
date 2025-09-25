/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql, count, eq, desc, lt, and, ne, ilike, or } from 'drizzle-orm';
import db from '../drizzle';
import { userTable, type UpdateUser, type User } from '$lib/server/database/schemas/auth';
import { DEFAULT_MAX_RECORD_LIMIT, USER_ROLES } from '$lib/config/constants';
import {
	invoiceTable,
	recurrenceDayTable,
	requisitionTable,
	timeSheetTable,
	workdayTable,
	type InvoiceWithRelations
} from '$lib/server/database/schemas/requisition';
import { clientCompanyTable, clientProfileTable } from '$lib/server/database/schemas/client';
import { convertRecurrenceDayToEvent } from '$lib/components/calendar/utils';
import type { PgTable, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { actionHistoryTable, supportTicketTable } from '$lib/server/database/schemas/admin';
import type { PaginateOptions } from '$lib/types';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import {
	getRecurrenceDaysForTimesheet,
	getWorkdaysForTimesheet,
	type TimesheetDiscrepancy,
	validateTimesheet
} from '$lib/server/database/queries/requisitions';
import { get } from 'svelte/store';
import type Stripe from 'stripe';
import { error } from '@sveltejs/kit';

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export type AdminUserRaw = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	role: string;
	avatar_url: string;
};

export type AdminUserResults = AdminUserRaw[];

export async function getAdminUsers(searchTerm?: string) {
	try {
		const results = await db
			.select({
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl,
				role: userTable.role
			})
			.from(userTable)
			.where(
				and(
					eq(userTable.role, USER_ROLES.SUPERADMIN),
					searchTerm
						? or(
								ilike(userTable.email, `%${searchTerm}%`),
								ilike(userTable.firstName, `%${searchTerm}%`),
								ilike(userTable.lastName, `%${searchTerm}%`)
							)
						: undefined
				)
			)
			.orderBy(desc(userTable.createdAt))
			.limit(DEFAULT_MAX_RECORD_LIMIT);

		return results;
	} catch (err) {
		throw error(500, 'Failed to fetch admin users');
	}
}

export async function getPaginatedAdminUsers({
	limit = 25,
	offset = 0,
	orderBy = undefined
}: PaginateOptions) {
	try {
		const orderSelector = orderBy ? `u.${orderBy.column}` : null;

		const query = sql.empty();

		query.append(sql`
			SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.avatar_url
			FROM ${userTable} AS u
			WHERE u.role = 'SUPERADMIN'
		`);

		if (orderSelector && orderBy) {
			query.append(sql`
				ORDER BY
				${
					orderBy.direction === 'asc'
						? sql`${sql.raw(orderSelector)}
						ASC`
						: sql`${sql.raw(orderSelector)}
						DESC`
				}
			`);
		} else {
			query.append(sql`
				ORDER BY u.created_at DESC
			`);
		}

		query.append(sql`
			LIMIT
			${limit}
      OFFSET
			${offset}
		`);

		const countResult = await db
			.select({ value: count() })
			.from(userTable)
			.where(eq(userTable.role, USER_ROLES.SUPERADMIN));

		const results = await db.execute(query);

		return {
			admins: results.rows,
			count: countResult[0].value
		};
	} catch (error) {
		console.error(error);
	}
}

export async function getAdminUserById(id: string) {
	const [result] = await db
		.select({
			id: userTable.id,
			firstName: userTable.firstName,
			lastName: userTable.lastName,
			email: userTable.email,
			avatarUrl: userTable.avatarUrl,
			role: userTable.role
		})
		.from(userTable)
		.where(and(eq(userTable.id, id), eq(userTable.role, USER_ROLES.SUPERADMIN)));

	return result;
}

export async function updateAdminUserProfile(id: string, values: UpdateUser) {
	const [result] = await db
		.update(userTable)
		.set({
			...values,
			updatedAt: new Date()
		})
		.where(and(eq(userTable.id, id), eq(userTable.role, USER_ROLES.SUPERADMIN)))
		.returning();
}

export async function deleteAdminUser(id: string) {}

export async function getCalendarEventsForAdmin(userId: string) {
	const adminUser = await db
		.select({ id: userTable.id, role: userTable.role })
		.from(userTable)
		.where(eq(userTable.id, userId));

	if (!adminUser.length) {
		throw new Error('NO ADMIN ACCESS');
	}

	const recurrenceDays = await db
		.select({
			recurrenceDay: { ...recurrenceDayTable },
			requisition: { ...requisitionTable, client: { ...clientCompanyTable } }
		})
		.from(recurrenceDayTable)
		.innerJoin(requisitionTable, eq(requisitionTable.id, recurrenceDayTable.requisitionId))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.id, requisitionTable.companyId))
		.where(eq(requisitionTable.archived, false));

	const recurrenceDayEvents = recurrenceDays.map((recurrenceDay) =>
		convertRecurrenceDayToEvent(recurrenceDay.recurrenceDay, recurrenceDay.requisition)
	);

	return [...recurrenceDayEvents];
}

export async function getNewClientSignupsPreview(limit: number) {
	const result = await db
		.select({
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl,
				email: userTable.email
			},
			clientProfile: { ...clientProfileTable },
			company: { ...clientCompanyTable }
		})
		.from(clientProfileTable)
		.innerJoin(userTable, eq(userTable.id, clientProfileTable.userId))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.clientId, clientProfileTable.id))
		.limit(limit)
		.orderBy(desc(clientProfileTable.createdAt));

	return result;
}

export const writeActionHistory = async ({
	table,
	userId,
	action,
	entityId,
	beforeState,
	afterState,
	metadata = {}
}: {
	table: string;
	userId: string;
	action: ActionType;
	entityId: string;
	beforeState?: Record<string, any>;
	afterState?: Record<string, any>;
	metadata?: Record<string, any>;
}) => {
	try {
		const [result] = await db
			.insert(actionHistoryTable)
			.values({
				id: crypto.randomUUID(),
				entityId,
				entityType: table,
				userId,
				action,
				changes: {
					before: beforeState,
					after: afterState
				},
				metadata
			})
			.returning();

		return result;
	} catch (error) {
		console.error('Failed to write action history:', error);
		throw new Error('Failed to record action history');
	}
};

export async function getOpenSupportTicketsCount() {
	const [result] = await db
		.select({ count: count() })
		.from(supportTicketTable)
		.where(ne(supportTicketTable.status, 'CLOSED'));

	return result.count;
}

export async function getSupportTicketsPreview(limit: number) {
	const result = await db
		.select({
			supportTicket: { ...supportTicketTable },
			reportedBy: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			}
		})
		.from(supportTicketTable)
		.innerJoin(userTable, eq(supportTicketTable.reportedById, userTable.id))
		.where(ne(supportTicketTable.status, 'CLOSED'))
		.limit(limit)
		.orderBy(desc(supportTicketTable.updatedAt));

	return result;
}

export async function getRequisitionsPreviewAdmin(limit: number) {
	const result = await db
		.select({
			requisition: { ...requisitionTable },
			client: { ...clientProfileTable },
			company: { ...clientCompanyTable },
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl,
				email: userTable.email
			}
		})
		.from(requisitionTable)
		.leftJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
		.leftJoin(clientProfileTable, eq(clientCompanyTable.clientId, clientProfileTable.id))
		.leftJoin(userTable, eq(clientProfileTable.userId, userTable.id))
		.limit(limit)
		.orderBy(desc(requisitionTable.createdAt));

	return result;
}

export async function getDiscrepanciesForAdminDashboard() {
	const timesheets = await db
		.select({
			timeSheetId: timeSheetTable.id,
			createdAt: timeSheetTable.createdAt,
			updatedAt: timeSheetTable.updatedAt,
			totalHoursWorked: timeSheetTable.totalHoursWorked,
			totalHoursBilled: timeSheetTable.totalHoursBilled,
			weekBeginDate: timeSheetTable.weekBeginDate,
			requisitionId: requisitionTable.id,
			clientCompanyName: clientCompanyTable.companyName,
			validated: timeSheetTable.validated,
			awaitingClientSignature: timeSheetTable.awaitingClientSignature,
			candidateRateBase: timeSheetTable.candidateRateBase,
			candidateRateOT: timeSheetTable.candidateRateOT,
			hoursRaw: timeSheetTable.hoursRaw,
			workdayId: timeSheetTable.workdayId,
			status: timeSheetTable.status,
			candidate: {
				...candidateProfileTable,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl,
				email: userTable.email
			}
		})
		.from(timeSheetTable)
		.innerJoin(requisitionTable, eq(timeSheetTable.requisitionId, requisitionTable.id))
		.innerJoin(clientProfileTable, eq(timeSheetTable.associatedClientId, clientProfileTable.id))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.clientId, clientProfileTable.id))
		.leftJoin(workdayTable, eq(timeSheetTable.workdayId, workdayTable.id))
		.leftJoin(
			candidateProfileTable,
			eq(timeSheetTable.associatedCandidateId, candidateProfileTable.id)
		)
		.innerJoin(userTable, eq(userTable.id, candidateProfileTable.userId))
		.where(ne(timeSheetTable.status, 'APPROVED'))
		.limit(DEFAULT_MAX_RECORD_LIMIT);

	const allDiscrepancies: TimesheetDiscrepancy[] = [];

	for (const timesheet of timesheets) {
		const recurrenceDays = await getRecurrenceDaysForTimesheet(timesheet);
		const workdays = await getWorkdaysForTimesheet(timesheet);
		const discrepancies = validateTimesheet(timesheet, recurrenceDays, workdays);
		allDiscrepancies.push(...discrepancies);
	}

	console.log('Discrepancies found:', allDiscrepancies);
	return allDiscrepancies;
}

export async function getNewCandidateSignupsPreview(limit: number) {
	const result = await db
		.select({
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl,
				email: userTable.email
			},
			profile: { ...candidateProfileTable }
		})
		.from(candidateProfileTable)
		.innerJoin(userTable, eq(userTable.id, candidateProfileTable.userId))
		.where(eq(candidateProfileTable.status, 'PENDING'))
		.limit(limit)
		.orderBy(desc(candidateProfileTable.createdAt));

	return result;
}

export async function getTimesheetsDueCount() {
	const [result] = await db
		.select({ count: count() })
		.from(timeSheetTable)
		.where(eq(timeSheetTable.status, 'PENDING'));

	return result.count;
}

export async function getInvoicesDueCount() {
	const [result] = await db
		.select({ count: count() })
		.from(invoiceTable)
		.where(lt(invoiceTable.dueDate, new Date()));

	return result.count;
}

export async function getInvoicesDuePreview(limit: number): Promise<InvoiceWithRelations[]> {
	const result = await db
		.select({
			invoice: invoiceTable,
			candidateProfile: candidateProfileTable,
			candidateUser: {
				id: sql<string>`candidate_user
				.
				id`,
				firstName: sql<string>`candidate_user
				.
				first_name`,
				lastName: sql<string>`candidate_user
				.
				last_name`,
				avatarUrl: sql<string>`candidate_user
				.
				avatar_url`
			},
			timesheet: timeSheetTable,
			requisition: requisitionTable,
			client: clientProfileTable,
			clientCompany: clientCompanyTable,
			clientUser: {
				id: sql<string>`client_user
				.
				id`,
				firstName: sql<string>`client_user
				.
				first_name`,
				lastName: sql<string>`client_user
				.
				last_name`,
				avatarUrl: sql<string>`client_user
				.
				avatar_url`
			}
		})
		.from(invoiceTable)
		.leftJoin(candidateProfileTable, eq(invoiceTable.candidateId, candidateProfileTable.id))
		.leftJoin(
			sql`${userTable}
			as candidate_user`,
			sql`${candidateProfileTable.userId}
			= candidate_user.id`
		)
		.leftJoin(timeSheetTable, eq(invoiceTable.timesheetId, timeSheetTable.id))
		.leftJoin(requisitionTable, eq(invoiceTable.requisitionId, requisitionTable.id))
		.innerJoin(clientProfileTable, eq(invoiceTable.clientId, clientProfileTable.id))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.clientId, clientProfileTable.id))
		.innerJoin(
			sql`${userTable}
			as client_user`,
			sql`${clientProfileTable.userId}
			= client_user.id`
		)
		.orderBy(desc(invoiceTable.createdAt))
		.where(and(lt(invoiceTable.dueDate, new Date()), eq(invoiceTable.status, 'open')))
		.limit(limit);

	return result.map((row) => ({
		invoice: row.invoice,
		candidate:
			row.candidateProfile && row.candidateUser
				? {
						profile: row.candidateProfile,
						user: row.candidateUser
					}
				: null,
		timesheet: row.timesheet,
		requisition: row.requisition,
		lineItems: (row.invoice.lineItems as Stripe.InvoiceLineItem[]) || [],
		client: row.client,
		clientUser: row.clientUser,
		company: row.clientCompany
	}));
}

export async function getAdminDashboardData() {
	const [
		timesheetsDueCount,
		supportTickets,
		openSupportTicketsCount,
		discrepancies,
		newCandidateProfilesPreview,
		newClientSignups,
		invoicesDueCount,
		invoicesDue,
		requisitions
	] = await Promise.all([
		await getTimesheetsDueCount(),
		await getSupportTicketsPreview(10),
		await getOpenSupportTicketsCount(),
		await getDiscrepanciesForAdminDashboard(),
		await getNewCandidateSignupsPreview(10),
		await getNewClientSignupsPreview(10),
		await getInvoicesDueCount(),
		await getInvoicesDuePreview(10),
		await getRequisitionsPreviewAdmin(10)
	]);

	return {
		timesheetsDueCount,
		supportTickets,
		openSupportTicketsCount,
		discrepancies,
		newCandidateProfiles: newCandidateProfilesPreview,
		newClientSignups,
		invoicesDueCount,
		invoicesDue,
		requisitions
	};
}
