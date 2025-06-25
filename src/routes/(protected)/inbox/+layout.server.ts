import { redirect } from '@sveltejs/kit';
import { InboxService } from '$lib/server/inbox';
import { USER_ROLES } from '$lib/config/constants.js';
import db from '$lib/server/database/drizzle.js';
import { userTable, type User } from '$lib/server/database/schemas/auth.js';
import { getUserById, getUsersInCompany } from '$lib/server/database/queries/users';
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients.js';
import type { RequestEvent } from './$types.js';
import { asc } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

export const load = async (event: RequestEvent) => {
	const user = event.locals.user;

	if (!user) {
		redirect(301, '/sign-in');
	}
	const inboxService = new InboxService();

	const conversations = await inboxService.getConversations(user.id);

	const newConversationForm = await superValidate(
		event,
		z.object({
			userIDs: z.string().min(1)
		})
	);

	let availableUsers: Partial<User>[] = [];

	if (user.role === USER_ROLES.SUPERADMIN) {
		availableUsers = await db
			.select({
				id: userTable.id,
				email: userTable.email,
				firstName: userTable.firstName,
				lastName: userTable.lastName,
				avatarUrl: userTable.avatarUrl
			})
			.from(userTable)
			.orderBy(asc(userTable.firstName));
	} else if (user.role === USER_ROLES.CLIENT) {
		if (!user.completedOnboarding) {
			redirect(302, '/onboarding/client/company');
		}
		const client = await getClientProfilebyUserId(user.id);
		const company = await getClientCompanyByClientId(client.id);

		availableUsers = await getUsersInCompany(company.id);
	} else {
		const client = await getClientProfileByStaffUserId(user.id);
		if (!client) {
			throw new Error('Client profile not found for the user');
		}
		const clientUser = await getUserById(client?.userId);
		const company = await getClientCompanyByClientId(client?.id);
		if (!company) {
			throw new Error('Company not found for the user');
		}

		availableUsers = [
			...(await getUsersInCompany(company.id)),
			// merge client user to list
			{
				id: clientUser?.user.id,
				email: clientUser?.user.email,
				firstName: clientUser?.user.firstName,
				lastName: clientUser?.user.lastName,
				avatarUrl: clientUser?.user.avatarUrl
			}
		];
	}

	return { user, conversations: conversations, availableUsers, newConversationForm };
};
