import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import {
	clientCompanyTable,
	companyOfficeLocationTable
} from '$lib/server/database/schemas/client';
import {
	requisitionTable,
	requisitionApplicationTable
} from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { type RequestHandler, error, json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
	const user = await authenticateUser(request);
	try {
		// Fetch the candidate's profile
		const [candidateProfile] = await db
			.select()
			.from(candidateProfileTable)
			.where(eq(candidateProfileTable.userId, user.id))
			.limit(1);

		if (!candidateProfile) {
			throw error(404, 'Candidate profile not found');
		}

		// Fetch requisitions with their applications and related data
		const appliedRequisitions = await db
			.select({
				// Requisition details
				id: requisitionTable.id,
				title: requisitionTable.title,
				status: requisitionTable.status,
				hourlyRate: requisitionTable.hourlyRate,
				disciplineId: requisitionTable.disciplineId,
				experienceLevelId: requisitionTable.experienceLevelId,
				createdAt: requisitionTable.createdAt,
				permanentPosition: requisitionTable.permanentPosition,
				// Company details
				company: {
					...clientCompanyTable
				},
				// Location details
				location: {
					...companyOfficeLocationTable
				},
				// Application details
				application: {
					...requisitionApplicationTable
				}
			})
			.from(requisitionApplicationTable)
			.innerJoin(
				requisitionTable,
				eq(requisitionApplicationTable.requisitionId, requisitionTable.id)
			)
			.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
			.innerJoin(
				companyOfficeLocationTable,
				eq(requisitionTable.locationId, companyOfficeLocationTable.id)
			)
			.where(
				and(
					eq(requisitionApplicationTable.candidateId, candidateProfile.id),
					eq(requisitionTable.archived, false)
				)
			);

		return json(appliedRequisitions);
	} catch (err) {
		console.error('Error fetching applied requisitions:', err);
		throw error(500, 'Internal server error');
	}
};
