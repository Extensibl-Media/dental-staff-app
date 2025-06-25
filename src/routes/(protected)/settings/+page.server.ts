import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate, message } from 'sveltekit-superforms/server';
import { setFlash } from 'sveltekit-flash-message/server';
import { clientCompanySchema, userSchema, userUpdatePasswordSchema } from '$lib/config/zod-schemas';
import { getUserByEmail, updateUser } from '$lib/server/database/queries/users';
import { USER_ROLES } from '$lib/config/constants.js';
import {
	getAllClientStaffProfiles,
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getClientStaffProfilebyClientId,
	getClientStaffProfilebyUserId,
	getPrimaryLocationForCompany,
	inviteStaffUsersToAccount
} from '$lib/server/database/queries/clients.js';
import { Argon2id } from 'oslo/password';
import { getClientBillingInfo } from '$lib/server/database/queries/billing.js';
import db from '$lib/server/database/drizzle.js';
import { eq } from 'drizzle-orm';
import { clientCompanyTable } from '$lib/server/database/schemas/client.js';
import { EmailService } from '$lib/server/email/emailService';
import { z } from 'zod';

const newStaffInvitesSchema = z.object({
	invitees: z
		.array(
			z.object({
				email: z.string().email({ message: 'Please enter a valid email address' }),
				staffRole: z.enum(['CLIENT_ADMIN', 'CLIENT_MANAGER', 'CLIENT_EMPLOYEE'], {
					required_error: 'Please select a staff role',
					invalid_type_error: 'Please select a valid staff role'
				})
			})
		)
		.min(1, 'Please add at least one staff member')
});

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

	if (user.role === USER_ROLES.SUPERADMIN) {
		const userProfileForm = await superValidate(event, userProfileSchema);
		const passwordForm = await superValidate(event, userUpdatePasswordSchema);

		userProfileForm.data = {
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email
		};
		return {
			user,
			passwordForm,
			userProfileForm
		};
	}

	if (user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.CLIENT_STAFF) {
		let billingInfo = null;

		const clientProfile =
			user.role === USER_ROLES.CLIENT
				? await getClientProfilebyUserId(user.id)
				: await getClientProfileByStaffUserId(user.id);
		const clientCompany = await getClientCompanyByClientId(clientProfile?.id);
		const staffProfile =
			user.role === USER_ROLES.CLIENT_STAFF ? await getClientStaffProfilebyUserId(user.id) : null;

		if (user.role === USER_ROLES.CLIENT) {
			billingInfo = await getClientBillingInfo(clientProfile?.id);
		}
		const hasAdminRights =
			user.role === USER_ROLES.CLIENT || staffProfile?.staffRole === 'CLIENT_ADMIN';

		const staff = hasAdminRights ? await getAllClientStaffProfiles(clientCompany.id) : null;

		const profileForm = null;
		const companyForm = await superValidate(event, clientCompanySchema);
		const userProfileForm = await superValidate(event, userProfileSchema);
		const subscriptionForm = null;
		const passwordForm = await superValidate(event, userUpdatePasswordSchema);
		const inviteForm = await superValidate(newStaffInvitesSchema);

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
		};

		return {
			user,
			profile: clientProfile,
			company: clientCompany,
			profileForm,
			companyForm,
			userProfileForm,
			subscriptionForm,
			passwordForm,
			billingInfo,
			staffProfile,
			hasAdminRights,
			staff,
			inviteForm
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

		const emailService = new EmailService();

		//add user to db
		try {
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
					await emailService.sendEmailAddressUpdateSuccessEmail(form.data.email, user?.token);
					await emailService.sendPossibleHijackEmail(form.data.email, user?.email);
				}
			}
		} catch (e) {
			console.error(e);
			return setError(form, 'There was a problem updating your profile.');
		}
		console.log('profile updated successfully');
		return message(form, 'Profile updated successfully.');
	},
	updateCompany: async (event) => {
		const user = event.locals.user;
		const form = await superValidate(event, clientCompanySchema);

		console.log({ form });

		if (!form.valid || !user) {
			return fail(400, {
				form
			});
		}

		try {
			// Get the client profile
			const clientProfile =
				user.role === USER_ROLES.CLIENT
					? await getClientProfilebyUserId(user.id)
					: await getClientProfileByStaffUserId(user.id);
			const clientCompany = await getClientCompanyByClientId(clientProfile?.id);

			if (!clientProfile) {
				return setError(form, 'Client profile not found.');
			}

			// Handle file upload if there's a new company logo
			// let companyLogo = form.data.companyLogo;
			// const formData = await event.request.formData();
			// const logoFile = formData.get('companyLogo');

			// Only process if it's an actual file (not string)
			// if (logoFile && typeof logoFile !== 'string' && logoFile.size > 0) {
			// 	// Here you would typically:
			// 	// 1. Upload the file to your storage (S3, local filesystem, etc.)
			// 	// 2. Get the URL or path of the uploaded file
			// 	// 3. Set companyLogo to that URL/path

			// 	// This is a placeholder - implement your file upload logic here
			// 	// companyLogo = await uploadFile(logoFile);

			// 	console.log('New logo file detected, would process upload here');
			// }

			// Parse operating hours from JSON string to object
			let operatingHours;
			try {
				operatingHours = JSON.parse(form.data.operatingHours);
			} catch (e) {
				console.error('Error parsing operating hours:', e);
				return setError(form, 'Invalid operating hours format.');
			}

			// Update the company details in the database
			// This assumes you have an updateCompany function in your queries
			// If not, you'll need to create one
			console.log(operatingHours);
			const [updates] = await db
				.update(clientCompanyTable)
				.set({
					companyName: form.data.companyName,
					companyDescription: form.data.companyDescription,
					// companyLogo: companyLogo,
					baseLocation: form.data.baseLocation,
					operatingHours: operatingHours // Store as object, not JSON string
				})
				.where(eq(clientCompanyTable.id, clientCompany.id))
				.returning();

			console.log(updates);
			setFlash({ type: 'success', message: 'Company details updated successfully.' }, event);
			return message(form, 'Company details updated successfully.');
		} catch (e) {
			console.error('Error updating company details:', e);
			return setError(form, 'There was a problem updating company details.');
		}
	},
	sendClientStaffInvites: async (event) => {
		// Log the raw form data first
		const formData = await event.request.formData();
		console.log('Raw form data:', Object.fromEntries(formData));

		// Parse the invitees from the form data
		const rawInvitees = formData.get('invitees');

		const user = event.locals.user;

		if (!user) {
			return fail(401);
		}

		const invitees = rawInvitees ? JSON.parse(rawInvitees.toString()) : [];

		const form = await superValidate(
			{ invitees }, // Pass the parsed data
			newStaffInvitesSchema
		);

		if (!form.valid) {
			console.log('Form validation errors:', form.errors);
			return fail(400, { form });
		}

		try {
			const { invitees } = form.data;
			const INVITE_EXPIRATION_DAYS = 7;
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRATION_DAYS);

			const client = await getClientProfilebyUserId(user?.id);
			const company = await getClientCompanyByClientId(client.id);
			const location = await getPrimaryLocationForCompany(company.id);

			if (!location) {
				throw new Error('Primary location not found');
			}

			// Format invites for our invite function
			const invites = invitees.map((invitee: { email: string; staffRole: string }) => ({
				id: crypto.randomUUID().toString(), // Generate a unique ID for each invite
				email: invitee.email.toLowerCase(),
				staffRole: invitee.staffRole,
				invitedRole: 'CLIENT_STAFF', // This is their platform role
				referrerRole: user.role as 'CANDIDATE' | 'CLIENT_STAFF' | 'SUPERADMIN' | 'CLIENT',
				referrerId: user.id,
				expiresAt: expiresAt
			}));

			// Send invites
			const results = await inviteStaffUsersToAccount(location.id, invites);

			// Check for any failures
			const failedInvites = results.filter((result) => !result.success);

			if (failedInvites.length > 0) {
				const failedEmails = failedInvites.map((f) => f.email).join(', ');
				setFlash(
					{
						type: 'error',
						message: `Some invitations could not be sent: ${failedEmails}. Please try again or contact support.`
					},
					event
				);
			} else {
				setFlash(
					{
						type: 'success',
						message: `Successfully sent ${results.length} staff invitation${results.length > 1 ? 's' : ''}.`
					},
					event
				);
			}
			// complete onboarding
			await updateUser(user.id, { completedOnboarding: true });
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

		// Only redirect if at least one invite was successful
		redirect(302, '/dashboard');
	}
};
