import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getAllClientProfiles, getClientProfilesCount } from '$lib/server/database/queries/clients';

export const load: PageServerLoad = async ({ url, locals, setHeaders }) => {
	const searchTerm = url.searchParams.get('search') || '';

	setHeaders({
		'cache-control': 'max-age=60'
	});
	const user = locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const results = await getAllClientProfiles(searchTerm);
	const count = await getClientProfilesCount();

	return {
		clients: results || [],
		count: count || 0
	};
};
