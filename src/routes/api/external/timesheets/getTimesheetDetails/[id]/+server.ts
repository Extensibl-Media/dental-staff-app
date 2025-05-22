import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import { clientCompanyTable } from '$lib/server/database/schemas/client';
import {
	timeSheetTable,
	requisitionTable,
	workdayTable,
	recurrenceDayTable
} from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, request }) => {
	const { id } = params;

	if (!id) {
		throw error(400, 'No timesheet ID provided');
	}

	// Authenticate the user
	const user = await authenticateUser(request);

	try {
		// Get the candidate's profile
		const [candidateProfile] = await db
			.select()
			.from(candidateProfileTable)
			.where(eq(candidateProfileTable.userId, user.id))
			.limit(1);

		if (!candidateProfile) {
			throw error(404, 'Candidate profile not found');
		}

		// Fetch timesheet with related data
		const [timesheet] = await db
			.select({
				timesheet: {
					id: timeSheetTable.id,
					createdAt: timeSheetTable.createdAt,
					updatedAt: timeSheetTable.updatedAt,
					validated: timeSheetTable.validated,
					totalHoursWorked: timeSheetTable.totalHoursWorked,
					totalHoursBilled: timeSheetTable.totalHoursBilled,
					awaitingClientSignature: timeSheetTable.awaitingClientSignature,
					weekBeginDate: timeSheetTable.weekBeginDate,
					hoursRaw: timeSheetTable.hoursRaw,
					candidateRateBase: timeSheetTable.candidateRateBase,
					candidateRateOT: timeSheetTable.candidateRateOT,
					status: timeSheetTable.status
				},
				requisition: {
					id: requisitionTable.id,
					title: requisitionTable.title,
					status: requisitionTable.status,
					jobDescription: requisitionTable.jobDescription,
					hourlyRate: requisitionTable.hourlyRate
				},
				company: {
					id: clientCompanyTable.id,
					name: clientCompanyTable.companyName,
					logo: clientCompanyTable.companyLogo
				},
				workday: {
					id: workdayTable.id
				},
				recurrenceDay: {
					id: recurrenceDayTable.id,
					date: recurrenceDayTable.date,
					dayStartTime: recurrenceDayTable.dayStart,
					dayEndTime: recurrenceDayTable.dayEnd,
					lunchStartTime: recurrenceDayTable.lunchStart,
					lunchEndTime: recurrenceDayTable.lunchEnd
				}
			})
			.from(timeSheetTable)
			.leftJoin(requisitionTable, eq(timeSheetTable.requisitionId, requisitionTable.id))
			.leftJoin(workdayTable, eq(timeSheetTable.workdayId, workdayTable.id))
			.leftJoin(recurrenceDayTable, eq(recurrenceDayTable.requisitionId, requisitionTable.id))
			.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
			.where(
				and(
					eq(timeSheetTable.id, id),
					eq(timeSheetTable.associatedCandidateId, candidateProfile.id)
				)
			)
			.limit(1);

		if (!timesheet) {
			throw error(404, 'Timesheet not found or access denied');
		}

		return json(timesheet);
	} catch (err) {
		console.error('Error fetching timesheet details:', err);
		throw error(500, 'Internal server error');
	}
};
