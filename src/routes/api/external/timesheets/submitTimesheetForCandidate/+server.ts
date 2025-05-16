import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import {
	timeSheetTable,
	type RawTimesheetHours,
	type TimeSheet
} from '$lib/server/database/schemas/requisition';
import { requisitionTable } from '$lib/server/database/schemas/requisition';
import { workdayTable } from '$lib/server/database/schemas/requisition';
import { authenticateUser } from '$lib/server/serverUtils';
import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getClientIdByCompanyId } from '$lib/server/database/queries/clients';
import { getCandidateProfileByUserId } from '$lib/server/database/queries/candidates';
import { z } from 'zod';
import { getRequisitionByWorkdayId } from '$lib/server/database/queries/requisitions';

const newTimesheetSchema = z.object({
	userId: z.string().min(1, 'User ID is required'),
	companyId: z.string().min(1, 'Company ID is required'),
	weekStartDate: z.string().min(1, 'Week start date is required'),
	entries: z.array(
		z.object({
			workdayId: z.string().min(1, 'Workday ID is required'),
			hours: z.number().min(1, 'Hours worked is required'),
			startTime: z.string().min(1, 'Start time is required'),
			endTime: z.string().min(1, 'End time is required'),
			date: z.string().min(1, 'Date is required')
		})
	),
	totalHours: z.number().min(1, 'Total hours is required')
});

const corsHeaders = {
	'Access-Control-Allow-Origin': env.CANDIDATE_APP_DOMAIN,
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Allow-Credentials': 'true'
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		headers: corsHeaders
	});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Validate content type
		const contentType = request.headers.get('content-type');
		if (!contentType?.includes('application/json')) {
			return json(
				{ success: false, message: 'Content-Type must be application/json' },
				{ status: 400, headers: corsHeaders }
			);
		}

		// Authenticate user
		const user = await authenticateUser(request);
		if (!user) {
			return json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401, headers: corsHeaders }
			);
		}

		// Validate request body
		const body = await request.json().catch((err) => console.log(err));

		console.log({ body });

		if (!body) {
			return json(
				{ success: false, message: 'Invalid JSON body' },
				{ status: 400, headers: corsHeaders }
			);
		}

		const parsedBody = newTimesheetSchema.safeParse(body);
		if (!parsedBody.success) {
			return json(
				{ success: false, message: parsedBody.error.errors[0].message },
				{ status: 400, headers: corsHeaders }
			);
		}
		const { userId, companyId, weekStartDate, entries } = parsedBody.data;

		const candidateProfile = await getCandidateProfileByUserId(userId);
		const clientId = await getClientIdByCompanyId(companyId);

		const workdayIds = entries.map((entry) => entry.workdayId);

		const timesheetEntries: RawTimesheetHours[] = entries.map((entry) => ({
			hours: entry.hours,
			startTime: entry.startTime,
			endTime: entry.endTime,
			date: entry.date
		}));

		const workdayId = workdayIds[0];
		const requisition = await getRequisitionByWorkdayId(workdayId);

		const timesheetData: TimeSheet = {
			id: crypto.randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
			workdayId,
			associatedCandidateId: candidateProfile.id,
			associatedClientId: clientId,
			requisitionId: requisition?.id,
			weekBeginDate: new Date(weekStartDate).toISOString().split('T')[0],
			totalHoursWorked: parsedBody.data.totalHours.toString(),
			hoursRaw: timesheetEntries,
			candidateRateBase: candidateProfile.hourlyRateMin.toString(),
			candidateRateOT: (candidateProfile.hourlyRateMin * 1.5).toString()
		};

		console.log('Timesheet Data submitted: ', timesheetData);

		const [result] = await db.insert(timeSheetTable).values(timesheetData).returning();

		return json(
			{ success: true, message: 'Timesheet submitted successfully', data: result },
			{
				status: 200,
				headers: corsHeaders
			}
		);
	} catch (err) {
		console.error('Error in POST /api/external/timesheets/submitTimesheetForCandidate:', err);
		if (err instanceof Error && 'status' in err && 'body' in err) {
			return json(
				{ success: false, message: (err as any).body.message },
				{
					status: (err as any).status,
					headers: corsHeaders
				}
			);
		}

		return json(
			{ success: false, message: 'Internal server error' },
			{
				status: 500,
				headers: corsHeaders
			}
		);
	}
};
