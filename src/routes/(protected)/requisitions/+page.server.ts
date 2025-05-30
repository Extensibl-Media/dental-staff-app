import { USER_ROLES } from '$lib/config/constants.js';
import { adminRequisitionSchema, clientRequisitionSchema } from '$lib/config/zod-schemas.js';
import { redirectIfNotValidCustomer } from '$lib/server/database/queries/billing';
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients.js';
import {
	createRequisition,
	getPaginatedRequisitionsAdmin,
	getPaginatedRequisitionsforClient
} from '$lib/server/database/queries/requisitions';
import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms/server';

export const load = async (event) => {
	const skip = Number(event.url.searchParams.get('skip'));
	const sortBy = event.url.searchParams.get('sortBy')?.toString();
	const sortOn = event.url.searchParams.get('sortOn')?.toString();
	const orderBy = sortBy && sortOn ? { column: sortOn, direction: sortBy } : undefined;

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

		await redirectIfNotValidCustomer(client.id, user.role);

		const clientCompany = await getClientCompanyByClientId(client.id);
		const form = await superValidate(event, clientRequisitionSchema);

		const results = await getPaginatedRequisitionsforClient(clientCompany.id, {
			limit: 10,
			offset: skip,
			orderBy
		});

		return {
			user,
			requisitions: results?.requisitions || [],
			count: results?.count || 0,
			clientForm: form,
			adminForm: null
		};
	}

	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);

		await redirectIfNotValidCustomer(client?.id, user.role);

		const company = await getClientCompanyByClientId(client?.id);

		const form = superValidate(event, clientRequisitionSchema);

		const results = await getPaginatedRequisitionsforClient(company.id, {
			limit: 10,
			offset: skip,
			orderBy
		});

		console.log({ client, company, results });
		return {
			user,
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
	admin: async (event: RequestEvent) => {
		const user = event.locals.user;
		if (!user) {
			return fail(403);
		}
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
		const timezone = formData.get('timezone') as string;
		const permanentPosition = formData.get('permanentPosition');
		const hourlyRate = Number(formData.get('hourlyRate'));
		const newRequisition = await createRequisition(
			{
				createdAt: new Date(),
				updatedAt: new Date(),
				title,
				companyId,
				locationId,
				hourlyRate,
				permanentPosition: permanentPosition as unknown as boolean,
				disciplineId,
				jobDescription,
				specialInstructions,
				experienceLevelId,
				status: 'OPEN',
				referenceTimezone: timezone
			},
			user.id
		);

		if (newRequisition) {
			setFlash({ type: 'success', message: 'New Requisition Created.' }, event);
			return redirect(302, `/requisitions/${newRequisition.id}`);
		}
	},
	client: async (event: RequestEvent) => {
		const user = event.locals.user;

		if (!user) {
			return fail(403);
		}
		const client =
			user && user?.role === USER_ROLES.CLIENT_STAFF
				? await getClientProfileByStaffUserId(user.id)
				: await getClientProfilebyUserId(user.id);

		const company = client ? await getClientCompanyByClientId(client.id) : null;
		const companyId = company?.id;

		if (!companyId) error(500, 'Invalid or missing CompanyId');

		const formData = await event.request.formData();

		console.log({ formData });

		const title = formData.get('title') as string;
		const locationId = formData.get('locationId') as string;
		const disciplineId = formData.get('disciplineId') as string;
		const jobDescription = formData.get('jobDescription') as string;
		const specialInstructions = formData.get('specialInstructions')
			? (formData.get('specialInstructions') as string)
			: null;
		const experienceLevelId = formData.get('experienceLevelId')
			? (formData.get('experienceLevelId') as string)
			: null;
		const permanentPosition = formData.get('permanentPosition');
		const hourlyRate = Number(formData.get('hourlyRate'));
		const timezone = formData.get('timezone') as string;

		const newRequisition = await createRequisition(
			{
				createdAt: new Date(),
				updatedAt: new Date(),
				title,
				companyId,
				locationId,
				hourlyRate,
				permanentPosition: permanentPosition as unknown as boolean,
				disciplineId,
				jobDescription,
				specialInstructions,
				experienceLevelId,
				status: 'OPEN',
				referenceTimezone: timezone
			},
			user.id
		);

		if (newRequisition) {
			setFlash({ type: 'success', message: 'New Requisition Created.' }, event);
			return redirect(302, `/requisitions/${newRequisition.id}`);
		}
	}
};
