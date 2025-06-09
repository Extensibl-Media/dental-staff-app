import db from '$lib/server/database/drizzle';
import {
	candidateDisciplineExperienceTable,
	candidateProfileTable
} from '$lib/server/database/schemas/candidate';
import {
	clientCompanyTable,
	companyOfficeLocationTable
} from '$lib/server/database/schemas/client';
import { requisitionTable } from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { type RequestHandler, error, json } from '@sveltejs/kit';
import { eq, and, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
	const user = await authenticateUser(request);

	try {
		// Fetch the candidate's profile
		const candidateProfile = await db
			.select()
			.from(candidateProfileTable)
			.where(eq(candidateProfileTable.userId, user.id))
			.limit(1);

		if (candidateProfile.length === 0) {
			throw error(404, 'Candidate profile not found');
		}

		const candidateDisciplines = await db
			.select()
			.from(candidateDisciplineExperienceTable)
			.where(eq(candidateDisciplineExperienceTable.candidateId, candidateProfile[0].id));

		const candidateRegionId = candidateProfile[0].regionId;

		if (!candidateRegionId) {
			throw error(400, 'Candidate region not set');
		}

		// Fetch office locations in the candidate's region
		const officeLocations = await db
			.select({ id: companyOfficeLocationTable.id })
			.from(companyOfficeLocationTable)
			.where(eq(companyOfficeLocationTable.regionId, candidateRegionId));

		const officeLocationIds = officeLocations.map((location) => location.id);

		// Fetch requisitions for the office locations in the candidate's region
		const requisitions = await db
			.select({
				id: requisitionTable.id,
				title: requisitionTable.title,
				status: requisitionTable.status,
				hourlyRate: requisitionTable.hourlyRate,
				disciplineId: requisitionTable.disciplineId,
				experienceLevelId: requisitionTable.experienceLevelId,
				createdAt: requisitionTable.createdAt,
				permanentPosition: requisitionTable.permanentPosition,
				company: {
					...clientCompanyTable
				},
				location: {
					...companyOfficeLocationTable
				}
			})
			.from(requisitionTable)
			.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
			.innerJoin(
				companyOfficeLocationTable,
				eq(requisitionTable.locationId, companyOfficeLocationTable.id)
			)
			.where(
				and(
					inArray(requisitionTable.locationId, officeLocationIds),
					eq(requisitionTable.status, 'OPEN'),
					eq(requisitionTable.archived, false),
					eq(requisitionTable.permanentPosition, true),

					// Ensure the requisition's discipline matches one of the candidate's disciplines
					inArray(
						requisitionTable.disciplineId,
						candidateDisciplines.map((d) => d.disciplineId)
					)
				)
			);

		return json(requisitions);
	} catch (err) {
		console.error('Error fetching requisitions:', err);
		throw error(500, 'Internal server error');
	}
};
