import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getPaginatedCandidateProfiles } from '$lib/server/database/queries/candidates';

export const load: PageServerLoad = async ({ url, locals, setHeaders }) => {
	const skip = Number(url.searchParams.get('skip'));
	const sortBy = url.searchParams.get('sortBy')?.toString();
	const sortOn = url.searchParams.get('sortOn')?.toString();

	const orderBy = sortBy && sortOn ? { column: sortOn, direction: sortBy } : undefined;

	const user = locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === USER_ROLES.CANDIDATE) {
		redirect(302, '/dashboard');
	}

	setHeaders({
		'cache-control': 'max-age=60'
	});

	// if (user.role === USER_ROLES.SUPERADMIN) {
	const results = await getPaginatedCandidateProfiles({ limit: 10, offset: skip, orderBy });

	return {
		candidates: results?.candidates || [],
		count: results?.count || 0
	};
	// }
	// if (user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.CLIENT_STAFF) {
	// 	// const { candidates, count } = await getPaginatedCandidateProfiles({ limit: 10, offset: 0 });

	// 	return {
	// 		candidates:
	// 			candidates?.map((candidate) => ({
	// 				discipline: candidate.disciplines,
	// 				profile: candidate.candidate_profiles,
	// 				user: candidate.users
	// 			})) || [],
	// 		count: count || 0
	// 	};
	// }
};
