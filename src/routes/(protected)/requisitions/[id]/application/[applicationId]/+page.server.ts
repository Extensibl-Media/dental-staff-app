import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RequestEvent } from './$types';
import {
	getRequisitionApplicationDetails,
	getRequisitionDetailsById
} from '$lib/server/database/queries/requisitions';
import { InboxService } from '$lib/server/inbox/service';
import { setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

export const load: PageServerLoad = async (event) => {
	const { id, applicationId } = event.params;
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/sign-in');
	}

	try {
		const applicationDetails = await getRequisitionApplicationDetails(+id, applicationId);

		const form = await superValidate(event, z.object({ id: z.string() }));

		return {
			user,
			application: applicationDetails || null,
			form
		};
	} catch (err) {
		console.log(err);
		throw error(500, `Error getting application details: ${err}`);
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
	}
};
