import { USER_ROLES } from '$lib/config/constants.js';
import { getCalendarEventsForAdmin } from '$lib/server/database/queries/admin';
import { redirectIfNotValidCustomer } from '$lib/server/database/queries/billing';
import {
	getCalendarEventsForClient,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients';
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
		const profile = await getClientProfilebyUserId(user.id);
		await redirectIfNotValidCustomer(profile.id, user.role);

		const events = await getCalendarEventsForClient(profile.id);

		return {
			user,
			events
		};
	}

	if (user?.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		await redirectIfNotValidCustomer(client?.id, user.role);

		const events = await getCalendarEventsForClient(client?.id);

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
