import { desc, eq, count, sql, or, ilike, and, ne, lt, isNotNull } from 'drizzle-orm';
import db from '$lib/server/database/drizzle';
import { userTable, type User } from '../schemas/auth';
import {
	candidateDisciplineExperienceTable,
	candidateDocumentUploadsTable,
	candidateProfileTable,
	type CandidateProfile,
	type UpdateCandidateProfile
} from '../schemas/candidate';
import { disciplineTable, experienceLevelTable, type Discipline } from '../schemas/skill';
import { DEFAULT_MAX_RECORD_LIMIT, type CANDIDATE_STATUS } from '$lib/config/constants';
import { regionTable, subRegionTable, type Region, type Subregion } from '../schemas/region';
import type { PaginateOptions } from '$lib/types';
import { error } from '@sveltejs/kit';
import {
	recurrenceDayTable,
	requisitionTable,
	timeSheetTable,
	workdayTable
} from '../schemas/requisition';
import { clientCompanyTable, companyOfficeLocationTable } from '../schemas/client';

export type CandidateWithProfile = {
	user: User;
	profile: CandidateProfile;
	discipline: Discipline;
	region?: Region;
	subRegion?: Subregion;
};

export type CandidateWithProfileRaw = {
	address: string | null;
	avatar_url: string | null;
	avg_rating: number;
	birthday: string | null;
	blacklisted: boolean;
	candidate_id: string;
	candidate_status: string;
	cell_phone: string | null;
	citizenship: string | null;
	city: string | null;
	completed_onboarding: boolean;
	created_at: string | null;
	discipline_abbreviation: string | null;
	discipline_id: string | null;
	discipline_name: string | null;
	email: string;
	employee_number: string | null;
	experience_level_id: null;
	feature_me: false;
	first_name: string;
	hourly_rate_max: number | null;
	hourly_rate_min: number | null;
	id: string;
	last_name: string;
	provider: string;
	provider_id: string;
	receive_email: boolean;
	region_id: string | null;
	role: string;
	state: string | null;
	token: string | null;
	updated_at: string;
	user_id: string;
	verified: boolean;
	zipcode: string | null;
};

export type CandidatesResult = CandidateWithProfileRaw[];

// export async function getPaginatedCandidateProfiles({
// 	limit = 25,
// 	offset = 0,
// 	orderBy = undefined
// }: PaginateOptions) {
// 	try {
// 		const userCols = ['email', 'first_name', 'last_name'];
// 		const disciplineCols = ['discipline_name'];
// 		const orderSelector = orderBy
// 			? userCols.includes(orderBy.column)
// 				? `u.${orderBy.column}`
// 				: disciplineCols.includes(orderBy.column)
// 					? `${orderBy.column}`
// 					: `c.${orderBy.column}`
// 			: null;

// 		const query = sql.empty();

// 		query.append(sql`
//       SELECT c.*, u.first_name, u.last_name, u.email, d.name AS discipline_name, d.abbreviation AS discipline_abbreviation
//       FROM ${candidateProfileTable} AS c
//       INNER JOIN ${userTable} u ON c.user_id = u.id
// 			INNER JOIN ${candidateDisciplineExperienceTable} cd ON c.id = cd.candidate_id
//       INNER JOIN ${disciplineTable} d ON cd.discipline_id = d.id
//     `);

// 		if (orderSelector && orderBy) {
// 			query.append(sql`
//     ORDER BY ${
// 			orderBy.direction === 'asc'
// 				? sql`${sql.raw(orderSelector)} ASC`
// 				: sql`${sql.raw(orderSelector)} DESC`
// 		}
//   `);
// 		} else {
// 			query.append(sql`
//     ORDER BY c.created_at DESC
//   `);
// 		}

// 		query.append(sql`
//       LIMIT ${limit}
//       OFFSET ${offset}
//     `);

// 		const countResult = await db.select({ value: count() }).from(candidateProfileTable);

// 		const results = await db.execute(query);

// 		return {
// 			candidates: results.rows,
// 			count: countResult[0].value
// 		};
// 	} catch (error) {
// 		console.error(error);
// 	}
// }

export async function getAllCandidateProfiles(searchTerm?: string) {
	const countResult = await db.select({ value: count() }).from(candidateProfileTable);
	const results = await db
		.select({
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl
			},
			profile: { ...candidateProfileTable },
			discipline: { ...disciplineTable }
		})
		.from(candidateProfileTable)
		.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
		.innerJoin(
			candidateDisciplineExperienceTable,
			eq(candidateDisciplineExperienceTable.candidateId, candidateProfileTable.id)
		)
		.innerJoin(
			disciplineTable,
			eq(candidateDisciplineExperienceTable.disciplineId, disciplineTable.id)
		)
		.where(
			searchTerm
				? or(
						ilike(userTable.firstName, `%${searchTerm}%`),
						ilike(userTable.lastName, `%${searchTerm}%`),
						ilike(userTable.email, `%${searchTerm}%`),
						ilike(disciplineTable.name, `%${searchTerm}%`),
						ilike(candidateProfileTable.address, `%${searchTerm}%`),
						ilike(candidateProfileTable.city, `%${searchTerm}%`),
						ilike(candidateProfileTable.state, `%${searchTerm}%`)
					)
				: undefined
		)
		.orderBy(desc(candidateProfileTable.createdAt))
		.limit(DEFAULT_MAX_RECORD_LIMIT);

	return {
		candidates: results.map((res) => ({
			profile: res.profile,
			user: res.user,
			discipline: res.discipline
		})),
		count: countResult[0].value
	};
}

export async function getCandidateUserById(candidateId: string) {
	const [result] = await db
		.select({
			id: userTable.id,
			firstName: userTable.firstName,
			lastName: userTable.lastName,
			email: userTable.email,
			avatarUrl: userTable.avatarUrl
		})
		.from(candidateProfileTable)
		.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
		.where(eq(candidateProfileTable.id, candidateId));
	if (!result) throw error(404, 'Candidate Not Found');
	return result;
}

export async function getCandidateProfileById(candidateId: string) {
	const [result] = await db
		.select({
			profile: { ...candidateProfileTable },
			user: {
				id: userTable.id,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
			region: { ...regionTable },
			subRegion: { ...subRegionTable }
		})
		.from(candidateProfileTable)
		.where(eq(candidateProfileTable.id, candidateId))
		.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
		.innerJoin(regionTable, eq(candidateProfileTable.regionId, regionTable.id))
		.leftJoin(subRegionTable, eq(regionTable.id, subRegionTable.regionId));

	const disciplines = await db
		.select({
			discipline: { ...disciplineTable },
			experience: {
				...candidateDisciplineExperienceTable,
				experienceLevel: experienceLevelTable.value
			}
		})
		.from(candidateDisciplineExperienceTable)
		.innerJoin(
			disciplineTable,
			eq(candidateDisciplineExperienceTable.disciplineId, disciplineTable.id)
		)
		.innerJoin(
			experienceLevelTable,
			eq(candidateDisciplineExperienceTable.experienceLevelId, experienceLevelTable.id)
		)
		.where(eq(candidateDisciplineExperienceTable.candidateId, candidateId));

	if (!result) throw error(404, 'Candidate Not Found');
	return { candidate: result, disciplines: disciplines || [] };
}

export async function getCandidateProfileByUserId(userId: string) {
	const [result] = await db
		.select()
		.from(candidateProfileTable)
		.where(eq(candidateProfileTable.userId, userId));

	if (!result) throw error(404, 'Candidate Not Found');

	return result;
}

export async function getCandidatesByStatus(status: keyof typeof CANDIDATE_STATUS) {
	const result = await db
		.select({
			profile: { ...candidateProfileTable },
			user: {
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
			discipline: { ...disciplineTable },
			region: { ...regionTable },
			subRegion: { ...subRegionTable }
		})
		.from(candidateProfileTable)
		.where(eq(candidateProfileTable.status, status));

	return result;
}

export async function getCandidateByEmail(email: string) {
	const [result] = await db
		.select({
			profile: { ...candidateProfileTable },
			user: {
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				email: userTable.email,
				avatarUrl: userTable.avatarUrl
			},
			discipline: { ...disciplineTable },
			region: { ...regionTable },
			subRegion: { ...subRegionTable }
		})
		.from(candidateProfileTable)
		.where(eq(userTable.email, email));

	if (!result) throw error(404, 'Candidate Not Found');

	return result;
}

export function createCandidateProfile(userId: string, profile: CandidateProfile) {}

export async function updateCandidateProfile(candidateId: string, data: UpdateCandidateProfile) {
	const [result] = await db
		.update(candidateProfileTable)
		.set(data)
		.where(eq(candidateProfileTable.id, candidateId))
		.returning();

	if (!result) throw error(404, 'Candidate Not Found');

	return result;
}

export function deleteCandidateProfileByUid(userId: string) {}

export function deleteCandidateProfileById(candidateId: string) {}

export function updateCandidateStatus(candidateId: string, status: typeof CANDIDATE_STATUS) {}

export async function getAllCandidateWorkHistory(candidateId: string) {
	const workdays = await db
		.select({
			workday: { ...workdayTable },
			recurrenceDay: { ...recurrenceDayTable },
			requisition: {
				...requisitionTable,
				companyName: clientCompanyTable.companyName
			},
			location: {
				name: companyOfficeLocationTable.name,
				address1: companyOfficeLocationTable.streetOne,
				address2: companyOfficeLocationTable.streetTwo,
				city: companyOfficeLocationTable.city,
				state: companyOfficeLocationTable.state,
				zip: companyOfficeLocationTable.zipcode
			},
			timesheet: { ...timeSheetTable }
		})
		.from(workdayTable)
		.innerJoin(recurrenceDayTable, eq(recurrenceDayTable.id, workdayTable.recurrenceDayId))
		.innerJoin(requisitionTable, eq(requisitionTable.id, workdayTable.requisitionId))
		.innerJoin(
			companyOfficeLocationTable,
			eq(requisitionTable.locationId, companyOfficeLocationTable.id)
		)
		.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
		.leftJoin(timeSheetTable, eq(timeSheetTable.workdayId, workdayTable.id))
		.where(and(eq(workdayTable.candidateId, candidateId), isNotNull(timeSheetTable.id)));

	return workdays || [];
}

export async function getCandidateWorkHistoryForClient(candidateId: string, clientId: string) {}

export async function getCandidateDocuments(candidateId: string) {
	const documents = await db
		.select()
		.from(candidateDocumentUploadsTable)
		.where(eq(candidateDocumentUploadsTable.candidateId, candidateId))
		.orderBy(desc(candidateDocumentUploadsTable.createdAt))
		.limit(DEFAULT_MAX_RECORD_LIMIT);

	return documents || [];
}
