import { USER_ROLES } from '$lib/config/constants';
import { redirectIfNotValidCustomer } from '$lib/server/database/queries/billing';
import {
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients';
import { getClientInvoices, getAllInvoicesAdmin } from '$lib/server/database/queries/requisitions';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	const { locals, url } = event;
	const searchTerm = url.searchParams.get('search') || '';

	const { user } = locals;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	let invoices: any = [];

	if (user.role === USER_ROLES.SUPERADMIN) {
		invoices = await getAllInvoicesAdmin(searchTerm);
	} else if (user.role === USER_ROLES.CLIENT) {
		if (!user.completedOnboarding) {
			redirect(302, '/onboarding/client/company');
		}
		const client = await getClientProfilebyUserId(user.id);
		await redirectIfNotValidCustomer(client.id, user.role);
		invoices = await getClientInvoices(client?.id, { searchTerm });
	} else if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		await redirectIfNotValidCustomer(client?.id, user.role);
		invoices = await getClientInvoices(client?.id, { searchTerm });
	}

	return { user, invoices: invoices || [], searchTerm };
};
