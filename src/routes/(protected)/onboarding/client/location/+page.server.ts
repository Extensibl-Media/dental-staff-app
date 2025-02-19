import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms/server';

import { clientCompanyLocationSchema } from '$lib/config/zod-schemas';
import {
	createCompanyLocation,
	getClientCompanyByClientId,
	getClientProfilebyUserId,
	getPrimaryLocationForCompany
} from '$lib/server/database/queries/clients.js';
import { getRegionByAbbreviation } from '$lib/server/database/queries/regions.js';

const companyLocationSchema = clientCompanyLocationSchema.pick({
	name: true,
	streetOne: true,
	streetTwo: true,
	city: true,
	state: true,
	zipcode: true,
	phoneNumber: true,
	phoneNumberType: true,
	email: true
});

export const load = async (event) => {
	const form = await superValidate(event, companyLocationSchema);

	const user = event.locals.user

	if (!user) {
		redirect(302, '/auth/sign-in')
	}

	const client = await getClientProfilebyUserId(user.id)

	const company = await getClientCompanyByClientId(client.id)

	if (!company) redirect(302, "/onboarding/client/company")

	const location = await getPrimaryLocationForCompany(company.id)

	if (location) redirect(302, '/onboarding/client/staff')

	return {
		user,
		form
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, companyLocationSchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const locationId = await crypto.randomUUID();
			const client = await getClientProfilebyUserId(event.locals.user!.id);
			const company = await getClientCompanyByClientId(client.id);
			const region = form.data.state ? await getRegionByAbbreviation(form.data.state) : null;
			const newLocation = await createCompanyLocation({
				id: locationId,
				createdAt: new Date(),
				updatedAt: new Date(),
				companyId: company.id,
				name: form.data.name,
				streetOne: form.data.streetOne || null,
				streetTwo: form.data.streetTwo || null,
				city: form.data.city || null,
				cellPhone: form.data.phoneNumberType === 'cell' ? form.data.phoneNumber : null,
				companyPhone: form.data.phoneNumberType === 'office' ? form.data.phoneNumber : null,
				email: form.data.email || null,
				regionId: region?.id || null
			});

			if (newLocation) {
				setFlash(
					{
						type: 'success',
						message: 'New location created!'
					},
					event
				);
			}
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Location was not able to be created.' }, event);
			return setError(form, 'Error creating location.');
		}
		redirect(302, '/onboarding/client/location');
	}
};
