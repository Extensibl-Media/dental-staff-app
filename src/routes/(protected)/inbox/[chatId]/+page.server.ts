import { newMessageSchema } from '$lib/config/zod-schemas';
import {
	getConversationById,
	sendNewMessage,
	updateConversation
} from '$lib/server/database/queries/messages';
import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { message, setError, superValidate } from 'sveltekit-superforms/server';

export const load = async (event) => {
	const { chatId } = event.params;
	const user = event.locals.user;

	if (!user) {
		redirect(301, '/sign-in');
	}

	const form = await superValidate(event, newMessageSchema);

	return {
		form,
		user,
		chat: await getConversationById(user!.id, chatId)
	};
};

export const actions = {
	sendNewMessage: async (event) => {
		const { chatId } = event.params;
		const form = await superValidate(event, newMessageSchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const newMessageData = {
				conversationId: chatId,
				body: form.data.body,
				senderId: event.locals.user!.id
			};

			const newMessage = await sendNewMessage(newMessageData);

			if (newMessage) await updateConversation(chatId, { lastMessageId: newMessage.id });
			return message(form, 'Message Sent.');
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
