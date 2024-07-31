import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	return {
		templates: [],
		count: 0
	};
}) satisfies PageServerLoad;
