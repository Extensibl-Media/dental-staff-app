import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getInvoiceById, getInvoiceByIdAdmin } from '$lib/server/database/queries/requisitions';
import { getClientProfilebyUserId } from '$lib/server/database/queries/clients';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === USER_ROLES.SUPERADMIN) {
		const invoiceDetails = await getInvoiceByIdAdmin(event.params.id);

		return {
			user,
			invoice: invoiceDetails
		};
	}

	if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		const invoiceDetails = await getInvoiceById(event.params.id, client.id);

		return {
			user,
			invoice: invoiceDetails
		};
	}

	return {
		user,
		invoice: null
	};
};
