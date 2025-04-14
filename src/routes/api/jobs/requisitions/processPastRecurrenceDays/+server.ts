import { json, type RequestHandler } from '@sveltejs/kit';
import db from '$lib/server/database/drizzle';
import { recurrenceDayTable } from '$lib/server/database/schemas/requisition';
import { and, eq, inArray, lt, or } from 'drizzle-orm';
import crypto from 'crypto';
import { CRON_SECRET } from '$env/static/private';

export const GET: RequestHandler = async ({ request }) => {
	// const timestamp = request.headers.get('x-timestamp');
	const signature = request.headers.get('x-signature');

	// Check if timestamp is recent (prevent replay attacks)
	// const nowTs = Date.now();
	// if (!timestamp || nowTs - parseInt(timestamp) > 5 * 60 * 1000) {
	// 	// 5 minute window
	// 	return new Response('Expired request', { status: 401 });
	// }

	const expectedSignature = crypto.createHmac('sha256', CRON_SECRET).digest('hex');

	if (signature !== expectedSignature) {
		return new Response('Invalid signature', { status: 401 });
	}

	try {
		const today = new Date().toISOString().split('T')[0];
		const now = new Date();
		const currentTimeString = now.toTimeString().split(' ')[0];

		const pastRecurrenceDays = await db
			.select()
			.from(recurrenceDayTable)
			.where(
				and(
					eq(recurrenceDayTable.status, 'OPEN'),
					or(
						lt(recurrenceDayTable.date, today), // Earlier dates
						and(
							eq(recurrenceDayTable.date, today), // Today's date...
							lt(recurrenceDayTable.dayEndTime, currentTimeString) // ...but end time passed
						)
					)
				)
			);
		if (pastRecurrenceDays.length === 0) {
			return json({
				success: true,
				message: 'Job ran successfuly with no recurrence days to process.',
				data: pastRecurrenceDays
			});
		}
		const ids = pastRecurrenceDays.map((day) => day.id);

		const updateResult = await db
			.update(recurrenceDayTable)
			.set({
				status: 'UNFULFILLED',
				updatedAt: new Date()
			})
			.where(inArray(recurrenceDayTable.id, ids))
			.returning();
		return json({
			success: true,
			message: 'Job ran successfuly!',
			data: updateResult.map((day) => ({ id: day.id, requisitionId: day.requisitionId }))
		});
	} catch (error) {
		return json(
			{
				success: false,
				error: error
			},
			{ status: 500 }
		);
	}
};
