import { fail } from '@sveltejs/kit';
import { setError, superValidate, message } from 'sveltekit-superforms/server';
import { setFlash } from 'sveltekit-flash-message/server';
import { clientCompanySchema, userSchema, userUpdatePasswordSchema } from '$lib/config/zod-schemas';
import { updateEmailAddressSuccessEmail } from '$lib/config/email-messages';
import { getUserByEmail, updateUser } from '$lib/server/database/queries/users';
import { USER_ROLES } from '$lib/config/constants.js';
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients.js';
import { Argon2id } from 'oslo/password';
import { getClientBillingInfo } from '$lib/server/database/queries/billing.js';

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

	if (user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.CLIENT_STAFF) {
		let billingInfo = null


		const clientProfile = user.role === USER_ROLES.CLIENT
			? await getClientProfilebyUserId(user.id)
			: await getClientProfileByStaffUserId(user.id);
		const clientCompany = await getClientCompanyByClientId(clientProfile?.id);

		if (user.role === USER_ROLES.CLIENT) {
			billingInfo = await getClientBillingInfo(clientProfile?.id);
		}

		const profileForm = null;
		const companyForm = await superValidate(event, clientCompanySchema);
		const userProfileForm = await superValidate(event, userProfileSchema);
		const subscriptionForm = null;
		const passwordForm = await superValidate(event, userUpdatePasswordSchema);

		userProfileForm.data = {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email
		};

		companyForm.data = {
			companyName: clientCompany.companyName as string,
			companyDescription: clientCompany.companyDescription as string,
			companyLogo: clientCompany.companyLogo as string,
			baseLocation: clientCompany.baseLocation as string,
			operatingHours: JSON.stringify(clientCompany.operatingHours)
		}

		return {
			user,
			profile: clientProfile,
			company: clientCompany,
			profileForm,
			companyForm,
			userProfileForm,
			subscriptionForm,
			passwordForm,
			billingInfo
		};
	}
}

export const actions = {
	updatePassword: async (event) => {
		const user = event.locals.user;
		const userData = await getUserByEmail(user?.email as string);
		const form = await superValidate(event, userUpdatePasswordSchema);

		console.log({ form });

		if (!form.valid || !user) {
			return fail(400, {
				form
			});
		}

		const currentPassword = form.data.password;
		const newPassword = form.data.newPassword;
		const confirmPassword = form.data.confirmPassword;

		if (newPassword !== confirmPassword) return fail(400, { form });

		const isValidPassword = await new Argon2id().verify(
			userData?.password as string,
			currentPassword
		);

		console.log({ isValidPassword });

		if (isValidPassword) {
			try {
				const password = await new Argon2id().hash(form.data.newPassword);

				await updateUser(user.id, { password: password });

				setFlash({ type: 'success', message: 'Password update successful.' }, event);
			} catch (error) {
				console.error(error);
				return setError(
					form,
					'The was a problem resetting your password. Please contact support if you need further help.'
				);
			}
		} else {
			setFlash({ type: 'error', message: 'Invalid Password.' }, event);
			return setError(form, 'Current password is invalid.');
		}
	},
	updateUser: async (event) => {
		const user = event.locals.user;
		const form = await superValidate(event, userProfileSchema);

		console.log({ form });

		if (!form.valid || !user) {
			return fail(400, {
				form
			});
		}

		//add user to db
		try {
			console.log('updating profile');
			const user = event.locals.user;
			if (user) {
				await updateUser(user.id, {
					firstName: form.data.firstName,
					lastName: form.data.lastName,
					email: form.data.email
				});
				setFlash({ type: 'success', message: 'Profile update successful.' }, event);
			}

			if (user?.email !== form.data.email) {
				if (user) {
					await updateUser(user?.userId, {
						verified: false
					});
					await updateEmailAddressSuccessEmail(form.data.email, user?.email, user?.token);
				}
			}
		} catch (e) {
			console.error(e);
			return setError(form, 'There was a problem updating your profile.');
		}
		console.log('profile updated successfully');
		return message(form, 'Profile updated successfully.');
	}
};
