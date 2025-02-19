import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { Argon2id } from 'oslo/password';
import { lucia } from '$lib/server/lucia';
import { createUser } from '$lib/server/database/queries/users';

import { userSchema } from '$lib/config/zod-schemas';
import { sendVerificationEmail } from '$lib/config/email-messages';
import db from '$lib/server/database/drizzle';
import { eq } from 'drizzle-orm';
import { companyStaffInviteLocations, userInviteTable } from '$lib/server/database/schemas/auth';
import {
	clientStaffLocationTable,
	clientStaffProfileTable
} from '$lib/server/database/schemas/client.js';
import { getClientIdByCompanyId } from '$lib/server/database/queries/clients.js';
import type { PageServerLoad, RequestEvent } from './$types';

const signUpSchema = userSchema.pick({
	firstName: true,
	lastName: true,
	email: true,
	password: true,
	terms: true
});

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		redirect(302, '/dashboard');
	}

	const queryParams = event.url.searchParams;
	const email = queryParams.get('email');
	const invite = Boolean(queryParams.get('invite'));

	const form = await superValidate(event, signUpSchema);

	console.log({ email, invite });

	const staffInviteCookie = event.cookies.get('staff_invite');

	console.log({ staffInviteCookie });

	if (email && invite) {
		form.data.email = email;
	}

	return {
		signupForm: form
	};
};

export const actions = {
	default: async (event: RequestEvent) => {
		const form = await superValidate(event, signUpSchema);
		console.log(form.data);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const password = await new Argon2id().hash(form.data.password);
			const id = crypto.randomUUID();
			let inviteData = null;
			const token = crypto.randomUUID();

			// Check for staff invite
			const staffInviteCookie = event.cookies.get('staff_invite');

			// console.log({ staffInviteCookie });
			if (staffInviteCookie) {
				try {
					inviteData = await JSON.parse(staffInviteCookie);

					// Verify the invite email matches the registration email
					if (inviteData.email.toLowerCase() !== form.data.email.toLowerCase()) {
						return setError(form, 'email', 'Please use the email address from your invitation.');
					}
				} catch (error) {
					console.error('Error processing invite data:', error);
					return setError(
						form,
						'email',
						'Invalid or expired invitation. Please request a new invitation.'
					);
				}
			}

			const user = {
				id: id,
				email: form.data.email.toLowerCase(),
				firstName: form.data.firstName,
				lastName: form.data.lastName,
				password: password,
				role: inviteData ? inviteData.invitedRole : 'CLIENT', // Use invite role if available
				verified: inviteData ? true : false, // Auto-verify invited users since they came through an email link
				receiveEmail: true,
				token,
				createdAt: new Date(),
				updatedAt: new Date(),
				provider: 'email',
				providerId: '',
				avatarUrl: null,
				// all staff invites for now don't need onboarding since their profile is bare info relationships to client/company details
				completedOnboarding: inviteData.invitedRole === 'CLIENT_STAFF' ? true : false,
				blacklisted: null,
				onboardingStep: 1,
				stripeCustomerId: null
			};

			const newUser = await db.transaction(async (tx) => {
				// First create the user
				const createdUser = await createUser(user, tx); // Make sure createUser uses the transaction

				if (!createdUser) {
					throw new Error('Failed to create user');
				}

				// If this was an invite-based registration, handle the additional setup
				if (inviteData) {
					const clientId = await getClientIdByCompanyId(inviteData.companyId);

					if (!clientId) {
						throw new Error(`No client found for company ID: ${inviteData.companyId}`);
					}

					// Now create the staff profile
					const [staffProfile] = await tx
						.insert(clientStaffProfileTable)
						.values({
							id: crypto.randomUUID(),
							userId: createdUser.id, // Make sure we're using the created user's ID
							companyId: inviteData.companyId,
							clientId: clientId,
							staffRole: inviteData.staffRole
						})
						.returning();

					// Add location associations
					await tx.insert(clientStaffLocationTable).values(
						inviteData.locations.map((locationId: string) => ({
							id: crypto.randomUUID(),
							companyId: inviteData.companyId,
							staffId: staffProfile.id,
							locationId,
							isPrimary: true
						}))
					);

					// Mark the invites as used
					await tx
						.update(userInviteTable)
						.set({ token: null })
						.where(eq(userInviteTable.token, inviteData.token));

					await tx
						.update(companyStaffInviteLocations)
						.set({ token: null })
						.where(eq(companyStaffInviteLocations.token, inviteData.token));
				}

				return createdUser;
			});

			if (newUser) {
				// Create session
				const session = await lucia.createSession(newUser.id, {});
				const sessionCookie = lucia.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});

				// Clear the invite cookie if it exists
				if (staffInviteCookie) {
					event.cookies.delete('staff_invite', { path: '/' });
				}

				// Set appropriate flash message
				if (inviteData) {
					setFlash(
						{
							type: 'success',
							message: 'Account created successfully. Welcome to the team!'
						},
						event
					);
				} else {
					await sendVerificationEmail(newUser.email, user.token);
					setFlash(
						{
							type: 'success',
							message: 'Account created. Please check your email to verify your account.'
						},
						event
					);
				}
			}
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Account was not able to be created.' }, event);
			return setError(form, 'email', 'A user with that email already exists.');
		}
		return { form };
	}
};
