import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RequestEvent } from './$types';
import {
	approveApplication,
	getRequisitionApplicationDetails,
	getRequisitionDetailsById
} from '$lib/server/database/queries/requisitions';
import { InboxService } from '$lib/server/inbox/service';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { USER_ROLES } from '$lib/config/constants';
import {
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients';
import { redirectIfNotValidCustomer } from '$lib/server/database/queries/billing';

export const load: PageServerLoad = async (event) => {
	const { id, applicationId } = event.params;
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const messageForm = await superValidate(event, z.object({ id: z.string() }));
	const approvalForm = await superValidate(event, z.object({ applicationId: z.string() }));
	const applicationDetails = await getRequisitionApplicationDetails(+id, applicationId);

	if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);

		await redirectIfNotValidCustomer(client.id, user.role);

		return {
			user,
			application: applicationDetails || null,
			messageForm,
			approvalForm
		};
	}

	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);

		await redirectIfNotValidCustomer(client?.id, user.role);

		return {
			user,
			application: applicationDetails || null,
			messageForm,
			approvalForm
		};
	}
};

export const actions = {
	startConversation: async (event: RequestEvent) => {
		const user = event.locals.user;
		const { id, applicationId } = event.params;

		const applicationDetails = await getRequisitionApplicationDetails(+id, applicationId);

		const form = await superValidate(event, z.object({ id: z.string() }));

		if (!form.valid) {
			fail(400, { form });
		}

		if (!applicationDetails) {
			throw error(404, 'Application not found');
		}
		console.log('Starting conversation for application: ', applicationId);

		const inboxService = new InboxService();

		const existingConversation = await inboxService.findExistingConversation({
			applicationId: applicationId,
			participantIds: [user!.id, applicationDetails.user.id]
		});

		if (existingConversation.exists) {
			return redirect(302, `/inbox/${existingConversation.conversationId}`);
		}

		const conversationId = await inboxService.createConversation({
			type: 'APPLICATION',
			participants: [
				{
					userId: applicationDetails.user.id,
					participantType: 'CANDIDATE'
				},
				{
					userId: user!.id,
					participantType: 'CLIENT_STAFF'
				}
			],
			applicationId
		});
		if (conversationId) {
			setFlash({ type: 'success', message: 'Starting new conversation.' }, event);
			return redirect(302, `/inbox/${conversationId}`);
		}
	},
	approveApplication: async (event: RequestEvent) => {
		const user = event.locals.user;
		const { id, applicationId } = event.params;

		if (!user || (user && user.role === 'CANDIDATE')) {
			return fail(403);
		}

		try {
			await approveApplication(applicationId, user.id);
			setFlash({ type: 'success', message: 'Application approved successfully.' }, event);
		} catch (error) {
			console.error('Error approving application:', error);
			setFlash({ type: 'error', message: 'Error approving application. Please try again.' }, event);
			return fail(500);
		}
		return redirect(302, `/requisitions/${id}/application/${applicationId}`);
	}
};
