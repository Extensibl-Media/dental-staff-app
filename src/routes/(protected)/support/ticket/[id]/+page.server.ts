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

const newSupportTicketCommentSchema = z.object({
	body: z.string().min(1, 'Comment cannot be empty')
});

export async function load(event: RequestEvent) {
	const user = event.locals.user;
	const { id } = event.params;
	if (!user) {
		redirect(302, '/sign-in');
	}

	const supportTicket = await getSupportTicketDetails(id);

	const commentForm = await superValidate(event, newSupportTicketCommentSchema);

	return { user, ticket: supportTicket || null, commentForm };
}

export const actions = {
	closeTicket: async (request: RequestEvent) => {
		const { params, locals } = request;
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

			await createSupportTicketComment(newComment);
			await updateSupportTicket(params.id, { updatedAt: new Date() });
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
