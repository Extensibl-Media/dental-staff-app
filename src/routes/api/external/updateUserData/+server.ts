import { authenticateUser } from '$lib/server/serverUtils';
import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import db from '$lib/server/database/drizzle';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { userTable } from '$lib/server/database/schemas/auth';

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

		const body = await request.json().catch(() => null);
		if (!body || typeof body !== 'object') {
			return json(
				{ success: false, message: 'Invalid request body' },
				{ status: 400, headers: corsHeaders }
			);
		}

		const parsedProfile = z
			.object({
				firstName: z.string().optional(),
				lastName: z.string().optional(),
				email: z.string().email().optional(),
				avatarUrl: z.string().optional(),
				onboardingStep: z.number().optional(),
				timezone: z.string().optional(),
				completedOnboarding: z.boolean().optional()
			})
			.safeParse(body);

		if (!parsedProfile.success) {
			return json(
				{ success: false, message: 'Invalid user data', errors: parsedProfile.error.flatten() },
				{ status: 400, headers: corsHeaders }
			);
		}

		const [updatedUser] = await db
			.update(userTable)
			.set(parsedProfile.data)
			.where(eq(userTable.id, user.id))
			.returning();

		return json(
			{
				success: true,
				message: 'User updated successfully',
				user: updatedUser
			},
			{ status: 200, headers: corsHeaders }
		);
	} catch (error) {
		console.error('Error updating user data:', error);
		return json(
			{ success: false, message: 'An unexpected error occurred' },
			{ status: 500, headers: corsHeaders }
		);
	}
};
