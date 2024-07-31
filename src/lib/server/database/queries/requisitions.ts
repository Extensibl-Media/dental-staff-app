import { asc, count, eq, sql } from 'drizzle-orm';
import db from '../drizzle';
import {
	recurrenceDayTable,
	requisitionTable,
	type Requisition,
	type RecurrenceDay,
	type UpdateRecurrenceDay,
	type UpdateRequisition
} from '../schemas/requisition';
import { userTable } from '../schemas/auth';
import {
	clientCompanyTable,
	clientProfileTable,
	companyOfficeLocationTable
} from '../schemas/client';
import { disciplineTable, experienceLevelTable } from '../schemas/skill';
import { regionTable, subRegionTable } from '../schemas/region';

export type RequisitionDetailsRaw = {
	id: number;
	created_at: string;
	updated_at: string;
	status: 'PENDING' | 'OPEN' | 'FILLED' | 'UNFULFILLED' | 'CANCELED';
	name: string;
	client_id: string;
	location_id: string;
	discipline_id: string;
	job_description: string;
	special_instructions: string | null;
	experience_level_id: string | null;
	company_id: string;
	location_name: string;
	company_name: string;
	first_name: string;
	last_name: string;
	email: string;
	discipline_name: string;
	region_name: string;
	region_abbreviation: string;
	subregion: string | null;
};
export type RequisitionResults = RequisitionDetailsRaw[];

export async function getAllRequisitions() {
	return await db.select().from(requisitionTable);
}

export async function getPaginatedRequisitionsAdmin({
	limit = 10,
	offset = 0,
	orderBy = undefined
}: {
	limit: number;
	offset: number;
	orderBy?: { column: string; direction: string };
}) {
	try {
		const regionFields = ['region_abbreviation'];
		const companyFields = ['company_name'];
		const userCols = ['email', 'first_name', 'last_name'];
		const locationFields = ['location_name', 'region_name'];
		const disciplineFields = ['discipline_name'];

		const orderSelector = orderBy
			? companyFields.includes(orderBy.column)
				? `co.${orderBy.column}`
				: userCols.includes(orderBy.column)
					? `u.${orderBy.column}`
					: locationFields.includes(orderBy.column)
						? `lo.${orderBy.column}`
						: disciplineFields.includes(orderBy.column)
							? `d.${orderBy.column}`
							: regionFields.includes(orderBy.column)
								? `re.${orderBy.column}`
								: `r.${orderBy.column}`
			: null;

		const query = sql.empty();

		query.append(sql`
			SELECT r.*, lo.company_id AS company_id, lo.location_name, co.company_name, u.first_name, u.last_name, u.email, d.name AS discipline_name, re.name AS region_name, re.abbreviation AS region_abbreviation, sr.name AS subregion
			FROM ${requisitionTable} as r
			INNER JOIN ${companyOfficeLocationTable} lo ON r.location_id = lo.id
			INNER JOIN ${clientCompanyTable} co ON co.id = company_id
			INNER JOIN ${clientProfileTable} cl ON co.client_id = cl.id
			INNER JOIN ${userTable} u ON u.id = cl.user_id
			INNER JOIN ${disciplineTable} d ON d.id = r.discipline_id
			INNER JOIN ${regionTable} re ON re.id = lo.region_id
			LEFT JOIN ${subRegionTable} sr ON sr.region_id = re.id
		`);

		// sorting segment
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
				ORDER BY r.created_at DESC
			`);
		}

		// pagination segment
		query.append(sql`
			LIMIT ${limit}
			OFFSET ${offset}
		`);

		const results = await db.execute(query);
		const countResult = await db.select({ value: count() }).from(requisitionTable);

		return { requisitions: results.rows, count: countResult[0].value };
	} catch (error) {
		console.log(error);
	}
}
export async function getPaginatedRequisitionsforClient(
	companyId: string,
	{
		limit = 10,
		offset = 0,
		orderBy = undefined
	}: {
		limit: number;
		offset: number;
		orderBy?: { column: string; direction: string };
	}
) {
	try {
		const regionFields = ['region_abbreviation'];
		const companyFields = ['company_name'];
		const userCols = ['email', 'first_name', 'last_name'];
		const locationFields = ['location_name', 'region_name'];
		const disciplineFields = ['discipline_name'];

		const orderSelector = orderBy
			? companyFields.includes(orderBy.column)
				? `co.${orderBy.column}`
				: userCols.includes(orderBy.column)
					? `u.${orderBy.column}`
					: locationFields.includes(orderBy.column)
						? `lo.${orderBy.column}`
						: disciplineFields.includes(orderBy.column)
							? `d.${orderBy.column}`
							: regionFields.includes(orderBy.column)
								? `re.${orderBy.column}`
								: `r.${orderBy.column}`
			: null;

		const query = sql.empty();

		query.append(sql`
			SELECT r.*, lo.company_id AS company_id, lo.location_name, co.company_name, u.first_name, u.last_name, u.email, d.name AS discipline_name, re.name AS region_name, re.abbreviation AS region_abbreviation, sr.name AS subregion
			FROM ${requisitionTable} as r
			INNER JOIN ${companyOfficeLocationTable} lo ON r.location_id = lo.id
			INNER JOIN ${clientCompanyTable} co ON co.id = company_id
			INNER JOIN ${clientProfileTable} cl ON co.client_id = cl.id
			INNER JOIN ${userTable} u ON u.id = cl.user_id
			INNER JOIN ${disciplineTable} d ON d.id = r.discipline_id
			INNER JOIN ${regionTable} re ON re.id = lo.region_id
			LEFT JOIN ${subRegionTable} sr ON sr.region_id = re.id
			WHERE r.client_id = ${companyId}
		`);

		// sorting segment
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
				ORDER BY r.created_at DESC
			`);
		}

		// pagination segment
		query.append(sql`
			LIMIT ${limit}
			OFFSET ${offset}
		`);

		const results = await db.execute(query);
		const countResult = await db.select({ value: count() }).from(requisitionTable);

		return { requisitions: results.rows, count: countResult[0].value };
	} catch (error) {
		console.log(error);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRequisitionDetailsById(requisitionId: number): Promise<any | null> {
	const result = await db
		.select({
			requisition: {
				...requisitionTable,
				company: {
					...clientCompanyTable,
					client: {
						...clientProfileTable,
						user: {
							avatarUrl: userTable.avatarUrl,
							firstName: userTable.firstName,
							lastName: userTable.lastName,
							email: userTable.email,
							id: userTable.id
						}
					}
				},
				location: { ...companyOfficeLocationTable },
				discipline: { ...disciplineTable },
				experienceLevel: { ...experienceLevelTable }
			}
		})
		.from(requisitionTable)
		.where(eq(requisitionTable.id, requisitionId))
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.id, requisitionTable.companyId))
		.innerJoin(
			companyOfficeLocationTable,
			eq(companyOfficeLocationTable.id, requisitionTable.locationId)
		)
		.innerJoin(clientProfileTable, eq(clientProfileTable.id, clientCompanyTable.clientId))
		.innerJoin(userTable, eq(userTable.id, clientProfileTable.userId))
		.leftJoin(experienceLevelTable, eq(experienceLevelTable.id, requisitionTable.experienceLevelId))
		.innerJoin(disciplineTable, eq(disciplineTable.id, requisitionTable.disciplineId));

	const recurrenceDays = await db
		.select()
		.from(recurrenceDayTable)
		.where(eq(recurrenceDayTable.requisitionId, requisitionId))
		.orderBy(asc(recurrenceDayTable.date));

	if (result.length === 0) {
		return null;
	} else {
		return { requisition: result[0].requisition, recurrenceDays };
	}
}

export async function createRequisition(values: Requisition) {
	const result = await db.insert(requisitionTable).values(values).onConflictDoNothing().returning();
	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}

export async function changeRequisitionStatus(values: UpdateRequisition, id: number) {
	return await db.update(requisitionTable).set(values).where(eq(requisitionTable.id, id));
}

export async function createNewRecurrenceDay(values: RecurrenceDay) {
	const result = await db
		.insert(recurrenceDayTable)
		.values(values)
		.onConflictDoNothing()
		.returning();
	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
}
export async function editRecurrenceDay(id: string, values: UpdateRecurrenceDay) {
	const result = await db
		.update(recurrenceDayTable)
		.set(values)
		.where(eq(recurrenceDayTable.id, id));

	return result;
}

export async function deleteRecurrenceDay(id: string) {
	const result = await db
		.delete(recurrenceDayTable)
		.where(eq(recurrenceDayTable.id, id))
		.returning();

	return result;
}
