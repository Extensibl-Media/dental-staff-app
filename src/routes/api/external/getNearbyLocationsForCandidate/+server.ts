import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import { companyOfficeLocationTable } from '$lib/server/database/schemas/client';
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

		const candidateRegionId = candidateProfile[0].regionId;

		if (!candidateRegionId) {
			throw error(400, 'Candidate region not set');
		}

		// Fetch office locations in the candidate's region
		const officeLocations = await db
			.select()
			.from(companyOfficeLocationTable)
			.where(eq(companyOfficeLocationTable.regionId, candidateRegionId));

		return json(officeLocations);
	} catch (err) {
		console.error('Error fetching locations:', err);
		throw error(500, 'Internal server error');
	}
};
