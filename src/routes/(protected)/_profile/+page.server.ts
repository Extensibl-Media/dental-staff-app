import { fail } from '@sveltejs/kit';
import { setError, superValidate, message } from 'sveltekit-superforms/server';
import { setFlash } from 'sveltekit-flash-message/server';
import {
	userSchema,
	userUpdatePasswordSchema,
	type UserUpdatePasswordSchema
} from '$lib/config/zod-schemas';
import { updateUser } from '$lib/server/database/queries/users';
import { EmailService } from '$lib/server/email/emailService';

const profileSchema = userSchema.pick({
	firstName: true,
	lastName: true,
	email: true
});

export const load = async (event) => {
	const form = await superValidate(event, profileSchema);

	const user = event.locals.user;
	if (!user) {
		return fail(400, {
			form,
			error: 'You must be signed in to view this page.'
		});
	}
	form.data = {
		firstName: user?.firstName,
		lastName: user?.lastName,
		email: user?.email
	};
	return {
		form
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, profileSchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		const emailService = new EmailService();

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
					// await updateEmailAddressSuccessEmail(form.data.email, user?.email, user?.token);
					await emailService.sendEmailAddressUpdateSuccessEmail(
						form.data.email,
						user?.email,
						user?.token
					);
					await emailService.sendPossibleHijackEmail(form.data.email, user?.email);
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
