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
import {
	CandidateStatusSchema,
	updateCandidateProfileSchema,
	updateCandidateDisciplinesSchema
} from '$lib/config/zod-schemas';
import { getUserById, updateUser } from '$lib/server/database/queries/users';
import db from '$lib/server/database/drizzle';
import { candidateDisciplineExperienceTable } from '$lib/server/database/schemas/candidate';
import { disciplineTable, experienceLevelTable } from '$lib/server/database/schemas/skill';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const { id } = event.params;
	const statusForm = await superValidate(event, CandidateStatusSchema);
	const personalDetailsForm = await superValidate(event, updateCandidateProfileSchema);
	const candidateResult = await getCandidateProfileById(id);
	const disciplinesForm = await superValidate(
		{
			disciplines:
				candidateResult.disciplines?.map((d) => ({
					disciplineId: d.discipline.id,
					experienceLevelId: d.experience.experienceLevelId,
					preferredHourlyMin: d.salaryRange.min,
					preferredHourlyMax: d.salaryRange.max
				})) || []
		},
		updateCandidateDisciplinesSchema
	);

	const supportTickets = await getSupportTicketsForUser(candidateResult.candidate.user.id);
	const workHistory = await getAllCandidateWorkHistory(id);
	const documents = await getCandidateDocuments(id);

	// Fetch all available disciplines for the dropdown
	const allDisciplinesData = await db.select().from(disciplineTable);

	// Fetch all experience levels
	const experienceLevels = await db.select().from(experienceLevelTable);

	return candidateResult
		? {
				user,
				candidate: {
					profile: candidateResult.candidate.profile,
					user: candidateResult.candidate.user
				},
				allDisciplines: candidateResult.disciplines || [],
				availableDisciplines: allDisciplinesData,
				experienceLevels,
				supportTickets,
				workHistory,
				documents,
				statusForm,
				personalDetailsForm,
				disciplinesForm
			}
		: {
				user,
				candidate: null,
				allDisciplines: [],
				availableDisciplines: [],
				experienceLevels: [],
				supportTickets: [],
				workHistory: [],
				documents: [],
				statusForm,
				personalDetailsForm,
				disciplinesForm
			};
};

export const actions = {
	updatePersonalDetails: async ({ request, locals, params }) => {
		console.log('Update personal details action called');
		const { id } = params;

		const user = locals.user;
		if (!user) {
			return fail(403);
		}

		if (user.role !== USER_ROLES.SUPERADMIN) {
			return fail(403, { message: "You do not have permission to update a user's details" });
		}

		const form = await superValidate(request, updateCandidateProfileSchema);

		if (!form.valid) {
			console.log('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		const { email, lastName, firstName, birthday, cellPhone } = form.data;

		try {
			const candidateResult = await getCandidateProfileById(id);
			const userData = {
				updatedAt: new Date(),
				email,
				firstName,
				lastName
			};

			const profileData = {
				updatedAt: new Date(),
				birthday: birthday ?? null,
				cellPhone: cellPhone || null
			};
			await updateUser(candidateResult.candidate.user.id, userData);
			await updateCandidateProfile(id, profileData);

			return message(form, 'Personal details updated successfully');
		} catch (e) {
			console.error(e);
			return setError(form, 'Failed to update personal details');
		}
	},

	updateDisciplines: async (event) => {
		const { id } = event.params;
		const user = event.locals.user;

		if (!user) {
			return fail(403);
		}

		if (user.role !== USER_ROLES.SUPERADMIN) {
			return fail(403, { message: 'You do not have permission to update disciplines' });
		}

		const form = await superValidate(event, updateCandidateDisciplinesSchema);

		if (!form.valid) {
			console.log('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		try {
			const { disciplines } = form.data;

			// Delete existing disciplines for this candidate
			await db
				.delete(candidateDisciplineExperienceTable)
				.where(eq(candidateDisciplineExperienceTable.candidateId, id));

			// Insert new/updated disciplines
			if (disciplines.length > 0) {
				for (const discipline of disciplines) {
					await db.insert(candidateDisciplineExperienceTable).values({
						candidateId: id,
						disciplineId: discipline.disciplineId,
						experienceLevelId: discipline.experienceLevelId,
						preferredHourlyMin: discipline.preferredHourlyMin,
						preferredHourlyMax: discipline.preferredHourlyMax,
						createdAt: new Date(),
						updatedAt: new Date()
					});
				}
			}

			setFlash(
				{
					type: 'success',
					message: 'Disciplines updated successfully'
				},
				event
			);

			return message(form, 'Disciplines updated successfully');
		} catch (error) {
			console.error('Error updating disciplines:', error);
			setFlash(
				{
					type: 'error',
					message: 'Failed to update disciplines'
				},
				event
			);
			return setError(form, 'Failed to update disciplines');
		}
	},

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
			const profile = await getCandidateProfileById(id);
			const user = profile.candidate.user;
			const newValues = {
				updatedAt: new Date(),
				status: status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
				approved: status === 'ACTIVE' ? true : false
			};

			await updateUser(user.id, { completedOnboarding: status === 'ACTIVE' ? true : false });

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
