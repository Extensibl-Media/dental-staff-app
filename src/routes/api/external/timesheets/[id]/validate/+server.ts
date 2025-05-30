import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { authenticateUser } from '$lib/server/serverUtils';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { timeSheetTable } from '$lib/server/database/schemas/requisition';
import db from '$lib/server/database/drizzle';
import { candidateProfileTable } from '$lib/server/database/schemas/candidate';
import { writeActionHistory } from '$lib/server/database/queries/admin';

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

const validateTimesheetSchema = z.object({
	status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISCREPANCY', 'VOID'])
});

export const POST: RequestHandler = async ({ request, params }) => {
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

		if (!body) {
			return json(
				{ success: false, message: 'Invalid JSON body' },
				{ status: 400, headers: corsHeaders }
			);
		}

		const parsedBody = validateTimesheetSchema.safeParse(body);
		if (!parsedBody.success) {
			return json(
				{ success: false, message: parsedBody.error.errors[0].message },
				{ status: 400, headers: corsHeaders }
			);
		}
		const { status } = parsedBody.data;
		const { id } = params;

		const [candidate] = await db
			.select()
			.from(candidateProfileTable)
			.where(eq(candidateProfileTable.userId, user.id));

		if (!candidate) {
			return json(
				{ success: false, message: 'Candidate profile not found' },
				{ status: 404, headers: corsHeaders }
			);
		}

		const [timesheet] = await db
			.select()
			.from(timeSheetTable)
			.where(
				and(eq(timeSheetTable.id, id), eq(timeSheetTable.associatedCandidateId, candidate.id))
			);

		if (!timesheet) {
			return json(
				{ success: false, message: 'Timesheet not found' },
				{ status: 404, headers: corsHeaders }
			);
		}
		// Update timesheet status
		const [result] = await db
			.update(timeSheetTable)
			.set({ status })
			.where(and(eq(timeSheetTable.id, id), eq(timeSheetTable.associatedCandidateId, candidate.id)))
			.returning();

		await writeActionHistory({
			action: 'UPDATE',
			userId: user.id,
			entityId: timesheet.id,
			table: 'TIMESHEETS',
			beforeState: timesheet,
			afterState: result
		});
		return json(
			{ success: true, message: 'Timesheet sent for revalidation', data: result },
			{ headers: corsHeaders }
		);
	} catch (err) {
		console.error('Error in POST /api/external/timesheets/:id/validate - ', err);
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
