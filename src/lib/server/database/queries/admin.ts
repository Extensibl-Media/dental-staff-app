import { sql, count, eq } from 'drizzle-orm';
import db from '../drizzle';
import { userTable, type UpdateUser, type User } from '../schemas/auth';
import { USER_ROLES } from '$lib/config/constants';
import { recurrenceDayTable, requisitionTable } from '../schemas/requisition';
import { clientCompanyTable } from '../schemas/client';
import { convertRecurrenceDayToEvent } from '$lib/components/calendar/utils';
import type { PgTable, PgTableWithColumns } from 'drizzle-orm/pg-core';
import { actionHistoryTable } from '../schemas/admin';
import type { PaginateOptions } from '$lib/types';

export type ActionType = "CREATE" | "UPDATE" | "DELETE";

const TABLE_NAMES: Record<string, string> = {
	workdays: 'Workday',
	timesheets: 'Timesheet',
	invoices: 'Invoice',
	recurrence_days: "Recurrence Day",
	requisitions: 'Requisition'
};

export type AdminUserRaw = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	role: string;
	avatar_url: string;
};

export type AdminUserResults = AdminUserRaw[];

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
    ORDER BY ${orderBy.direction === 'asc'
					? sql`${sql.raw(orderSelector)} ASC`
					: sql`${sql.raw(orderSelector)} DESC`
				}
  `);
		} else {
			query.append(sql`
    ORDER BY u.created_at DESC
  `);
		}

		query.append(sql`
      LIMIT ${limit}
      OFFSET ${offset}
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

export async function getAdminUserById(id: string) { }

export async function updateAdminUserProfile(id: string, values: UpdateUser) { }

export async function deleteAdminUser(id: string) { }

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

export const writeActionHistory = async ({
	table,
	userId,
	action,
	entityId,
	beforeState,
	afterState,
	metadata = {}
}: {
	table: PgTable;
	userId: string;
	action: ActionType;
	entityId: string;
	beforeState?: Record<string, any>;
	afterState?: Record<string, any>;
	metadata?: Record<string, any>;
}) => {
	try {
		const [result] = await db.insert(actionHistoryTable).values({
			id: crypto.randomUUID(),
			entityId,
			entityType: TABLE_NAMES[table._.name] || table._.name,
			userId,
			action,
			changes: {
				before: beforeState,
				after: afterState
			},
			metadata
		}).returning();

		return result;
	} catch (error) {
		console.error('Failed to write action history:', error);
		throw new Error('Failed to record action history');
	}
};