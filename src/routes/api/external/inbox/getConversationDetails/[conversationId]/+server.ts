import { InboxService } from '$lib/server/inbox';
import { authenticateUser } from '$lib/server/serverUtils';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const user = await authenticateUser(request);
		const { conversationId } = params;

		const inboxService = new InboxService();

		const conversations = await inboxService.getConversationDetails(conversationId, user.id);

		return json(conversations);
	} catch (err) {
		console.error('Error fetching conversation:', err);
		throw error(500, 'Internal server error');
	}
};
