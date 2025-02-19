import { USER_ROLES } from '$lib/config/constants.js';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { getClientDashboardData, getClientProfileByStaffUserId, getClientProfilebyUserId, getClientStaffProfilebyUserId } from '$lib/server/database/queries/clients';
import { newSupportTicketSchema } from '$lib/config/zod-schemas';
import { superValidate } from 'sveltekit-superforms/server';

export const load = async (event: RequestEvent) => {
	//I only have this function here so it will check page again
	//instead of keeping it cache if it was client side only.
	//If only client side, it might still show the page even
	//if the user has logged out.
	// const session = await locals.auth.validate();
	event.setHeaders({
		'cache-control': 'max-age=60'
	});

	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === 'SUPERADMIN') {
		return { user };
	}

	if (user.role === USER_ROLES.CLIENT) {

		const supportTicketForm = await superValidate(event, newSupportTicketSchema);

		if (!user.completedOnboarding) {
			redirect(302, '/onboarding/client/company');
		}

		const client = await getClientProfilebyUserId(user.id)
		const {
			requisitions,
			supportTickets,
			newApplicationsCount,
			timesheetsDueCount,
			discrepanciesCount,
			positionApplications,
			timesheetsDue
		} = await getClientDashboardData(client?.id, user.id)

		return {
			user,
			profile: client,
			client,
			requisitions,
			recentApplications: positionApplications,
			supportTickets,
			newApplicationsCount,
			timesheetsDue,
			timesheetsDueCount,
			discrepanciesCount,
			supportTicketForm,
		};
	}

	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		const profile = await getClientStaffProfilebyUserId(user.id)
		const supportTicketForm = await superValidate(event, newSupportTicketSchema);


		const {
			requisitions,
			supportTickets,
			newApplicationsCount,
			timesheetsDueCount,
			discrepanciesCount,
			positionApplications,
			timesheetsDue
		} = await getClientDashboardData(client?.id, user.id)

		return {
			user,
			profile,
			client,
			requisitions,
			recentApplications: positionApplications,
			supportTickets,
			newApplicationsCount,
			timesheetsDue,
			timesheetsDueCount,
			discrepanciesCount,
			supportTicketForm,
		};
	}

	return null;
};
