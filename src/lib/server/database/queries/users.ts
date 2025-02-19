import { eq } from 'drizzle-orm';
import db from '$lib/server/database/drizzle';
import { userInviteTable, userTable } from '$lib/server/database/schemas/auth';
import type { User, UpdateUser, NewUserInvite } from '$lib/server/database/schemas/auth';

export const getUserByEmail = async (email: string) => {
	const user = await db.select().from(userTable).where(eq(userTable.email, email));
	if (user.length === 0) {
		return null;
	} else {
		return user[0];
	}
};

export const getUserByToken = async (token: string) => {
	const user = await db.select().from(userTable).where(eq(userTable.token, token));
	if (user.length === 0) {
		return null;
	} else {
		return user[0];
	}
};

export const updateUser = async (id: string, user: UpdateUser) => {
	const result = await db.update(userTable).set(user).where(eq(userTable.id, id)).returning();
	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
};

export const createUser = async (values: User, tx?: any) => {
	try {
		const query = tx || db; // Use transaction if provided, otherwise use db

		const [user] = await query
			.insert(userTable)
			.values(values)
			.returning();

		return user;
	} catch (err) {
		console.log(err)
		throw new Error(`Error creating new user: ${err}`)
	}
};

export const getUserById = async (userId: string) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { password, ...rest } = userTable;
	try {
		const user = await db
			.select({ user: { ...rest } })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		return user[0] || null;
	} catch (err) {
		console.log(err);
	}
};
