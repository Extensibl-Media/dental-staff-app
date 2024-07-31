import { desc, eq, count, sql } from 'drizzle-orm';
import db from '$lib/server/database/drizzle';
import { userTable, type User } from '../schemas/auth';
import {
	candidateDisciplineExperienceTable,
	candidateProfileTable,
	type CandidateProfile,
	type UpdateCandidateProfile
} from '../schemas/candidate';
import { disciplineTable, type Discipline } from '../schemas/skill';
import type { CANDIDATE_STATUS } from '$lib/config/constants';
import { regionTable, subRegionTable, type Region, type Subregion } from '../schemas/region';

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

export async function getPaginatedCandidateProfiles({
	limit = 25,
	offset = 0,
	orderBy = undefined
}: {
	limit: number;
	offset: number;
	orderBy?: { column: string; direction: string };
}) {
	try {
		const userCols = ['email', 'first_name', 'last_name'];
		const disciplineCols = ['discipline_name'];
		const orderSelector = orderBy
			? userCols.includes(orderBy.column)
				? `u.${orderBy.column}`
				: disciplineCols.includes(orderBy.column)
					? `${orderBy.column}`
					: `c.${orderBy.column}`
			: null;

		const query = sql.empty();

		query.append(sql`
      SELECT c.*, u.first_name, u.last_name, u.email, d.name AS discipline_name, d.abbreviation AS discipline_abbreviation
      FROM ${candidateProfileTable} AS c
      INNER JOIN ${userTable} u ON c.user_id = u.id
			INNER JOIN ${candidateDisciplineExperienceTable} cd ON c.id = cd.candidate_id
      INNER JOIN ${disciplineTable} d ON cd.discipline_id = d.id
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

		const countResult = await db.select({ value: count() }).from(candidateProfileTable);

		const results = await db.execute(query);

		return {
			candidates: results.rows,
			count: countResult[0].value
		};
	} catch (error) {
		console.error(error);
	}
}

export async function getAllCandidateProfiles() {
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
		.orderBy(desc(candidateProfileTable.createdAt));

	return {
		candidates: results.map((res) => ({
			profile: res.profile,
			user: res.user,
			discipline: res.discipline
		})),
		count: countResult[0].value
	};
}

export async function getCandidateProfileById(candidateId: string) {
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
		.where(eq(candidateProfileTable.id, candidateId))
		.innerJoin(userTable, eq(candidateProfileTable.userId, userTable.id))
		.innerJoin(
			candidateDisciplineExperienceTable,
			eq(candidateDisciplineExperienceTable.candidateId, candidateProfileTable.id)
		)
		.innerJoin(
			disciplineTable,
			eq(candidateDisciplineExperienceTable.disciplineId, disciplineTable.id)
		)
		.innerJoin(regionTable, eq(candidateProfileTable.regionId, regionTable.id))
		.leftJoin(subRegionTable, eq(regionTable.id, subRegionTable.regionId));

	return result[0] || null;
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
		.where(eq(userTable.email, email));

	return result[0];
}

export function createCandidateProfile(userId: string, profile: CandidateProfile) {}

export function updateCandidateProfile(candidateId: string, data: UpdateCandidateProfile) {}

export function deleteCandidateProfileByUid(userId: string) {}

export function deleteCandidateProfileById(candidateId: string) {}

export function updateCandidateStatus(candidateId: string, status: typeof CANDIDATE_STATUS) {}

export async function getAllCandidateWorkHistory(candidateId: string) {}

export async function getCandidateWorkHistoryForClient(candidateId: string, clientId: string) {}
