import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import { candidateRequisitionSavesTable } from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { type RequestHandler, error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

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

		const saved = await db
			.select()
			.from(candidateRequisitionSavesTable)
			.where(eq(candidateRequisitionSavesTable.candidateId, candidateProfile[0].id));

		console.log({ saved });

		return json(saved);
	} catch (err) {
		console.error('Error fetching saved requisitions:', err);
		throw error(500, 'Internal server error');
	}
};
