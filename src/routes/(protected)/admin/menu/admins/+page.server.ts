import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RequestEvent } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { userSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { getAdminUsers } from '$lib/server/database/queries/admin';
import { USER_ROLES } from '$lib/config/constants';

const adminUserSchema = userSchema.pick({
	email: true
});

export const load: PageServerLoad = async (event) => {
	const searchTerm = event.url.searchParams.get('search') || '';
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const form = await superValidate(event, adminUserSchema);
	const admins = await getAdminUsers(searchTerm);

	return {
		form,
		admins: admins || []
	};
};

export const actions = {
	// Actions can be added here in the future for admin management
	// For security reasons, admin deletion might be handled separately
	inviteAdminUser: async (event: RequestEvent) => {}
};
