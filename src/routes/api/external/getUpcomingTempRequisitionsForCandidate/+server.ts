import db from '$lib/server/database/drizzle';
import {
	candidateProfileTable,
	candidateDisciplineExperienceTable
} from '$lib/server/database/schemas/candidate';
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
import { eq, and, inArray, notInArray, or, isNull, isNotNull, sql, gte, lte } from 'drizzle-orm';
import { METERS_PER_MILE, RADIUS_METERS, RADIUS_MILES } from '$lib/config/constants';
import { disciplineTable, experienceLevelTable } from '$lib/server/database/schemas/skill';

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

		// Fetch candidate's disciplines with their preferred rates
		const candidateDisciplines = await db
			.select({
				disciplineId: candidateDisciplineExperienceTable.disciplineId,
				experienceLevelId: candidateDisciplineExperienceTable.experienceLevelId,
				preferredHourlyMin: candidateDisciplineExperienceTable.preferredHourlyMin,
				preferredHourlyMax: candidateDisciplineExperienceTable.preferredHourlyMax
			})
			.from(candidateDisciplineExperienceTable)
			.where(eq(candidateDisciplineExperienceTable.candidateId, candidateProfile.id));

		if (candidateDisciplines.length === 0) {
			return json({
				candidateLocation: {
					lat: candidateProfile.lat,
					lon: candidateProfile.lon,
					address: candidateProfile.completeAddress
				},
				recurrenceDays: [],
				searchRadius: RADIUS_MILES,
				totalFound: 0,
				message: 'Please add your work experience and disciplines to see available shifts.'
			});
		}

		// Extract discipline IDs and experience level IDs
		const disciplineIds = candidateDisciplines.map((d) => d.disciplineId);
		const experienceLevelIds = candidateDisciplines.map((d) => d.experienceLevelId);

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
		const acceptedWorkdays = await db
			.select({
				date: recurrenceDayTable.date
			})
			.from(workdayTable)
			.innerJoin(recurrenceDayTable, eq(workdayTable.recurrenceDayId, recurrenceDayTable.id))
			.where(eq(workdayTable.candidateId, candidateProfile.id));

		const bookedDates = acceptedWorkdays.map((day) => day.date);

		// Prepare date condition
		let dateCondition;
		if (bookedDates.length === 0) {
			dateCondition = isNotNull(recurrenceDayTable.id);
		} else {
			dateCondition = or(
				notInArray(recurrenceDayTable.date, bookedDates),
				and(isNotNull(workdayTable.id), eq(workdayTable.candidateId, candidateProfile.id))
			);
		}

		// Fetch recurrence days with filtering
		const recurrenceDays = await db
			.selectDistinctOn([recurrenceDayTable.id], {
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
					permanentPosition: requisitionTable.permanentPosition,
					disciplineName: disciplineTable.name, // Add this
					experienceLevelName: experienceLevelTable.value // Add this
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
					distanceMiles: sql<number>`ST_Distance(
						${companyOfficeLocationTable.geom}::geography,
						ST_SetSRID(ST_MakePoint(${candidateProfile.lon}::float, ${candidateProfile.lat}::float), 4326)::geography
					) / ${METERS_PER_MILE}`
				},
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
			.innerJoin(disciplineTable, eq(requisitionTable.disciplineId, disciplineTable.id)) // Add this join
			.innerJoin(
				experienceLevelTable,
				eq(requisitionTable.experienceLevelId, experienceLevelTable.id)
			)
			.leftJoin(workdayTable, eq(workdayTable.recurrenceDayId, recurrenceDayTable.id))
			.where(
				and(
					inArray(requisitionTable.locationId, officeLocationIds),
					notInArray(recurrenceDayTable.status, ['CANCELED', 'UNFULFILLED', 'FILLED']),
					eq(requisitionTable.status, 'OPEN'),
					eq(requisitionTable.archived, false),
					eq(requisitionTable.permanentPosition, false),
					// Filter by candidate's disciplines
					inArray(requisitionTable.disciplineId, disciplineIds),
					// Filter by candidate's experience levels
					inArray(requisitionTable.experienceLevelId, experienceLevelIds),
					// Only show shifts that:
					// 1. Have no workday assigned (available to claim) OR
					// 2. Are already assigned to THIS candidate (their bookings)
					or(isNull(workdayTable.id), eq(workdayTable.candidateId, candidateProfile.id)),
					dateCondition,
					gte(recurrenceDayTable.date, new Date().toISOString())
				)
			)
			.orderBy(
				recurrenceDayTable.id,
				sql`ST_Distance(
					${companyOfficeLocationTable.geom}::geography,
					ST_SetSRID(ST_MakePoint(${candidateProfile.lon}::float, ${candidateProfile.lat}::float), 4326)::geography
				)`,
				recurrenceDayTable.date
			);

		// Filter by hourly rate in-memory (since rate requirements vary by discipline)
		const filteredRecurrenceDays = recurrenceDays.filter((shift) => {
			// Find the candidate's discipline experience that matches this shift
			const matchingDiscipline = candidateDisciplines.find(
				(d) =>
					d.disciplineId === shift.requisition.disciplineId &&
					d.experienceLevelId === shift.requisition.experienceLevelId
			);

			if (!matchingDiscipline) {
				return false;
			}

			// Check if the shift's hourly rate falls within the candidate's preferred range
			const shiftRate = shift.requisition.hourlyRate || 0;
			return (
				shiftRate >= matchingDiscipline.preferredHourlyMin &&
				shiftRate <= matchingDiscipline.preferredHourlyMax
			);
		});

		return json({
			candidateLocation: {
				lat: candidateProfile.lat,
				lon: candidateProfile.lon,
				address: candidateProfile.completeAddress
			},
			recurrenceDays: filteredRecurrenceDays,
			searchRadius: RADIUS_MILES,
			totalFound: filteredRecurrenceDays.length,
			nearbyOfficeCount: officeLocationIds.length
		});
	} catch (err) {
		console.error('Error fetching recurrence days:', err);
		throw error(500, 'Internal server error');
	}
};
