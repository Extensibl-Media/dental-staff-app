import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RequestEvent } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { userSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { getAdminUsers } from '$lib/server/database/queries/admin';
import { USER_ROLES } from '$lib/config/constants';
import { z } from 'zod';
import db from '$lib/server/database/drizzle';
import { userInviteTable } from '$lib/server/database/schemas/auth';

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
	default: async (event: RequestEvent) => {
		const user = event.locals.user;

		if (!user) {
			return fail(401);
		}

		const form = await superValidate(
			event, // Pass the parsed data
			z.object({
				email: z.string().email('Invalid email address')
			})
		);

		if (!form.valid) {
			console.log('Form validation errors:', form.errors);
			return fail(400, { form });
		}

		console.log('Form data is valid:', form.data);

		try {
			const { email } = form.data;
			const INVITE_EXPIRATION_DAYS = 7;
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRATION_DAYS);

			// Format invites for our invite function
			const invite = {
				token: crypto.randomUUID().toString(), // Unique token for the invite link
				id: crypto.randomUUID().toString(), // Generate a unique ID for each invite
				email: email.toLowerCase(),
				invitedRole: 'SUPERADMIN', // This is their platform role
				referrerRole: 'SUPERADMIN' as const,
				referrerId: user.id,
				expiresAt: expiresAt
			};

			// Send invite
			await db.insert(userInviteTable).values(invite);
			setFlash(
				{
					type: 'success',
					message: `Invitation sent to ${email}`
				},
				event
			);
			return message(form, 'Invitation sent successfully');
		} catch (error) {
			console.error('Error sending staff invites:', error);
			setFlash(
				{
					type: 'error',
					message: 'There was a problem sending the invitations. Please try again.'
				},
				event
			);

			return fail(500, {
				form,
				error: 'Failed to send invitations'
			});
		}
	}
};
