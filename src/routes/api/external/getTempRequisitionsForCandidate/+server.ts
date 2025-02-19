import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import {
	clientCompanyTable,
	companyOfficeLocationTable
} from '$lib/server/database/schemas/client';
import {
	recurrenceDayTable,
	requisitionTable,
	workdayTable
} from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { type RequestHandler, error, json } from '@sveltejs/kit';
import { eq, and, inArray } from 'drizzle-orm';

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

		const candidateRegionId = candidateProfile.regionId;

		if (!candidateRegionId) {
			throw error(400, 'Candidate region not set');
		}

		// Fetch office locations in the candidate's region
		const officeLocations = await db
			.select({ id: companyOfficeLocationTable.id })
			.from(companyOfficeLocationTable)
			.where(eq(companyOfficeLocationTable.regionId, candidateRegionId));

		const officeLocationIds = officeLocations.map((location) => location.id);

		// Fetch recurrence days with requisition and workday information
		const recurrenceDays = await db
			.select({
				recurrenceDay: {
					id: recurrenceDayTable.id,
					startTime: recurrenceDayTable.dayStartTime,
					endTime: recurrenceDayTable.dayEndTime,
					date: recurrenceDayTable.date,
					requisitionId: recurrenceDayTable.requisitionId,
					status: recurrenceDayTable.status
				},
				requisition: {
					id: requisitionTable.id,
					title: requisitionTable.title,
					status: requisitionTable.status,
					hourlyRate: requisitionTable.hourlyRate,
					disciplineId: requisitionTable.disciplineId,
					experienceLevelId: requisitionTable.experienceLevelId,
					permanentPosition: requisitionTable.permanentPosition
				},
				company: {
					id: clientCompanyTable.id,
					name: clientCompanyTable.companyName,
					logo: clientCompanyTable.companyLogo
				},
				location: {
					id: companyOfficeLocationTable.id,
					name: companyOfficeLocationTable.name,
					city: companyOfficeLocationTable.city,
					state: companyOfficeLocationTable.state,
					zip: companyOfficeLocationTable.zipcode
				},
				// Only get workdays for this candidate
				workday: {
					id: workdayTable.id,
					candidateId: workdayTable.candidateId
				}
			})
			.from(recurrenceDayTable)
			.innerJoin(requisitionTable, eq(recurrenceDayTable.requisitionId, requisitionTable.id))
			.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
			.innerJoin(
				companyOfficeLocationTable,
				eq(requisitionTable.locationId, companyOfficeLocationTable.id)
			)
			.leftJoin(
				workdayTable,
				and(
					eq(workdayTable.recurrenceDayId, recurrenceDayTable.id),
					eq(workdayTable.candidateId, candidateProfile.id) // Only this candidate's workdays
				)
			)
			.where(
				and(
					inArray(requisitionTable.locationId, officeLocationIds),
					eq(requisitionTable.status, 'OPEN'),
					eq(requisitionTable.archived, false),
					eq(requisitionTable.permanentPosition, false)
				)
			);

		return json(recurrenceDays);
	} catch (err) {
		console.error('Error fetching recurrence days:', err);
		throw error(500, 'Internal server error');
	}
};
