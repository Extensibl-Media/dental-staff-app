import type { PageServerLoad } from './$types';
import { getCandidateProfileById } from '$lib/server/database/queries/candidates';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const { id } = params;

	const result = await getCandidateProfileById(id);

	return result
		? {
				user,
				candidate: {
					profile: result.profile,
					user: result.user,
					discipline: result.discipline,
					region: result.region,
					subregion: result.subRegion
				}
			}
		: { user, candidate: null };
};
