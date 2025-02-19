import { newMessageSchema } from '$lib/config/zod-schemas';
import { InboxService, sendMessageSchema, type SendMessageParams } from '$lib/server/inbox';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { chatId } = event.params;
	const user = event.locals.user;

	if (!user) {
		redirect(301, '/sign-in');
	}

	const form = await superValidate(event, newMessageSchema);
	const inboxService = new InboxService();
	return {
		form,
		user,
		conversation: await inboxService.getConversationDetails(chatId, user.id)
	};
};

export const actions = {
	sendNewMessage: async (event: RequestEvent) => {
		const { chatId } = event.params;
		if (!chatId) return;

		const form = await superValidate(event, sendMessageSchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		const inboxService = new InboxService();
		try {
			const newMessageData: SendMessageParams = {
				conversationId: chatId,
				body: form.data.body,
				senderId: event.locals.user!.id,
				isSystemMessage: form.data.isSystemMessage
			};
			await inboxService.sendMessage(newMessageData);

			const result = message({ ...form, data: { ...form.data, body: '' } }, 'Message Sent.');

			return result;
		} catch (error) {
			console.error(error);
			setFlash(
				{ type: 'error', message: 'Unable to send message. Please refresh and try again.' },
				event
			);
			return setError(form, 'Error sending message.');
		}
	}
};
