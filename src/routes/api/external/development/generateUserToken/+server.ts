import db from '$lib/server/database/drizzle';
import { userTable } from '$lib/server/database/schemas/auth';
import { generateToken } from '$lib/server/serverUtils';
import { type RequestHandler, error, json } from '@sveltejs/kit';
import { eq, and, inArray } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { userId } = await request.json();

		console.log(userId);

		const user = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);

		if (user.length === 0) {
			throw error(401, 'User not found');
		}

		const token = generateToken(userId);

		return json({ token });
	} catch (err) {
		console.error(err);
		throw error(500, 'Internal server error');
	}
};
