import { desc, eq, count, sql } from 'drizzle-orm';
import db from '$lib/server/database/drizzle';
import {
	clientCompanyTable,
	clientProfileTable,
	clientStaffProfileTable,
	companyOfficeLocationTable,
	type ClientCompany,
	type ClientCompanyLocation,
	type ClientCompanyStaffProfile,
	type ClientProfile,
	type UpdateClientProfile
} from '../schemas/client';
import { userTable } from '../schemas/auth';
import { convertRecurrenceDayToEvent } from '$lib/components/calendar/utils';
import { recurrenceDayTable, requisitionTable } from '../schemas/requisition';

export type ClientWithCompanyRaw = {
	birthday: string | null;
	company_name: string;
	created_at: Date;
	email: string;
	first_name: string;
	id: string;
	last_name: string;
	updated_at: Date;
	user_id: string;
};
export type ClientResults = ClientWithCompanyRaw[];

export async function createClientProfile(values: ClientProfile) {
	const result = await db
		.insert(clientProfileTable)
		.values(values)
		.onConflictDoNothing()
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}
export async function updateClientProfile(clientId: string, values: UpdateClientProfile) {
	const result = await db
		.update(clientProfileTable)
		.set(values)
		.where(eq(clientProfileTable.id, clientId))
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function getClientProfilesCount() {
	const countResult = await db.select({ value: count() }).from(clientProfileTable);

	return countResult[0].value;
}

export async function getPaginatedClientProfiles({
	limit = 25,
	offset = 0,
	orderBy = undefined
}: {
	limit: number;
	offset: number;
	orderBy?: { column: string; direction: string };
}) {
	const userCols = ['email', 'first_name', 'last_name'];
	const companyCols = ['company_name'];
	const orderSelector = orderBy
		? userCols.includes(orderBy.column)
			? `u.${orderBy.column}`
			: companyCols.includes(orderBy.column)
				? `${orderBy.column}`
				: `c.${orderBy.column}`
		: null;

	try {
		const query = sql.empty();

		query.append(sql`
		SELECT 
			c.*, 
			u.first_name, 
			u.last_name, 
			u.email, 
			co.company_name
		FROM ${clientProfileTable} AS c
		INNER JOIN ${userTable} u ON c.user_id = u.id
		INNER JOIN ${clientCompanyTable} co ON c.id = co.client_id
     `);

		if (orderSelector && orderBy) {
			query.append(sql`
		   ORDER BY ${
					orderBy.direction === 'asc'
						? sql`${sql.raw(orderSelector)} ASC`
						: sql`${sql.raw(orderSelector)} DESC`
				}
		 `);
		} else {
			query.append(sql`
		   ORDER BY c.created_at DESC
		 `);
		}

		query.append(sql`
       LIMIT ${limit}
       OFFSET ${offset}
     `);

		const results = await db.execute(query);

		const count = await getClientProfilesCount();

		return { clients: results.rows, count };
	} catch (err) {
		console.error(err);
	}
}

export async function getAllClientProfiles() {
	const results = await db
		.select({
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
			profile: { ...clientProfileTable },
			company: { ...clientCompanyTable }
		})
		.from(clientProfileTable)
		.innerJoin(clientCompanyTable, eq(clientProfileTable.id, clientCompanyTable.clientId))
		.innerJoin(userTable, eq(clientProfileTable.userId, userTable.id))
		.orderBy(desc(clientProfileTable.createdAt));

	return results;
}

export async function getClientProfileById(clientId: string) {
	const result = await db
		.select({
			profile: { ...clientProfileTable },
			user: {
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
			company: { ...clientCompanyTable }
		})
		.from(clientProfileTable)
		.where(eq(clientProfileTable.id, clientId))
		.innerJoin(userTable, eq(clientProfileTable.userId, userTable.id))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.clientId, clientId));

	return result[0] || null;
}

export async function getClientProfilebyUserId(userId: string) {
	const result = await db
		.select()
		.from(clientProfileTable)
		.where(eq(clientProfileTable.userId, userId));

	return result[0];
}
export async function getClientCompanyByClientId(clientId: string) {
	const result = await db
		.select()
		.from(clientCompanyTable)
		.where(eq(clientCompanyTable.clientId, clientId));

	return result[0];
}

export async function getClientStaffProfilebyUserId(userId: string) {
	const result = await db
		.select()
		.from(clientStaffProfileTable)
		.where(eq(clientStaffProfileTable.userId, userId));

	return result[0];
}

export async function getClientStaffProfilebyClientId(clientId: string) {
	const result = await db
		.select()
		.from(clientStaffProfileTable)
		.where(eq(clientStaffProfileTable.clientId, clientId));

	return result[0];
}

export async function getClientLocationsByCompanyId(companyId: string) {
	const results = await db
		.select()
		.from(companyOfficeLocationTable)
		.where(eq(companyOfficeLocationTable.companyId, companyId));

	return results;
}

export async function getClientStaffLocations(userId: string) {}

export async function getClientSubscription(clientId: string) {}

export async function createCompanyLocation(values: ClientCompanyLocation) {
	const result = await db
		.insert(companyOfficeLocationTable)
		.values(values)
		.onConflictDoNothing()
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function createCompanyStaffProfile(values: ClientCompanyStaffProfile) {}

export async function createClientCompany(values: ClientCompany) {
	const result = await db
		.insert(clientCompanyTable)
		.values(values)
		.onConflictDoNothing()
		.returning();

	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function getCalendarEventsForClient(userId: string) {
	const clientCompanyResult = await db
		.select({
			client: { ...clientProfileTable },
			company: { ...clientCompanyTable }
		})
		.from(clientProfileTable)
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.clientId, clientProfileTable.id))
		.where(eq(clientProfileTable.userId, userId));

	if (!clientCompanyResult.length) {
		return null;
	}

	const recurrenceDays = await db
		.select({
			recurrenceDay: { ...recurrenceDayTable },
			requisition: { ...requisitionTable, client: { ...clientCompanyTable } }
		})
		.from(recurrenceDayTable)
		.where(eq(requisitionTable.companyId, clientCompanyResult[0].company.id))
		.innerJoin(requisitionTable, eq(requisitionTable.id, recurrenceDayTable.requisitionId))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.id, requisitionTable.companyId));

	const recurrenceDayEvents = recurrenceDays.map((recurrenceDay) =>
		convertRecurrenceDayToEvent(recurrenceDay.recurrenceDay, recurrenceDay.requisition)
	);

	return [...recurrenceDayEvents];
}
