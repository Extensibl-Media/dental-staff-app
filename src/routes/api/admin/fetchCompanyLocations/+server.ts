import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getAllClientLocationsByCompanyId } from '$lib/server/database/queries/clients';

export const GET: RequestHandler = async ({ locals, url }) => {
	const companyId = url.searchParams.get('companyId');
	console.log(companyId);
	const user = locals.user;

	if (user?.role !== USER_ROLES.SUPERADMIN) {
		error(401, 'Unauthorized role, no access allowed.');
	}

	if (!companyId) {
		error(400, 'No companyId provided');
	}

	const locations = await getAllClientLocationsByCompanyId(companyId);

	return json(locations);
};
