import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import {
	addStaffToLocation,
	getAllClientStaffProfiles,
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getClientStaffProfilebyClientId,
	getLocationByIdForCompany,
	getStaffProfilesForLocation
} from '$lib/server/database/queries/clients';
import type { ClientProfile } from '$lib/server/database/schemas/client';
import { getRequsitionsForLocation } from '$lib/server/database/queries/requisitions';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { setFlash } from 'sveltekit-flash-message/server';

const assignStaffToLocationSchema = z.object({
	staffId: z.string(),
	locationId: z.string(),
	companyId: z.string(),
	isPrimary: z.boolean()
});

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	const { id } = event.params;

	if (!user) {
		redirect(301, '/sign-in');
	}
	const form = await superValidate(event, assignStaffToLocationSchema);

	if (user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.CLIENT_STAFF) {
		const client: ClientProfile | null =
			user.role === USER_ROLES.CLIENT
				? await getClientProfilebyUserId(user.id)
				: await getClientProfileByStaffUserId(user.id);

		if (client) {
			const company = await getClientCompanyByClientId(client.id);
			const location = await getLocationByIdForCompany(id, company.id);
			const requisitions = await getRequsitionsForLocation(location.id);
			const locationStaff = await getStaffProfilesForLocation(location.id);
			const staff = await getAllClientStaffProfiles(company.id, location.id);

			return {
				user,
				client,
				company,
				location,
				requisitions,
				locationStaff,
				allStaff: staff,
				assignForm: form
			};
		} else
			return {
				user,
				client: null,
				company: null,
				location: null,
				requisitions: null,
				locationStaff: null,
				allStaff: null,
				assignForm: null
			};
	}
};

export const actions = {
	assignStaff: async (event: RequestEvent) => {
		const currentUser = event.locals.user;

		if (!currentUser) {
			fail(401);
		}

		const form = await superValidate(event, assignStaffToLocationSchema);

		if (!form.valid) {
			fail(400, { form });
		}

		try {
			const values = {
				id: crypto.randomUUID(),
				companyId: form.data.companyId,
				staffId: form.data.staffId,
				locationId: form.data.locationId,
				isPrimary: form.data.isPrimary
			};

			await addStaffToLocation(values);
			setFlash(
				{
					type: 'success',
					message: 'Staff added to location successfully.'
				},
				event
			);
			return { form, success: true };
		} catch (e) {
			console.error(e);
			setFlash(
				{
					type: 'error',
					message: 'Error adding staff to location.'
				},
				event
			);
			return { form, success: false };
		}
	}
};
