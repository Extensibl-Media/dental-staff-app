import {
	getClientCompanyByClientId,
	getClientProfilebyUserId,
	getClientStaffProfilebyUserId,
	getPaginatedClientStaffProfiles
} from '$lib/server/database/queries/clients';
import { USER_ROLES } from '$lib/config/constants.js';
import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms/server';

export const load = async (event: RequestEvent) => {
	const skip = Number(event.url.searchParams.get('skip'));
	const sortBy = event.url.searchParams.get('sortBy')?.toString();
	const sortOn = event.url.searchParams.get('sortOn')?.toString();

	const orderBy = sortBy && sortOn ? { column: sortOn, direction: sortBy } : undefined;
	const user = event.locals.user;

	if (!user) {
		redirect(301, '/auth/sign-in');
	}

	if (user.role === USER_ROLES.SUPERADMIN) {
		return { user };
	} else if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		const company = await getClientCompanyByClientId(client.id);

		const staffList = await getPaginatedClientStaffProfiles(
			company.id,
			{
				limit: 10,
				offset: skip,
				orderBy
			});

		return {
			user,
			staff: staffList.staff,
			count: staffList.count
		};
	} else if (user.role === USER_ROLES.CLIENT_STAFF) {
		const profile = await getClientStaffProfilebyUserId(user.id);

		const staffList = await getPaginatedClientStaffProfiles(
			profile.companyId,
			{
				limit: 10,
				offset: skip,
				orderBy
			});

		return {
			user,
			staff: staffList.staff,
			count: staffList.count
		};
	}
};
