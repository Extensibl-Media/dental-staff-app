import { redirect } from '@sveltejs/kit';
import { InboxService } from '$lib/server/inbox';

export const load = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		redirect(301, '/sign-in');
	}
	const inboxService = new InboxService();

	const conversations = await inboxService.getConversations(user.id);

	return { user, conversations: conversations };
};
