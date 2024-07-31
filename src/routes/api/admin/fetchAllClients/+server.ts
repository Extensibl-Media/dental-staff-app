import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getAllClientProfiles } from '$lib/server/database/queries/clients';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (user?.role !== USER_ROLES.SUPERADMIN) {
		error(401, 'Unauthorized role, no access allowed.');
	}

	const clients = await getAllClientProfiles();

	return json(clients);
};
