import { USER_ROLES } from '$lib/config/constants.js';
import { getCalendarEventsForAdmin } from '$lib/server/database/queries/admin';
import { getCalendarEventsForClient } from '$lib/server/database/queries/clients';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		redirect(301, '/sign-in');
	}

	if (user.role === USER_ROLES.SUPERADMIN) {
		const events = await getCalendarEventsForAdmin(user.id);

		return {
			user,
			events
		};
	}

	if (user?.role === USER_ROLES.CLIENT) {
		const events = await getCalendarEventsForClient(user.id);

		console.log(events);

		return {
			user,
			events
		};
	}

	return {
		user,
		events: []
	};
};
