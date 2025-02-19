import type { PageServerLoad } from './$types';
import {
	getAllClientLocationsByCompanyId,
	getClientProfileById
} from '$lib/server/database/queries/clients';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const { id } = params;

	const result = await getClientProfileById(id);
	const locations = result.company ? await getAllClientLocationsByCompanyId(result.company.id) : [];

	return result
		? {
				user,
				client: {
					profile: result.profile,
					user: result.user,
					company: result.company,
					locations: locations
				}
			}
		: { user, client: null };
};
