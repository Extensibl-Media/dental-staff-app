import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { superValidate } from 'sveltekit-superforms/server';
import { clientCompanyLocationSchema } from '$lib/config/zod-schemas';
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getPaginatedLocationsByCompanyId
} from '$lib/server/database/queries/clients';

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
		const client = await getClientProfilebyUserId(user.id);
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
