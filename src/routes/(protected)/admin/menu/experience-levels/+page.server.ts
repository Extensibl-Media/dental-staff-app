import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	createNewExperienceLevel,
	getPaginatedExperienceLevels
} from '$lib/server/database/queries/skills';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newExperienceLevelSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { USER_ROLES } from '$lib/config/constants';

const experienceLevelSchema = newExperienceLevelSchema.pick({
	value: true
});

export const load: PageServerLoad = async (event) => {
	const skip = Number(event.url.searchParams.get('skip'));
	const sortBy = event.url.searchParams.get('sortBy')?.toString();
	const sortOn = event.url.searchParams.get('sortOn')?.toString();

	const orderBy = sortBy && sortOn ? { column: sortOn, direction: sortBy } : undefined;
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user && user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const form = await superValidate(event, experienceLevelSchema);

	const results = await getPaginatedExperienceLevels({ limit: 10, orderBy, offset: skip });

	return {
		form,
		experienceLevels: results?.experienceLevels || [],
		count: results?.count || 0
	};
};

export const actions = {
	newExperienceLevel: async (event) => {
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
			return setError(form, 'Error creating experience evel.');
		}
		console.log('Experience Level added successfully');
		return message(form, 'Experience Level added successfully.');
	}
};
