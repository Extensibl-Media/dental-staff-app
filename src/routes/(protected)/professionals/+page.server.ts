import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getAllCandidateProfiles } from '$lib/server/database/queries/candidates';

export const load: PageServerLoad = async ({ url, locals, setHeaders }) => {
	const searchTerm = url.searchParams.get('search')?.toString();

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

	const results = await getAllCandidateProfiles(searchTerm);

	return {
		candidates: results?.candidates || [],
		count: results?.count || 0,
		searchTerm: searchTerm || ''
	};
};
