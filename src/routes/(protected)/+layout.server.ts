import { USER_ROLES } from '$lib/config/constants.js';
import { getClientStaffProfilebyUserId } from '$lib/server/database/queries/clients.js';

export const load = async (event) => {
	const user = event.locals.user

	if (user?.role === USER_ROLES.CLIENT) {
		return { user, isOfficeAdmin: true };
	}

	if (user?.role === USER_ROLES.CLIENT_STAFF) {
		const staffProfile = await getClientStaffProfilebyUserId(user.id)
		return { user, isOfficeAdmin: staffProfile.staffRole === "CLIENT_ADMIN" };
	}

	return { user };
};
