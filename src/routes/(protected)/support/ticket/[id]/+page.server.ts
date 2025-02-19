import { getSupportTicketDetails } from '$lib/server/database/queries/support';
import { redirect } from '@sveltejs/kit';

export async function load(event) {
	const user = event.locals.user;
	const { id } = event.params;
	if (!user) {
		redirect(302, '/sign-in');
	}

	const supportTicket = await getSupportTicketDetails(id);

	return { user, ticket: supportTicket || null };
}
