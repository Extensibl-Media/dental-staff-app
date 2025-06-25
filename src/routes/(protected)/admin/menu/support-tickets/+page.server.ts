import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getAllSupportTickets } from '$lib/server/database/queries/support';

export const load = async (event: RequestEvent) => {
	const user = event.locals.user;
	const searchTerm = event.url.searchParams.get('search') || '';

	if (!user) {
		redirect(302, '/auth/sign-in');
	}
	if (user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	try {
		const supportTickets = await getAllSupportTickets(searchTerm);

		return {
			user,
			supportTickets: supportTickets || [],
			searchTerm
		};
	} catch (error) {
		return {
			user,
			supportTickets: []
		};
	}
};
