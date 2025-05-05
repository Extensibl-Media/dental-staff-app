import { USER_ROLES } from '$lib/config/constants';
import {
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients';
import {
	getAllTimesheetsForClient,
	getAllTimesheetsAdmin
} from '$lib/server/database/queries/requisitions';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	const { locals } = event;

	const { user } = locals;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === USER_ROLES.SUPERADMIN) {
		const timesheets = await getAllTimesheetsAdmin();

		return { user, timesheets };
	}

	if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		const timesheets = await getAllTimesheetsForClient(client?.id);

		return {
			user,
			timesheets
		};
	}
	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		const timesheets = await getAllTimesheetsForClient(client?.id);

		return {
			user,
			timesheets
		};
	}

	return {
		user,
		timesheets: []
	};
};
