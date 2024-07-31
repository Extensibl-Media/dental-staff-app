import { or, ilike } from 'drizzle-orm';
import db from '../drizzle';
import { userTable } from '../schemas/auth';

export async function searchUsers(searchTerm: string) {
	const lowerSearchTerm = searchTerm.toLowerCase();

	const result = await db
		.select()
		.from(userTable)
		.where(
			or(
				ilike(userTable.firstName, `%${lowerSearchTerm}%`),
				ilike(userTable.lastName, `%${lowerSearchTerm}%`),
				ilike(userTable.email, `%${lowerSearchTerm}%`)
			)
		);

	return result;
}
