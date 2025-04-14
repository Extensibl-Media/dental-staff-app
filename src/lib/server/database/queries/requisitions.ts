/* eslint-disable @typescript-eslint/no-explicit-any */
import { and, asc, count, eq, or, sql, desc } from 'drizzle-orm';
import db from '../drizzle';
import {
	recurrenceDayTable,
	requisitionTable,
	type Requisition,
	type RecurrenceDay,
	type UpdateRecurrenceDay,
	type UpdateRequisition,
	requisitionApplicationTable,
	timeSheetTable,
	type RequisitionApplication,
	type RecurrenceDaySelect,
	workdayTable,
	invoiceTable,
	type Workday,
	type InvoiceWithRelations,
	type TimesheetWithRelations,
	type TimeSheetSelect,
	type WorkdaySelect,
	type RequisitionSelect
} from '../schemas/requisition';
import { userTable, type User } from '../schemas/auth';
import {
	clientCompanyTable,
	clientProfileTable,
	companyOfficeLocationTable
} from '../schemas/client';
import {
	disciplineTable,
	experienceLevelTable,
	type Discipline,
	type ExperienceLevel
} from '../schemas/skill';
import { regionTable, subRegionTable } from '../schemas/region';
import {
	candidateProfileTable,
	candidateDisciplineExperienceTable,
	type CandidateProfile,
	type CandidateProfileSelect
} from '../schemas/candidate';
import { error } from '@sveltejs/kit';
import { writeActionHistory } from './admin';
import { parseISO, differenceInMinutes, format, getDay } from 'date-fns';
import type { PaginateOptions } from '$lib/types';
import { normalizeDate } from '$lib/_helpers';

// Types and Interfaces
export interface TimesheetDiscrepancy {
	timeSheetId?: string;
	candidateId?: string;
	requisitionId?: number | null;
	clientCompanyName?: string | null;
	weekBeginDate?: Date;
	discrepancyType: TimesheetDiscrepancyType;
	details: string;
	hoursDiscrepancy?: number;
	hoursRaw?: Record<string, number>[];
}

export enum TimesheetDiscrepancyType {
	HOURS_MISMATCH = 'HOURS_MISMATCH',
	MISSING_RATE = 'MISSING_RATE',
	INVALID_HOURS = 'INVALID_HOURS',
	// VALIDATION_MISSING = 'VALIDATION_MISSING',
	// SIGNATURE_MISSING = 'SIGNATURE_MISSING',
	UNAUTHORIZED_WORKDAY = 'UNAUTHORIZED_WORKDAY'
}

export interface Timesheet {
	timeSheetId?: string;
	createdAt?: Date;
	updatedAt?: Date;
	totalHoursWorked?: string | null;
	totalHoursBilled?: string | null;
	weekBeginDate: Date;
	requisitionId?: number | null;
	clientCompanyName: string | null;
	validated: boolean | null;
	awaitingClientSignature: boolean | null;
	candidateRateBase: string | null;
	candidateRateOT: string | null;
	hoursRaw: { date: string; startTime: string; endTime: string; hours: number }[];
	workdayId: string | null;
	status: string;
	candidate:
		| (CandidateProfileSelect & {
				email: string;
				firstName: string;
				lastName: string;
				avatarUrl: string | null;
		  })
		| null;
}

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
	permanent_position: boolean;
};
export type RequisitionResults = RequisitionDetailsRaw[];

export type ApplicationResults = {
	application: RequisitionApplication;
	candidateProfile: CandidateProfile;
	discipline: Discipline;
	experienceLevel: ExperienceLevel;
	user: Partial<User>;
};

export type TimeSheetResults = {
	user: Partial<User>;
	timeSheet: TimeSheetSelect;
	candidateProfile: CandidateProfile;
};

export async function getAllRequisitions() {
	return await db.select().from(requisitionTable).where(eq(requisitionTable.archived, false));
}

export async function getPaginatedRequisitionsAdmin({
	limit = 10,
	offset = 0,
	orderBy = undefined
}: PaginateOptions) {
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
			WHERE r.archived = false
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
	{ limit = 10, offset = 0, orderBy = undefined }: PaginateOptions
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
			WHERE r.client_id = ${companyId} AND r.archived = false
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

export async function getRequisitionDetailsById(
	requisitionId: number,
	companyId: string | undefined
): Promise<any | null> {
	if (!companyId) throw error(400, 'Must provide company ID');
	const [result] = await db
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
		.where(
			and(
				eq(requisitionTable.id, requisitionId),
				eq(requisitionTable.archived, false),
				eq(requisitionTable.companyId, companyId)
			)
		)
		.innerJoin(clientCompanyTable, eq(clientCompanyTable.id, requisitionTable.companyId))
		.innerJoin(
			companyOfficeLocationTable,
			eq(companyOfficeLocationTable.id, requisitionTable.locationId)
		)
		.innerJoin(clientProfileTable, eq(clientProfileTable.id, clientCompanyTable.clientId))
		.innerJoin(userTable, eq(userTable.id, clientProfileTable.userId))
		.leftJoin(experienceLevelTable, eq(experienceLevelTable.id, requisitionTable.experienceLevelId))
		.innerJoin(disciplineTable, eq(disciplineTable.id, requisitionTable.disciplineId));

	if (!result) {
		return error(404, 'Requisition not found');
	} else {
		return { requisition: result.requisition };
	}
}

export async function getRecurrenceDaysForRequisition(
	requisitionId: number
): Promise<RecurrenceDaySelect[] | null> {
	const result = await db
		.select()
		.from(recurrenceDayTable)
		.where(
			and(
				eq(recurrenceDayTable.requisitionId, requisitionId),
				eq(recurrenceDayTable.archived, false)
			)
		)
		.orderBy(asc(recurrenceDayTable.date));

	if (result.length === 0) {
		return [];
	} else {
		return result;
	}
}

export async function getRequsitionsForLocation(locationId: string) {
	return await db
		.select({
			id: requisitionTable.id,
			status: requisitionTable.status,
			title: requisitionTable.title,
			experienceLevel: experienceLevelTable.value,
			discipline: disciplineTable.name
		})
		.from(requisitionTable)
		.innerJoin(disciplineTable, eq(disciplineTable.id, requisitionTable.disciplineId))
		.innerJoin(
			experienceLevelTable,
			eq(experienceLevelTable.id, requisitionTable.experienceLevelId)
		)
		.where(and(eq(requisitionTable.locationId, locationId), eq(requisitionTable.archived, false)));
}

export async function createRequisition(values: Requisition, userId: string) {
	try {
		const [result] = await db.insert(requisitionTable).values(values).returning();
		await writeActionHistory({
			table: requisitionTable,
			userId,
			action: 'CREATE',
			entityId: result.id.toString(),
			afterState: result
		});

		return result;
	} catch (err) {
		console.error('Error creating requisition', err);
		return error(500, 'Error creating requisition');
	}
}

export async function changeRequisitionStatus(
	values: UpdateRequisition,
	id: number,
	userId: string
) {
	const [original] = await db.select().from(requisitionTable).where(eq(requisitionTable.id, id));
	if (original) {
		const [update] = await db
			.update(requisitionTable)
			.set(values)
			.where(eq(requisitionTable.id, original.id))
			.returning();

		// await writeActionHistory({
		// 	table: requisitionTable,
		// 	userId,
		// 	action: 'UPDATE',
		// 	entityId: id.toString(),
		// 	beforeState: original,
		// 	afterState: update,
		// 	metadata: {
		// 		updatedField: 'STATUS'
		// 	}
		// });

		return update;
	} else {
		throw error(404, 'Requisition not found');
	}
}

export async function createNewRecurrenceDay(values: RecurrenceDay, userId: string) {
	try {
		const [result] = await db
			.insert(recurrenceDayTable)
			.values(values)
			.onConflictDoNothing()
			.returning();

		// await writeActionHistory({
		// 	table: recurrenceDayTable,
		// 	userId,
		// 	action: 'CREATE',
		// 	entityId: result.id,
		// 	afterState: result
		// });

		return result;
	} catch (err) {
		console.error('Error creating recurrence day', err);
		return error(500, 'Error creating recurrence day');
	}
}
export async function editRecurrenceDay(id: string, values: UpdateRecurrenceDay, userId: string) {
	try {
		const [existing] = await db
			.select()
			.from(recurrenceDayTable)
			.where(eq(recurrenceDayTable.id, id));

		const result = await db
			.update(recurrenceDayTable)
			.set(values)
			.where(eq(recurrenceDayTable.id, id));

		await writeActionHistory({
			entityId: id,
			table: recurrenceDayTable,
			userId,
			action: 'UPDATE',
			beforeState: existing,
			afterState: result
		});

		return result;
	} catch (error) {
		console.error(error);
	}
}

export async function deleteRecurrenceDay(id: string, userId: string) {
	try {
		const [original] = await db
			.select()
			.from(recurrenceDayTable)
			.where(eq(recurrenceDayTable.id, id));

		const [update] = await db
			.update(recurrenceDayTable)
			.set({ archived: true, archivedDate: new Date() })
			.where(eq(recurrenceDayTable.id, id))
			.returning();
		await writeActionHistory({
			table: recurrenceDayTable,
			userId,
			entityId: id,
			beforeState: original,
			afterState: update,
			action: 'DELETE'
		});

		return update;
	} catch (error) {
		console.error('Error deleting recurrence day');
	}
}

export const getRecentRequisitionApplications = async (companyId: string | undefined) => {
	if (!companyId) return error(400, 'Missing company id');
	try {
		return await db
			.select({
				application: requisitionApplicationTable,
				candidateProfile: candidateProfileTable,
				user: {
					email: userTable.email,
					firstName: userTable.firstName,
					lastName: userTable.lastName,
					avatarUrl: userTable.avatarUrl
				},
				disciplineExperience: candidateDisciplineExperienceTable,
				discipline: disciplineTable,
				experienceLevel: experienceLevelTable,
				requisition: {
					id: requisitionTable.id,
					title: requisitionTable.title,
					permanentPosition: requisitionTable.permanentPosition
				}
			})
			.from(requisitionApplicationTable)
			.innerJoin(
				candidateProfileTable,
				eq(requisitionApplicationTable.candidateId, candidateProfileTable.id)
			)
			.innerJoin(
				requisitionTable,
				eq(requisitionApplicationTable.requisitionId, requisitionTable.id)
			)
			.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
			.leftJoin(
				candidateDisciplineExperienceTable,
				and(
					eq(candidateProfileTable.id, candidateDisciplineExperienceTable.candidateId),
					eq(candidateDisciplineExperienceTable.disciplineId, requisitionTable.disciplineId)
				)
			)
			.leftJoin(
				disciplineTable,
				eq(candidateDisciplineExperienceTable.disciplineId, disciplineTable.id)
			)
			.leftJoin(
				experienceLevelTable,
				eq(candidateDisciplineExperienceTable.experienceLevelId, experienceLevelTable.id)
			)
			.where(
				and(eq(requisitionTable.permanentPosition, true), eq(requisitionTable.companyId, companyId))
			)
			.orderBy(desc(requisitionApplicationTable.createdAt))
			.limit(5);
	} catch (err) {
		console.log(err);
		throw error(500, `${err}`);
	}
};

export const getRequisitionApplications = async (requisitionId: number | undefined) => {
	if (!requisitionId) return null;
	try {
		return await db
			.select({
				application: requisitionApplicationTable,
				candidateProfile: candidateProfileTable,
				user: {
					email: userTable.email,
					firstName: userTable.firstName,
					lastName: userTable.lastName,
					avatarUrl: userTable.avatarUrl
				},
				disciplineExperience: candidateDisciplineExperienceTable,
				discipline: disciplineTable,
				experienceLevel: experienceLevelTable
			})
			.from(requisitionApplicationTable)
			.innerJoin(
				candidateProfileTable,
				eq(requisitionApplicationTable.candidateId, candidateProfileTable.id)
			)
			.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
			.leftJoin(
				candidateDisciplineExperienceTable,
				eq(candidateProfileTable.id, candidateDisciplineExperienceTable.candidateId)
			)
			.leftJoin(
				disciplineTable,
				eq(candidateDisciplineExperienceTable.disciplineId, disciplineTable.id)
			)
			.leftJoin(
				experienceLevelTable,
				eq(candidateDisciplineExperienceTable.experienceLevelId, experienceLevelTable.id)
			)
			.where(eq(requisitionApplicationTable.requisitionId, requisitionId));
	} catch (err) {
		console.log(err);
		throw error(500, `${err}`);
	}
};

export const getRequisitionApplicationDetails = async (
	requisitionId: number,
	applicationId: string
) => {
	try {
		const [application] = await db
			.select({
				application: requisitionApplicationTable,
				candidateProfile: candidateProfileTable,
				user: {
					id: userTable.id,
					email: userTable.email,
					firstName: userTable.firstName,
					lastName: userTable.lastName,
					avatarUrl: userTable.avatarUrl
				},
				disciplineExperience: candidateDisciplineExperienceTable,
				discipline: disciplineTable,
				experienceLevel: experienceLevelTable
			})
			.from(requisitionApplicationTable)
			.innerJoin(
				candidateProfileTable,
				eq(requisitionApplicationTable.candidateId, candidateProfileTable.id)
			)
			.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
			.leftJoin(
				candidateDisciplineExperienceTable,
				eq(candidateProfileTable.id, candidateDisciplineExperienceTable.candidateId)
			)
			.leftJoin(
				disciplineTable,
				eq(candidateDisciplineExperienceTable.disciplineId, disciplineTable.id)
			)
			.leftJoin(
				experienceLevelTable,
				eq(candidateDisciplineExperienceTable.experienceLevelId, experienceLevelTable.id)
			)
			.where(
				and(
					eq(requisitionApplicationTable.id, applicationId),
					eq(requisitionApplicationTable.requisitionId, requisitionId)
				)
			);

		return application;
	} catch (err) {
		console.log(err);
		throw error(500, `${err}`);
	}
};

export async function getRequisitionTimesheets(requisitionId: number | undefined) {
	if (!requisitionId) return null;
	try {
		return await db
			.select({
				user: {
					email: userTable.email,
					firstName: userTable.firstName,
					lastName: userTable.lastName,
					avatarUrl: userTable.avatarUrl
				},
				timeSheet: { ...timeSheetTable },
				candidateProfile: { ...candidateProfileTable }
			})
			.from(timeSheetTable)
			.innerJoin(
				candidateProfileTable,
				eq(timeSheetTable.associatedCandidateId, candidateProfileTable.id)
			)
			.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
			.where(eq(timeSheetTable.requisitionId, requisitionId));
	} catch (err) {
		throw error(500, `Failed to fetch timesheets: ${err}`);
	}
}

export async function getNewApplicationsCount(clientId: string) {
	try {
		const [result] = await db
			.select({ count: count() })
			.from(requisitionApplicationTable)
			.where(
				and(
					eq(requisitionApplicationTable.clientId, clientId),
					eq(requisitionApplicationTable.status, 'PENDING')
				)
			);

		return result.count;
	} catch (err) {
		console.log(err);
		return error(500, 'error getting new application count');
	}
}

export async function getRecentTimesheetsDueForClient(clientId: string) {
	try {
		const result = await db
			.select({
				timesheet: { ...timeSheetTable },
				requisition: { ...requisitionTable },
				candidate: {
					...candidateProfileTable,
					firstName: userTable.firstName,
					lastName: userTable.lastName
				}
			})
			.from(timeSheetTable)
			.leftJoin(requisitionTable, eq(requisitionTable.id, timeSheetTable.requisitionId))
			.innerJoin(
				candidateProfileTable,
				eq(candidateProfileTable.id, timeSheetTable.associatedCandidateId)
			)
			.innerJoin(userTable, eq(userTable.id, candidateProfileTable.userId))
			.where(
				and(
					eq(timeSheetTable.associatedClientId, clientId),
					eq(timeSheetTable.awaitingClientSignature, true)
				)
			);

		return result;
	} catch (err) {
		console.log(err);
		return error(500, 'Error feching timesheets due count');
	}
}
export async function getAllTimesheetsForClient(clientId: string | undefined) {
	if (!clientId) throw new Error('Client ID required');
	try {
		const result = await db
			.select({
				timesheet: { ...timeSheetTable },
				requisition: { ...requisitionTable },
				candidate: {
					...candidateProfileTable,
					firstName: userTable.firstName,
					lastName: userTable.lastName
				}
			})
			.from(timeSheetTable)
			.leftJoin(requisitionTable, eq(requisitionTable.id, timeSheetTable.requisitionId))
			.innerJoin(
				candidateProfileTable,
				eq(candidateProfileTable.id, timeSheetTable.associatedCandidateId)
			)
			.innerJoin(userTable, eq(userTable.id, candidateProfileTable.userId))
			.where(and(eq(timeSheetTable.associatedClientId, clientId)));

		return result;
	} catch (err) {
		console.log(err);
		return error(500, 'Error feching timesheets');
	}
}
export async function getTimesheetsDueCount(clientId: string) {
	console.log('getting timesheets count');
	try {
		const [result] = await db
			.select({ count: count() })
			.from(timeSheetTable)
			.where(
				and(
					eq(timeSheetTable.associatedClientId, clientId),
					eq(timeSheetTable.awaitingClientSignature, true)
				)
			);

		return result.count;
	} catch (err) {
		console.log('error getting timesheet count');
		console.log(err);
		return error(500, 'Error feching timesheets due count');
	}
}

//admin
export async function getAllTimesheetDiscrepancies(): Promise<TimesheetDiscrepancy[]> {
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
		.innerJoin(userTable, eq(userTable.id, candidateProfileTable.userId));

	const allDiscrepancies: TimesheetDiscrepancy[] = [];

	for (const timesheet of timesheets) {
		const recurrenceDays = await getRecurrenceDaysForTimesheet(timesheet);
		const workdays = await getWorkdaysForTimesheet(timesheet);
		const discrepancies = validateTimesheet(timesheet, recurrenceDays, workdays);
		allDiscrepancies.push(...discrepancies);
	}

	return allDiscrepancies;
}

export async function getClientCompanyTimesheetDiscrepancies(
	clientProfileId: string
): Promise<TimesheetDiscrepancy[]> {
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
		.where(eq(clientProfileTable.id, clientProfileId));

	const allDiscrepancies: TimesheetDiscrepancy[] = [];

	for (const timesheet of timesheets) {
		const recurrenceDays = await getRecurrenceDaysForTimesheet(timesheet);
		const workdays = await getWorkdaysForTimesheet(timesheet);
		const discrepancies = validateTimesheet(timesheet, recurrenceDays, workdays);
		allDiscrepancies.push(...discrepancies);
	}
	// console.log({ allDiscrepancies });
	return allDiscrepancies;
}

export async function getRecurrenceDaysForTimesheet(timesheet: any): Promise<RecurrenceDay[]> {
	console.log(timesheet);
	console.log(timesheet.weekBeginDate);
	const weekStart = new Date(timesheet.weekBeginDate);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 6);

	return await db
		.select({
			id: recurrenceDayTable.id,
			date: recurrenceDayTable.date,
			dayStartTime: recurrenceDayTable.dayStartTime,
			dayEndTime: recurrenceDayTable.dayEndTime,
			lunchStartTime: recurrenceDayTable.lunchStartTime,
			lunchEndTime: recurrenceDayTable.lunchEndTime,
			createdAt: recurrenceDayTable.createdAt, // Add createdAt
			updatedAt: recurrenceDayTable.updatedAt
		})
		.from(recurrenceDayTable)
		.where(
			and(
				eq(recurrenceDayTable.requisitionId, timesheet.requisitionId),
				sql`${recurrenceDayTable.date} >= ${weekStart.toISOString().split('T')[0]}`,
				sql`${recurrenceDayTable.date} <= ${weekEnd.toISOString().split('T')[0]}`
			)
		);
}

export async function getTimesheetDetails(timesheetId: string, clientId: string | undefined) {
	if (!clientId) throw error(400, 'Client ID required');
	const [timesheet] = await db
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
		.where(and(eq(timeSheetTable.id, timesheetId), eq(clientProfileTable.id, clientId)));

	if (!timesheet) throw error(404, 'Timesheet not found');

	return timesheet;
}

export async function getWorkdaysForTimesheet(timesheet: any) {
	console.log({ timesheet });
	return await db
		.select()
		.from(workdayTable)
		.where(
			and(
				eq(workdayTable.requisitionId, timesheet.requisitionId),
				eq(workdayTable.candidateId, timesheet.candidate.id)
			)
		);
}

export const getWorkdayDetails = async (
	recurrenceDayId: string | undefined,
	companyId: string | undefined
) => {
	if (!companyId) return error(400, 'Missing company id');
	if (!recurrenceDayId) return error(400, 'Missing recurrence day id');

	try {
		const [result] = await db
			.select({
				// Workday details
				workday: workdayTable,

				// Candidate information
				candidate: {
					id: candidateProfileTable.id,
					firstName: userTable.firstName,
					lastName: userTable.lastName,
					email: userTable.email,
					phoneNumber: candidateProfileTable.cellPhone,
					avatarUrl: userTable.avatarUrl
				},
				// Timesheet information
				timesheet: {
					id: timeSheetTable.id,
					totalHoursWorked: timeSheetTable.totalHoursWorked,
					totalHoursBilled: timeSheetTable.totalHoursBilled,
					validated: timeSheetTable.validated,
					awaitingClientSignature: timeSheetTable.awaitingClientSignature,
					hoursRaw: timeSheetTable.hoursRaw
				}
			})
			.from(workdayTable)
			.innerJoin(candidateProfileTable, eq(workdayTable.candidateId, candidateProfileTable.id))
			.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
			.innerJoin(requisitionTable, eq(workdayTable.requisitionId, requisitionTable.id))
			.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
			.innerJoin(
				companyOfficeLocationTable,
				eq(requisitionTable.locationId, companyOfficeLocationTable.id)
			)
			.innerJoin(disciplineTable, eq(requisitionTable.disciplineId, disciplineTable.id))
			.leftJoin(
				experienceLevelTable,
				eq(requisitionTable.experienceLevelId, experienceLevelTable.id)
			)
			.leftJoin(timeSheetTable, eq(timeSheetTable.workdayId, workdayTable.id))
			.where(
				and(
					eq(workdayTable.recurrenceDayId, recurrenceDayId),
					eq(requisitionTable.companyId, companyId)
				)
			);

		if (!result) {
			return null;
		}

		return result;
	} catch (err) {
		console.error('Error fetching workday details:', err);
		throw error(500, `Error fetching workday details: ${err}`);
	}
};

export const getRecurrenceDayDetails = async (
	recurrenceDayId: string,
	companyId: string | undefined
) => {
	if (!companyId) return error(400, 'Missing company id');

	try {
		const [result] = await db
			.select({
				recurrenceDay: { ...recurrenceDayTable },
				requisition: {
					id: requisitionTable.id,
					title: requisitionTable.title,
					companyId: requisitionTable.companyId,
					companyName: clientCompanyTable.companyName,
					locationId: requisitionTable.locationId,
					locationName: companyOfficeLocationTable.name,
					disciplineId: requisitionTable.disciplineId,
					disciplineName: disciplineTable.name,
					jobDescription: requisitionTable.jobDescription,
					specialInstructions: requisitionTable.specialInstructions,
					experienceLevelId: requisitionTable.experienceLevelId,
					experienceLevelName: experienceLevelTable.value,
					hourlyRate: requisitionTable.hourlyRate,
					status: requisitionTable.status,
					permanentPosition: requisitionTable.permanentPosition
				}
			})
			.from(recurrenceDayTable)
			.innerJoin(requisitionTable, eq(recurrenceDayTable.requisitionId, requisitionTable.id))
			.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
			.innerJoin(
				companyOfficeLocationTable,
				eq(requisitionTable.locationId, companyOfficeLocationTable.id)
			)
			.innerJoin(disciplineTable, eq(requisitionTable.disciplineId, disciplineTable.id))
			.leftJoin(
				experienceLevelTable,
				eq(requisitionTable.experienceLevelId, experienceLevelTable.id)
			)
			.where(eq(recurrenceDayTable.id, recurrenceDayId));

		if (!result) {
			throw error(404, 'Recurrence Day Not Found');
		}
		return result;
	} catch (err) {
		console.error('Error fetching recurrence day details:', err);
		throw error(500, `Error fetching recurrence day details: ${err}`);
	}
};

export function validateTimesheet(
	timesheet: Timesheet,
	recurrenceDays: RecurrenceDay[],
	workdays: Workday[]
): TimesheetDiscrepancy[] {
	const discrepancies: TimesheetDiscrepancy[] = [];
	// Create a mapping of workdays by recurrenceDayId for lookup
	const workdayMap = new Map(workdays.map((wd) => [wd.recurrenceDayId, wd]));

	// Group recurrence days by date for better lookup, keeping all IDs for each date
	const recurrenceDaysByDate = new Map();
	for (const rd of recurrenceDays) {
		const dateKey = normalizeDate(rd.date);
		if (!recurrenceDaysByDate.has(dateKey)) {
			recurrenceDaysByDate.set(dateKey, []);
		}
		recurrenceDaysByDate.get(dateKey).push(rd);
	}

	// Validate hours entries against recurrence days
	if (timesheet.hoursRaw && Array.isArray(timesheet.hoursRaw)) {
		for (const entry of timesheet.hoursRaw) {
			// console.log('Entry', entry);
			if (typeof entry.hours !== 'number' || entry.hours < 0) {
				discrepancies.push({
					...createBaseDiscrepancy(timesheet),
					discrepancyType: TimesheetDiscrepancyType.INVALID_HOURS,
					details: `Invalid hours value: ${entry.hours} for day ${entry.date}`
				});
				continue;
			}

			const entryDate = entry.date;
			// console.log(entryDate);
			const recurrenceDaysForDate = recurrenceDaysByDate.get(entryDate);

			// Validate against recurrence days
			if (!recurrenceDaysForDate || recurrenceDaysForDate.length === 0) {
				discrepancies.push({
					...createBaseDiscrepancy(timesheet),
					discrepancyType: TimesheetDiscrepancyType.UNAUTHORIZED_WORKDAY,
					details: `Hours submitted for ${entryDate} but no recurrence day scheduled`
				});
				continue;
			}

			// Validate against workdays
			let hasApprovedWorkday = false;
			let validRecurrenceDay = null;

			for (const rd of recurrenceDaysForDate) {
				if (workdayMap.has(rd.id)) {
					hasApprovedWorkday = true;
					validRecurrenceDay = rd;
					break;
				}
			}

			if (!hasApprovedWorkday) {
				discrepancies.push({
					...createBaseDiscrepancy(timesheet),
					discrepancyType: TimesheetDiscrepancyType.UNAUTHORIZED_WORKDAY,
					details: `Hours submitted for ${entryDate} but no approved workday exists`
				});
				continue;
			}

			// Validate hours against schedule
			const maxHours = calculateMaxHours(validRecurrenceDay);
			if (entry.hours > maxHours) {
				discrepancies.push({
					...createBaseDiscrepancy(timesheet),
					discrepancyType: TimesheetDiscrepancyType.INVALID_HOURS,
					details: `Hours (${entry.hours}) exceed maximum allowed (${maxHours}) for ${entryDate}`
				});
			}
		}

		// Validate total hours
		const totalSubmitted = timesheet.hoursRaw.reduce(
			(sum: number, entry: any) => sum + entry.hours,
			0
		);
		if (Math.abs(totalSubmitted - Number(timesheet.totalHoursWorked)) > 0.01) {
			discrepancies.push({
				...createBaseDiscrepancy(timesheet),
				discrepancyType: TimesheetDiscrepancyType.HOURS_MISMATCH,
				details: `Submitted hours (${totalSubmitted}) don't match total (${timesheet.totalHoursWorked})`,
				hoursDiscrepancy: Number(timesheet.totalHoursWorked) - totalSubmitted
			});
		}
	}

	// Add other basic validations
	validateBasicTimesheet(timesheet, discrepancies);

	return discrepancies;
}

function calculateMaxHours(recurrenceDay: RecurrenceDay): number {
	// Parse times into Date objects using a reference date
	const baseDate = '2000-01-01';
	const dayStart = parseISO(`${baseDate}T${recurrenceDay.dayStartTime}`);
	const dayEnd = parseISO(`${baseDate}T${recurrenceDay.dayEndTime}`);
	// const lunchStart = parseISO(`${baseDate}T${recurrenceDay.lunchStartTime}`);
	// const lunchEnd = parseISO(`${baseDate}T${recurrenceDay.lunchEndTime}`);

	// Calculate total minutes worked
	const totalMinutes = differenceInMinutes(dayEnd, dayStart);
	// - differenceInMinutes(lunchEnd, lunchStart);

	// Convert to hours and round to 2 decimal places
	return Math.round((totalMinutes / 60) * 100) / 100;
}

function validateBasicTimesheet(timesheet: Timesheet, discrepancies: TimesheetDiscrepancy[]): void {
	// Check for missing rates
	if (!timesheet.candidateRateBase || !timesheet.candidateRateOT) {
		discrepancies.push({
			...createBaseDiscrepancy(timesheet),
			discrepancyType: TimesheetDiscrepancyType.MISSING_RATE,
			details: 'Missing base rate or overtime rate'
		});
	}

	// Check for validation status
	// if (!timesheet.validated) {
	// 	discrepancies.push({
	// 		...createBaseDiscrepancy(timesheet),
	// 		discrepancyType: TimesheetDiscrepancyType.VALIDATION_MISSING,
	// 		details: 'Timesheet has not been validated'
	// 	});
	// }

	// Check for signature status
	// if (timesheet.awaitingClientSignature) {
	// 	discrepancies.push({
	// 		...createBaseDiscrepancy(timesheet),
	// 		discrepancyType: TimesheetDiscrepancyType.SIGNATURE_MISSING,
	// 		details: 'Awaiting client signature'
	// 	});
	// }
}

function createBaseDiscrepancy(timesheet: Timesheet): Partial<TimesheetDiscrepancy> {
	return {
		timeSheetId: timesheet.timeSheetId,
		clientCompanyName: timesheet.clientCompanyName,
		candidateId: timesheet.candidate?.id,
		requisitionId: timesheet.requisitionId,
		weekBeginDate: timesheet.weekBeginDate
	};
}

export function formatDiscrepancyForDisplay(
	discrepancies: TimesheetDiscrepancy[]
): Record<string, any>[] {
	return discrepancies.map((d) => ({
		timeSheetId: d.timeSheetId,
		clientCompanyName: d.clientCompanyName,
		candidateId: d.candidateId,
		requisitionId: d.requisitionId,
		weekBeginning: d.weekBeginDate,
		discrepancyType: d.discrepancyType,
		details: d.details,
		hoursDiscrepancy: d.hoursDiscrepancy ? Number(d.hoursDiscrepancy).toFixed(2) : undefined
	}));
}

export async function getClientTimesheets(
	clientId: string | undefined
): Promise<TimesheetWithRelations[]> {
	if (!clientId) throw error(400, 'Must provide client ID');

	const results = await db
		.select({
			timesheet: timeSheetTable,
			candidate: { ...candidateProfileTable },
			user: {
				id: userTable.email,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl
			},
			requisition: requisitionTable,
			workday: workdayTable
		})
		.from(timeSheetTable)
		.where(eq(timeSheetTable.associatedClientId, clientId))
		.innerJoin(
			candidateProfileTable,
			eq(timeSheetTable.associatedCandidateId, candidateProfileTable.id)
		)
		.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
		.leftJoin(requisitionTable, eq(timeSheetTable.requisitionId, requisitionTable.id))
		.innerJoin(workdayTable, eq(timeSheetTable.workdayId, workdayTable.id))
		.orderBy(desc(timeSheetTable.weekBeginDate));

	if (!results.length) {
		return [];
	}

	return results;
}

export async function getClientInvoices(
	clientId: string | undefined
): Promise<InvoiceWithRelations[]> {
	if (!clientId) throw error(400, 'Must provide client ID');
	const results = await db
		.select({
			invoice: invoiceTable,
			candidate: candidateProfileTable,
			user: {
				id: userTable.email,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl
			},
			timesheet: timeSheetTable,
			requisition: requisitionTable
		})
		.from(invoiceTable)
		.where(eq(invoiceTable.clientId, clientId))
		.innerJoin(candidateProfileTable, eq(invoiceTable.candidateId, candidateProfileTable.id))
		.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
		.innerJoin(timeSheetTable, eq(invoiceTable.timesheetId, timeSheetTable.id))
		.innerJoin(requisitionTable, eq(invoiceTable.requisitionId, requisitionTable.id))
		.orderBy(desc(invoiceTable.createdAt));

	if (!results.length) {
		return [];
	}
	return results;
}

/**
 * Get a workday by its ID
 * @param workdayId The ID of the workday to fetch
 * @returns The workday or null if not found
 */
export async function getWorkdayById(workdayId: string): Promise<WorkdaySelect | null> {
	try {
		const [workday] = await db.select().from(workdayTable).where(eq(workdayTable.id, workdayId));

		return workday || null;
	} catch (err) {
		console.error('Error fetching workday:', err);
		throw error(500, `Error fetching workday: ${err}`);
	}
}

/**
 * Get requisition associated with a workday
 * @param workdayId The ID of the workday
 * @returns The requisition details or null if not found
 */
export async function getRequisitionByWorkdayId(
	workdayId: string
): Promise<RequisitionSelect | null> {
	try {
		// First get the workday to access its requisitionId
		const workday = await getWorkdayById(workdayId);

		if (!workday) {
			return null;
		}

		// Now get the requisition using the requisitionId from the workday
		const [requisition] = await db
			.select()
			.from(requisitionTable)
			.where(eq(requisitionTable.id, workday.requisitionId));

		return requisition || null;
	} catch (err) {
		console.error('Error fetching requisition by workday ID:', err);
		throw error(500, `Error fetching requisition: ${err}`);
	}
}

/**
 * Get recurrence day associated with a workday
 * @param workdayId The ID of the workday
 * @returns The recurrence day details or null if not found
 */
export async function getRecurrenceDayByWorkdayId(
	workdayId: string
): Promise<RecurrenceDaySelect | null> {
	try {
		// First get the workday to access its recurrenceDayId
		const workday = await getWorkdayById(workdayId);

		if (!workday || !workday.recurrenceDayId) {
			return null;
		}

		// Now get the recurrence day using the recurrenceDayId from the workday
		const [recurrenceDay] = await db
			.select()
			.from(recurrenceDayTable)
			.where(eq(recurrenceDayTable.id, workday.recurrenceDayId));

		return recurrenceDay || null;
	} catch (err) {
		console.error('Error fetching recurrence day by workday ID:', err);
		throw error(500, `Error fetching recurrence day: ${err}`);
	}
}

/**
 * Get both requisition and recurrence day associated with a workday in a single function
 * @param workdayId The ID of the workday
 * @returns Object containing the workday, requisition, and recurrence day
 */
export async function getWorkdayWithRelations(workdayId: string): Promise<{
	workday: WorkdaySelect | null;
	requisition: RequisitionSelect | null;
	recurrenceDay: RecurrenceDaySelect | null;
}> {
	try {
		const [result] = await db
			.select({
				workday: workdayTable,
				requisition: requisitionTable,
				recurrenceDay: recurrenceDayTable
			})
			.from(workdayTable)
			.where(eq(workdayTable.id, workdayId))
			.leftJoin(requisitionTable, eq(workdayTable.requisitionId, requisitionTable.id))
			.leftJoin(recurrenceDayTable, eq(workdayTable.recurrenceDayId, recurrenceDayTable.id));

		if (!result) {
			return { workday: null, requisition: null, recurrenceDay: null };
		}

		return result;
	} catch (err) {
		console.error('Error fetching workday with relations:', err);
		throw error(500, `Error fetching workday with relations: ${err}`);
	}
}

/**
 * Get all workdays for a specific recurrence day
 * @param recurrenceDayId The ID of the recurrence day
 * @returns Array of workdays associated with the recurrence day
 */
export async function getWorkdaysByRecurrenceDayId(
	recurrenceDayId: string
): Promise<WorkdaySelect[]> {
	try {
		const workdays = await db
			.select()
			.from(workdayTable)
			.where(eq(workdayTable.recurrenceDayId, recurrenceDayId));

		return workdays;
	} catch (err) {
		console.error('Error fetching workdays by recurrence day ID:', err);
		throw error(500, `Error fetching workdays: ${err}`);
	}
}
