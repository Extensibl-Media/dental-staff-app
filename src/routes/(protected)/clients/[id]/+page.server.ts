import type { PageServerLoad } from './$types';
import {
	getAllClientLocationsByCompanyId,
	getAllClientStaffProfiles,
	getCalendarEventsForClient,
	getClientProfileById
} from '$lib/server/database/queries/clients';
import { redirect } from '@sveltejs/kit';
import { USER_ROLES } from '$lib/config/constants';
import {
	getSupportTicketsForClient,
	getSupportTicketsForUser
} from '$lib/server/database/queries/support';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const { id } = params;

	const result = await getClientProfileById(id);
	const locations = result.company ? await getAllClientLocationsByCompanyId(result.company.id) : [];
	const requisitions = await getCalendarEventsForClient(id);
	const supportTickets = await getSupportTicketsForClient(result.profile.id);
	const staff = await getAllClientStaffProfiles(result.company.id);

	console.log(staff);

	return result
		? {
				user,
				client: {
					profile: result.profile,
					user: result.user,
					company: result.company,
					locations: locations
				},
				requisitions,
				supportTickets,
				staff
			}
		: { user, client: null, requisitions: [], supportTickets: [] };
};
