import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database/drizzle';
import {
	workdayTable,
	recurrenceDayTable,
	requisitionTable
} from '$lib/server/database/schemas/requisition';
import { clientCompanyTable } from '$lib/server/database/schemas/client';
import { authenticateUser } from '$lib/server/serverUtils';
import { and, eq, gte, lte } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { addDays } from 'date-fns';

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
		const user = await authenticateUser(request);
		if (!user) {
			return json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401, headers: corsHeaders }
			);
		}

		const body = await request.json();
		const { weekStartDate, requisitionId } = body;

		if (!weekStartDate || !requisitionId) {
			return json(
				{ success: false, message: 'Week start date and requisition ID required' },
				{ status: 400, headers: corsHeaders }
			);
		}

		// Calculate week end date
		const weekStart = new Date(weekStartDate);
		const weekEnd = addDays(weekStart, 6);
		const weekStartStr = weekStart.toISOString().split('T')[0];
		const weekEndStr = weekEnd.toISOString().split('T')[0];

		// Get all workdays for this user during this week
		const workdays = await db
			.select({
				workday: workdayTable,
				recurrenceDay: recurrenceDayTable,
				requisition: requisitionTable,
				company: clientCompanyTable
			})
			.from(workdayTable)
			.innerJoin(recurrenceDayTable, eq(workdayTable.recurrenceDayId, recurrenceDayTable.id))
			.innerJoin(requisitionTable, eq(workdayTable.requisitionId, requisitionTable.id))
			.innerJoin(clientCompanyTable, eq(requisitionTable.companyId, clientCompanyTable.id))
			.where(
				and(
					eq(workdayTable.requisitionId, requisitionId),
					gte(recurrenceDayTable.date, weekStartStr),
					lte(recurrenceDayTable.date, weekEndStr)
				)
			);

		return json({ success: true, workdays }, { headers: corsHeaders });
	} catch (err) {
		console.error('Error fetching workdays for week:', err);
		return json(
			{ success: false, message: 'Internal server error' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
