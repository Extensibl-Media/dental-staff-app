import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import {
	getClientProfilebyUserId,
	getClientProfileByStaffUserId
} from '$lib/server/database/queries/clients';
import { getClientInvoices } from '$lib/server/database/queries/requisitions';
import { redirectIfNotValidCustomer } from '$lib/server/database/queries/billing';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		await redirectIfNotValidCustomer(client.id, user.role);

		const invoices = await getClientInvoices(client?.id);

		return {
			user,
			invoices,
			timesheets: []
		};
	}
	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		await redirectIfNotValidCustomer(client?.id, user.role);

		const invoices = await getClientInvoices(client?.id);

		return {
			user,
			invoices,
			timesheets: []
		};
	}
	if (user.role === USER_ROLES.SUPERADMIN) {
		return {
			user,
			invoices: []
		};
	}
};
