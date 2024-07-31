import { USER_ROLES } from '$lib/config/constants.js';
import { adminRequisitionSchema, clientRequisitionSchema } from '$lib/config/zod-schemas.js';
import {
	getClientCompanyByClientId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients.js';
import {
	createRequisition,
	getPaginatedRequisitionsAdmin,
	getPaginatedRequisitionsforClient
} from '$lib/server/database/queries/requisitions';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms/server';
// import type { Action } from '@sveltejs/kit';

export const load = async (event) => {
	const user = event.locals.user;

	if (!user) {
		redirect(301, '/auth/sign-in');
	}

	if (user?.role === USER_ROLES.SUPERADMIN) {
		const results = await getPaginatedRequisitionsAdmin({ limit: 10, offset: 0 });
		const form = superValidate(event, adminRequisitionSchema);
		return {
			user: event.locals.user,
			requisitions: results?.requisitions || [],
			count: results?.count || 0,
			adminForm: form,
			clientForm: null
		};
	}

	if (user?.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		const clientCompany = await getClientCompanyByClientId(client.id);
		const form = superValidate(event, clientRequisitionSchema);

		const results = await getPaginatedRequisitionsforClient(clientCompany.id, {
			limit: 10,
			offset: 0
		});

		return {
			user: event.locals.user,
			requisitions: results?.requisitions || [],
			count: results?.count || 0,
			clientForm: form,
			adminForm: null
		};
	}

	return {
		user: event.locals.user,
		requisitions: null,
		count: 0,
		adminForm: null,
		clientForm: null
	};
};

export const actions = {
	admin: async (event) => {
		const formData = await event.request.formData();

		const title = formData.get('title') as string;
		const companyId = formData.get('clientId') as string;
		const locationId = formData.get('locationId') as string;
		const disciplineId = formData.get('disciplineId') as string;
		const jobDescription = formData.get('jobDescription') as string;
		const specialInstructions = formData.get('specialInstructions')
			? (formData.get('specialInstructions') as string)
			: null;
		const experienceLevelId = formData.get('experienceLevelId')
			? (formData.get('experienceLevelId') as string)
			: null;
		console.log({
			title,
			companyId,
			locationId,
			disciplineId,
			jobDescription,
			specialInstructions,
			experienceLevelId
		});

		const newRequisition = await createRequisition({
			createdAt: new Date(),
			updatedAt: new Date(),
			title,
			companyId,
			locationId,
			disciplineId,
			jobDescription,
			specialInstructions,
			experienceLevelId
		});

		if (newRequisition) {
			setFlash({ type: 'success', message: 'Profile update successful.' }, event);
			return redirect(302, `/requisitions/${newRequisition.id}`);
		}
	}
};
