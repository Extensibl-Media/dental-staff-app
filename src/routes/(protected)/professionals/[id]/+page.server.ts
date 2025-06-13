import type { PageServerLoad } from './$types';
import {
	getAllCandidateWorkHistory,
	getCandidateDocuments,
	getCandidateProfileById,
	getCandidateUserById,
	updateCandidateProfile
} from '$lib/server/database/queries/candidates';
import { fail, redirect } from '@sveltejs/kit';
import { USER_ROLES } from '$lib/config/constants';
import { getSupportTicketsForUser } from '$lib/server/database/queries/support';
import { z } from 'zod';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import type { RequestEvent } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { CandidateStatusSchema } from '$lib/config/zod-schemas';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	// if (user.role !== USER_ROLES.SUPERADMIN) {
	// 	redirect(302, '/dashboard');
	// }

	const { id } = event.params;
	const statusForm = await superValidate(event, CandidateStatusSchema);

	const candidateResult = await getCandidateProfileById(id);
	const supportTickets = await getSupportTicketsForUser(candidateResult.candidate.user.id);
	const workHistory = await getAllCandidateWorkHistory(id);
	const documents = await getCandidateDocuments(id);

	return candidateResult
		? {
				user,
				candidate: {
					profile: candidateResult.candidate.profile,
					user: candidateResult.candidate.user,
					region: candidateResult.candidate.region,
					subregion: candidateResult.candidate.subRegion
				},
				allDisciplines: candidateResult.disciplines || [],
				supportTickets,
				workHistory,
				documents,
				statusForm
			}
		: {
				user,
				candidate: null,
				allDisciplines: [],
				supportTickets: [],
				workHistory: [],
				documents: [],
				statusForm
			};
};

export const actions = {
	updatePersonalInformation: async ({ request, locals }) => {},
	updateRateOfPay: async ({ request, locals }) => {},
	updateLocationDetails: async ({ request, locals }) => {},
	updateStatus: async (event: RequestEvent) => {
		const user = event.locals.user;
		if (!user) {
			return fail(403);
		}

		if (user.role !== USER_ROLES.SUPERADMIN) {
			return fail(403, { message: 'You do not have permission to update status' });
		}
		const form = await superValidate(event, CandidateStatusSchema);
		const { id } = event.params;
		const { status } = form.data;

		try {
			const newValues = {
				updatedAt: new Date(),
				status: status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
				approved: status === 'ACTIVE' ? true : false
			};

			await updateCandidateProfile(id, newValues);
			setFlash(
				{
					type: 'success',
					message: 'Candidate status updated successfully'
				},
				event
			);
			return message(form, 'Status Updated');
		} catch (error) {
			console.error('Error updating candidate status:', error);
			setFlash(
				{
					type: 'error',
					message: 'Failed to update candidate status'
				},
				event
			);
			return setError(form, 'Something went wrong');
		}
	}
};
