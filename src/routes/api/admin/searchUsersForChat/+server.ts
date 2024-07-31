import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { searchUsers } from '$lib/server/database/queries/search';

export const POST: RequestHandler = async ({ locals, request }) => {
	// const user = locals.user;

	// if (user?.role !== USER_ROLES.SUPERADMIN) {
	// 	error(401, 'Unauthorized role, no access allowed.');
	// }

	const { search } = await request.json();

	const users = await searchUsers(search);

	return json(users || []);
};
