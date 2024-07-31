import { getConversationsForUser } from '$lib/server/database/queries/messages';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		redirect(301, '/sign-in');
	}

	const conversations = await getConversationsForUser(user.id);

	return { user, conversations: conversations };
};
