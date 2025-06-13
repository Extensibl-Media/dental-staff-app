import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RequestEvent } from './$types';
import {
	createNewExperienceLevel,
	getAllExperienceLevels
} from '$lib/server/database/queries/skills';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newExperienceLevelSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { USER_ROLES } from '$lib/config/constants';
import db from '$lib/server/database/drizzle';
import { experienceLevelTable } from '$lib/server/database/schemas/skill';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const experienceLevelSchema = newExperienceLevelSchema.pick({
	value: true
});

export const load: PageServerLoad = async (event) => {
	const searchTerm = event.url.searchParams.get('search') || '';
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user && user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const form = await superValidate(event, experienceLevelSchema);
	const experienceLevels = await getAllExperienceLevels(searchTerm);

	return {
		form,
		experienceLevels: experienceLevels || []
	};
};

export const actions = {
	addExperienceLevel: async (event: RequestEvent) => {
		const form = await superValidate(event, experienceLevelSchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const experienceLevelId = crypto.randomUUID();
			const newExperienceLevel = await createNewExperienceLevel({
				id: experienceLevelId,
				value: form.data.value,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			if (newExperienceLevel) {
				setFlash(
					{
						type: 'success',
						message: 'Experience Level created!'
					},
					event
				);
			}
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Experience Level was not able to be created.' }, event);
			return setError(form, 'Error creating experience level.');
		}

		console.log('Experience Level added successfully');
		return message(form, 'Experience Level added successfully.');
	},

	deleteExperienceLevel: async (event: RequestEvent) => {
		const user = event.locals.user;

		if (!user) {
			redirect(302, '/auth/sign-in');
		}

		if (user.role !== 'SUPERADMIN') {
			return fail(403, { message: 'You do not have permission to delete experience levels.' });
		}

		const form = await superValidate(event, z.object({ id: z.string().min(1) }));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const experienceLevelId = form.data.id;

		if (!experienceLevelId) {
			return fail(400, { message: 'Experience Level ID is required.' });
		}

		try {
			await db.delete(experienceLevelTable).where(eq(experienceLevelTable.id, experienceLevelId));

			setFlash(
				{
					type: 'success',
					message: 'Experience Level deleted successfully.'
				},
				event
			);
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Experience Level was not able to be deleted.' }, event);
			return setError(form, 'Error deleting experience level.');
		}

		console.log('Experience Level deleted successfully');
		return message(form, 'Experience Level deleted successfully.');
	}
};
