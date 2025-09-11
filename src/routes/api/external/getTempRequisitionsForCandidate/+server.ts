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
import { eq, and, inArray, notInArray, or, isNull, isNotNull, sql } from 'drizzle-orm';
import { METERS_PER_MILE, RADIUS_METERS, RADIUS_MILES } from '$lib/config/constants';

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

		// Check if candidate has location coordinates
		if (!candidateProfile.lat || !candidateProfile.lon) {
			throw error(
				400,
				'Candidate location coordinates not found. Please update your profile with your address.'
			);
		}

		// Fetch office locations within the radius using PostGIS
		const nearbyOfficeLocations = await db
			.select({
				id: companyOfficeLocationTable.id,
				distanceMiles: sql<number>`ST_Distance(
					geom::geography,
					ST_SetSRID(ST_MakePoint(${candidateProfile.lon}::float, ${candidateProfile.lat}::float), 4326)::geography
				) / ${METERS_PER_MILE}`
			})
			.from(companyOfficeLocationTable)
			.where(
				and(
					isNotNull(companyOfficeLocationTable.geom),
					// Filter by distance using ST_DWithin for performance
					sql`ST_DWithin(
						geom::geography,
						ST_SetSRID(ST_MakePoint(${candidateProfile.lon}::float, ${candidateProfile.lat}::float), 4326)::geography,
						${RADIUS_METERS}
					)`
				)
			);

		const officeLocationIds = nearbyOfficeLocations.map((location) => location.id);

		if (officeLocationIds.length === 0) {
			return json({
				candidateLocation: {
					lat: candidateProfile.lat,
					lon: candidateProfile.lon,
					address: candidateProfile.completeAddress
				},
				recurrenceDays: [],
				searchRadius: RADIUS_MILES,
				totalFound: 0,
				message: 'No office locations found within 30 miles of your location.'
			});
		}

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
					completeAddress: companyOfficeLocationTable.completeAddress,
					name: companyOfficeLocationTable.name,
					city: companyOfficeLocationTable.city,
					state: companyOfficeLocationTable.state,
					zip: companyOfficeLocationTable.zipcode,
					lat: companyOfficeLocationTable.lat,
					lon: companyOfficeLocationTable.lon,
					// Include distance to this specific location
					distanceMiles: sql<number>`ST_Distance(
						${companyOfficeLocationTable.geom}::geography,
						ST_SetSRID(ST_MakePoint(${candidateProfile.lon}::float, ${candidateProfile.lat}::float), 4326)::geography
					) / ${METERS_PER_MILE}`
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
			)
			// Order by distance (closest first), then by date
			.orderBy(
				sql`ST_Distance(
					${companyOfficeLocationTable.geom}::geography,
					ST_SetSRID(ST_MakePoint(${candidateProfile.lon}::float, ${candidateProfile.lat}::float), 4326)::geography
				)`,
				recurrenceDayTable.date
			);

		return json({
			candidateLocation: {
				lat: candidateProfile.lat,
				lon: candidateProfile.lon,
				address: candidateProfile.completeAddress
			},
			recurrenceDays,
			searchRadius: RADIUS_MILES,
			totalFound: recurrenceDays.length,
			nearbyOfficeCount: officeLocationIds.length
		});
	} catch (err) {
		console.error('Error fetching recurrence days:', err);
		throw error(500, 'Internal server error');
	}
};
