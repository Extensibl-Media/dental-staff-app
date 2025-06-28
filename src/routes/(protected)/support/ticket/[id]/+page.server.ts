import {
	createSupportTicketComment,
	getSupportTicketDetails,
	updateSupportTicket
} from '$lib/server/database/queries/support';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { setFlash } from 'sveltekit-flash-message/server';
import { USER_ROLES } from '$lib/config/constants';

const newSupportTicketCommentSchema = z.object({
	body: z.string().min(1, 'Comment cannot be empty')
});

export async function load(event: RequestEvent) {
	const user = event.locals.user;
	const { id } = event.params;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const supportTicket = await getSupportTicketDetails(id);

	const commentForm = await superValidate(event, newSupportTicketCommentSchema);

	return { user, ticket: supportTicket || null, commentForm };
}

export const actions = {
	closeTicket: async (request: RequestEvent) => {
		const { params, locals } = request;
		const user = locals.user;
		if (!user) {
			return redirect(302, '/auth/sign-in');
		}
		try {
			await updateSupportTicket(
				params.id,
				{
					status: 'CLOSED',
					updatedAt: new Date(),
					closedById: user?.id || null
				},
				user.id
			);
			setFlash({ type: 'success', message: 'Ticket closed successfully' }, request);
			return { success: true };
		} catch (error) {
			console.error(error);
			setFlash({ type: 'error', message: 'Failed to close ticket.' }, request);
			return fail(500, { error: 'Failed to close ticket' });
		}
	},
	reopenTicket: async (request: RequestEvent) => {
		const { params, locals } = request;
		const user = locals.user;

		if (!user) {
			return redirect(302, '/auth/sign-in');
		}
		try {
			await updateSupportTicket(
				params.id,
				{
					status: 'PENDING',
					updatedAt: new Date(),
					closedById: null
				},
				user.id
			);
			setFlash({ type: 'success', message: 'Ticket reopened successfully' }, request);
			return { success: true };
		} catch (error) {
			console.error(error);
			setFlash({ type: 'error', message: 'Failed to reopen ticket.' }, request);
			return fail(500, { error: 'Failed to reopen ticket' });
		}
	},
	addComment: async (request: RequestEvent) => {
		const { params, locals } = request;

		const user = locals.user;

		if (!user) {
			return fail(403);
		}

		const form = await superValidate(request, newSupportTicketCommentSchema);

		if (!form.valid) {
			fail(400, { form });
		}

		try {
			const body = form.data.body;
			const id = crypto.randomUUID();

			const newComment = {
				id,
				createdAt: new Date(),
				updatedAt: new Date(),
				supportTicketId: params.id,
				fromId: user.id,
				body
			};

			const update =
				user?.role === USER_ROLES.SUPERADMIN
					? {
							status: 'PENDING' as const
						}
					: {};

			await createSupportTicketComment(newComment, user.id);
			await updateSupportTicket(params.id, { ...update, updatedAt: new Date() }, user.id);
			setFlash({ type: 'success', message: 'Comment added successfully' }, request);
		} catch (err) {
			console.error(err);
			setFlash({ type: 'error', message: 'Failed to post comment.' }, request);
			setError(form, 'Something went wrong');
			return fail(500, { form });
		}
		return message(form, 'Comment added successfully.');
	},
	editComment: async (request: RequestEvent) => {
		const { params, locals } = request;
	},
	deleteComment: async (request: RequestEvent) => {
		const { params, locals } = request;
	}
};
