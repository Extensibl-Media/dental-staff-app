import { USER_ROLES } from '$lib/config/constants.js';
// import { getClientProfilebyUserId } from '$lib/server/database/queries/clients';
import { redirect } from '@sveltejs/kit';
export const load = async ({ locals, setHeaders }) => {
	//I only have this function here so it will check page again
	//instead of keeping it cache if it was client side only.
	//If only client side, it might still show the page even
	//if the user has logged out.
	//const session = await event.locals.auth.validate();
	setHeaders({
		'cache-control': 'max-age=60'
	});

	const user = locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === 'SUPERADMIN') {
		return { user, adminMessage: 'You are an admin, Harry!' };
	}

	if (user.role === USER_ROLES.CLIENT) {
		// const profile = await getClientProfilebyUserId(user.id);
		// if (!profile) {
		// 	redirect(302, '/onboarding/client/company');
		// }

		return { user, clientMessage: 'You are just a client, Harriett!' };
	}

	if (user.role === 'CANDIDATE') {
		return { user, candidateMessage: 'You are the next candidate!' };
	}
	return null;
};
