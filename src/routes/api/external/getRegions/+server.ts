import db from '$lib/server/database/drizzle';
import { json, type RequestHandler } from '@sveltejs/kit';
import { regionTable } from '$lib/server/database/schemas/region';
import { env } from '$env/dynamic/private';

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

export const GET: RequestHandler = async () => {
	try {
		const regions = await db.select().from(regionTable);
		return json({ success: true, regions });
	} catch (error) {
		console.error('Error fetching regions:', error);
		return json(
			{ success: false, message: 'Internal server error', error: error },
			{ status: 500, headers: corsHeaders }
		);
	}
};
