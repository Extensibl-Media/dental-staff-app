import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import db from '$lib/server/database/drizzle';
import { eq } from 'drizzle-orm';
import { userTable } from '$lib/server/database/schemas/auth';
import { JWT_SECRET } from '$env/static/private';

interface JwtPayload {
	userId: string;
	// Add any other claims you include in your JWT
}

export function generateToken(userId: string): string {
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

export async function authenticateUser(event: Request) {
	const authHeader = event.headers.get('Authorization');

	if (!authHeader) {
		throw error(401, 'No authorization header');
	}

	const token = authHeader.split(' ')[1];

	if (!token) {
		throw error(401, 'No token provided');
	}

	try {
		// Verify the token
		const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

		// Check if the user exists in the database
		const user = await db.select().from(userTable).where(eq(userTable.id, decoded.userId)).limit(1);

		if (user.length === 0) {
			throw error(401, 'User not found');
		}

		// You might want to check other conditions here, such as:
		// - Is the user's account active?
		// - Has the user's permission changed since the token was issued?

		// Return the user object (or specific user data you need)
		return user[0];
	} catch (err) {
		if (err instanceof jwt.JsonWebTokenError) {
			throw error(401, 'Invalid token: ' + err);
		}
		throw error(500, 'Authentication error');
	}
}
