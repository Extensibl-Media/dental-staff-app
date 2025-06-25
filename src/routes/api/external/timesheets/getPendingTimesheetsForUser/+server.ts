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
import { eq, and, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
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

		// Fetch timesheets with related data
		const timesheets = await db
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
					status: timeSheetTable.status
				},
				requisition: {
					id: requisitionTable.id,
					title: requisitionTable.title,
					status: requisitionTable.status
				},
				company: {
					id: clientCompanyTable.id,
					name: clientCompanyTable.companyName,
					logo: clientCompanyTable.companyLogo
				},
				workday: {
					id: workdayTable.id
				}
			})
			.from(timeSheetTable)
			.leftJoin(requisitionTable, eq(timeSheetTable.requisitionId, requisitionTable.id))
			.leftJoin(workdayTable, eq(timeSheetTable.workdayId, workdayTable.id))
			.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
			.where(
				and(
					eq(timeSheetTable.associatedCandidateId, candidateProfile.id),
					ne(timeSheetTable.status, 'APPROVED')
				)
			)
			.orderBy(timeSheetTable.weekBeginDate);

		return json({ success: true, data: timesheets });
	} catch (err) {
		console.error('Error fetching timesheets:', err);
		throw error(500, 'Internal server error');
	}
};
