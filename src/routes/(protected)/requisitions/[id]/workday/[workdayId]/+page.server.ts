import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients';
import {
	getRecurrenceDayDetails,
	getRequisitionDetailsById,
	getWorkdayDetails
} from '$lib/server/database/queries/requisitions';

export async function load({ locals, params }: RequestEvent) {
	const user = locals.user;
	if (!user) {
		return redirect(302, '/auth/sign-in');
	}

	const recurrenceDayId = params.workdayId;
	const requisitionId = Number(params.id);

	if (user.role === 'SUPERADMIN') {
		redirect(302, `/dashboard`);
	}

	if (user.role === 'CLIENT') {
		const client = await getClientProfilebyUserId(user.id);
		const company = await getClientCompanyByClientId(client.id);
		const recurrenceDay = await getRecurrenceDayDetails(recurrenceDayId, company.id);
		const workday = await getWorkdayDetails(recurrenceDayId, company.id);
		const requisition = await getRequisitionDetailsById(requisitionId);

		return {
			user,
			recurrenceDay,
			workday,
			client,
			company,
			requisition
		};
	}

	if (user.role === 'CLIENT_STAFF') {
		const client = await getClientProfileByStaffUserId(user.id);
		const company = await getClientCompanyByClientId(client?.id);
		const recurrenceDay = await getRecurrenceDayDetails(recurrenceDayId, company.id);
		const workday = await getWorkdayDetails(recurrenceDayId, company.id);
		const requisition = await getRequisitionDetailsById(requisitionId);

		return {
			user,
			recurrenceDay,
			workday,
			client,
			company,
			requisition
		};
	}
}

export const actions = {
	blacklistCandidate: async (request: RequestEvent) => {}
};
