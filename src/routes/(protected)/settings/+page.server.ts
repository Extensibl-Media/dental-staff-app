import { fail } from '@sveltejs/kit';
import { setError, superValidate, message } from 'sveltekit-superforms/server';
import { setFlash } from 'sveltekit-flash-message/server';
import { userSchema, userUpdatePasswordSchema } from '$lib/config/zod-schemas';
import { updateEmailAddressSuccessEmail } from '$lib/config/email-messages';
import { updateUser } from '$lib/server/database/queries/users';
import { USER_ROLES } from '$lib/config/constants.js';
import {
	getClientCompanyByClientId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients.js';

const userProfileSchema = userSchema.pick({
	firstName: true,
	lastName: true,
	email: true
});

export async function load(event) {
	const user = event.locals.user;

	if (!user) {
		return fail(400, {
			error: 'You must be signed in to view this page.'
		});
	}

	if (user.role === USER_ROLES.CLIENT) {
		const clientProfile = await getClientProfilebyUserId(user.id);
		const clientCompany = await getClientCompanyByClientId(clientProfile.id);
		// const clientSubscription = await getClientSubscription(user.id)

		const profileForm = null;
		const companyForm = null;
		const userForm = superValidate(event, userProfileSchema);
		const subscriptionForm = null;
		const passwordForm = await superValidate(userUpdatePasswordSchema);

		return {
			user,
			profile: clientProfile,
			company: clientCompany,
			profileForm,
			companyForm,
			userForm,
			subscriptionForm,
			passwordForm
		};
	}
}

export const actions = {
	updatePassword: async (event) => {
		const user = event.locals.user;
		const form = await superValidate(event, userUpdatePasswordSchema);

		if (!form.valid || !user) {
			return fail(400, {
				form
			});
		}
	},
	updateUser: async (event) => {}
};
