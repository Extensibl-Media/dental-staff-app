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
import { eq, and, inArray, notInArray, or, isNull, isNotNull } from 'drizzle-orm';

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

		// First, fetch the dates this candidate already has accepted workdays for
		// to avoid showing other opportunities on the same days
		const acceptedWorkdays = await db
			.select({
				date: recurrenceDayTable.date
			})
			.from(workdayTable)
			.innerJoin(recurrenceDayTable, eq(workdayTable.recurrenceDayId, recurrenceDayTable.id))
			.where(eq(workdayTable.candidateId, candidateProfile.id));

		// Create an array of dates the candidate is already working
		const bookedDates = acceptedWorkdays.map((day) => day.date);

		// Prepare filter conditions based on whether bookedDates is empty or not
		let dateCondition;
		if (bookedDates.length === 0) {
			// If no booked dates, don't use notInArray condition
			dateCondition = or(
				// Either all recurrence days (since none are booked)
				isNotNull(recurrenceDayTable.id),
				// OR it's a workday they have already claimed (redundant but matches the logic)
				isNotNull(workdayTable.id)
			);
		} else {
			// If there are booked dates, use the original condition
			dateCondition = or(
				// Either the recurrence day is not on a date they're already booked
				notInArray(recurrenceDayTable.date, bookedDates),
				// OR it's a workday they have already claimed (so we still show their bookings)
				isNotNull(workdayTable.id)
			);
		}

		// Fetch recurrence days with requisition and workday information
		const recurrenceDays = await db
			.select({
				recurrenceDay: {
					id: recurrenceDayTable.id,
					startTime: recurrenceDayTable.dayStart,
					endTime: recurrenceDayTable.dayEnd,
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
					// eq(requisitionTable.status, 'OPEN'),
					notInArray(recurrenceDayTable.status, ['CANCELED']),
					eq(requisitionTable.archived, false),
					eq(requisitionTable.permanentPosition, false),
					// Add this condition to only include recurrence days that:
					// 1. Have no workday assigned (are available) OR
					// 2. Have a workday assigned to the current candidate
					or(
						// Check if no workday record exists (no candidate claimed it)
						isNull(workdayTable.id),
						// Or check if the workday is for the current candidate
						eq(workdayTable.candidateId, candidateProfile.id)
					),
					// KEY CHANGE: We use the prepared condition that handles empty bookedDates
					dateCondition
				)
			);

		return json(recurrenceDays);
	} catch (err) {
		console.error('Error fetching recurrence days:', err);
		throw error(500, 'Internal server error');
	}
};
