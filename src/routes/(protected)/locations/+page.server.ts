import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { superValidate } from 'sveltekit-superforms/server';
import { clientCompanyLocationSchema } from '$lib/config/zod-schemas';
import {
	createCompanyLocation,
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getPaginatedLocationsByCompanyId
} from '$lib/server/database/queries/clients';
import { getRegionByAbbreviation } from '$lib/server/database/queries/regions';
import { setFlash } from 'sveltekit-flash-message/server';
import { redirectIfNotValidCustomer } from '$lib/server/database/queries/billing';

export const load: PageServerLoad = async (event) => {
	const skip = Number(event.url.searchParams.get('skip'));
	const sortBy = event.url.searchParams.get('sortBy')?.toString();
	const sortOn = event.url.searchParams.get('sortOn')?.toString();

	const orderBy = sortBy && sortOn ? { column: sortOn, direction: sortBy } : undefined;

	const user = event.locals.user;

	if (!user) {
		return redirect(301, '/sign-in');
	}

	if (user.role === USER_ROLES.CLIENT) {
		if (!user.completedOnboarding) {
			redirect(302, '/onboarding/client/company');
		}
		const client = await getClientProfilebyUserId(user.id);
		await redirectIfNotValidCustomer(client.id, user.role);
		const clientCompany = await getClientCompanyByClientId(client.id);

		const locationForm = await superValidate(event, clientCompanyLocationSchema);

		const result = await getPaginatedLocationsByCompanyId(clientCompany.id, {
			limit: 10,
			offset: skip,
			orderBy
		});

		return {
			user,
			client,
			company: clientCompany,
			locationForm,
			locations: result?.locations || [],
			count: result?.count || 0
		};
	}

	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		await redirectIfNotValidCustomer(client?.id, user.role);

		const clientCompany = await getClientCompanyByClientId(client?.id);

		const locationForm = await superValidate(event, clientCompanyLocationSchema);

		const result = await getPaginatedLocationsByCompanyId(clientCompany.id, {
			limit: 10,
			offset: skip,
			orderBy
		});

		return {
			user,
			client,
			company: clientCompany,
			locationForm,
			locations: result?.locations || [],
			count: result?.count || 0
		};
	}
};

export const actions = {
	createLocation: async (event) => {
		const form = await superValidate(event, clientCompanyLocationSchema);

		if (!form.valid) {
			return { form };
		}

		const user = event.locals.user;

		if (!user) {
			return redirect(301, '/sign-in');
		}

		if (user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.CLIENT_STAFF) {
			const client = await getClientProfilebyUserId(user.id);
			const clientCompany = await getClientCompanyByClientId(client.id);

			if (!clientCompany) {
				return { form };
			}
			const regionId = (await getRegionByAbbreviation(form.data.state!)).id;

			const result = await createCompanyLocation({
				id: crypto.randomUUID(),
				createdAt: new Date(),
				updatedAt: new Date(),
				name: form.data.name,
				streetOne: form.data.streetOne,
				streetTwo: form.data.streetTwo,
				companyPhone: form.data.companyPhone,
				email: form.data.email || null,
				city: form.data.city,
				state: form.data.state,
				zipcode: form.data.zipcode,
				companyId: form.data.companyId,
				regionId,
				timezone: form.data.timezone,
				operatingHours: {
					0: {
						openTime: '00:00',
						closeTime: '00:00',
						isClosed: false,
						timezone: form.data.timezone || 'America/New_York'
					},
					1: {
						openTime: '00:00',
						closeTime: '00:00',
						isClosed: false,
						timezone: form.data.timezone || 'America/New_York'
					},
					2: {
						openTime: '00:00',
						closeTime: '00:00',
						isClosed: false,
						timezone: form.data.timezone || 'America/New_York'
					},
					3: {
						openTime: '00:00',
						closeTime: '00:00',
						isClosed: false,
						timezone: form.data.timezone || 'America/New_York'
					},
					4: {
						openTime: '00:00',
						closeTime: '00:00',
						isClosed: false,
						timezone: form.data.timezone || 'America/New_York'
					},
					5: {
						openTime: '00:00',
						closeTime: '00:00',
						isClosed: false,
						timezone: form.data.timezone || 'America/New_York'
					},
					6: {
						openTime: '00:00',
						closeTime: '00:00',
						isClosed: false,
						timezone: form.data.timezone || 'America/New_York'
					}
				}
			});

			if (result) {
				setFlash(
					{
						type: 'success',
						message: 'Location created successfully'
					},
					event
				);
				return { form, success: true, message: 'Location created successfully' };
			} else {
				setFlash(
					{
						type: 'error',
						message: 'Failed to create location'
					},
					event
				);
				return { form, error: 'Failed to create location' };
			}
		}
	}
};
