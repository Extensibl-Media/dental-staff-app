import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getPaginatedClientProfiles } from '$lib/server/database/queries/clients';

export const load: PageServerLoad = async ({ url, locals, setHeaders }) => {
	const skip = Number(url.searchParams.get('skip'));
	const sortBy = url.searchParams.get('sortBy')?.toString();
	const sortOn = url.searchParams.get('sortOn')?.toString();

	const orderBy = sortBy && sortOn ? { column: sortOn, direction: sortBy } : undefined;

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

	const results = await getPaginatedClientProfiles({ limit: 10, offset: skip, orderBy });

	return {
		clients: results?.clients || [],
		count: results?.count || 0
	};
};
