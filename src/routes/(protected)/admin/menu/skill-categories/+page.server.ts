import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	createNewSkillCategory,
	getPaginatedSkillGategories
} from '$lib/server/database/queries/skills';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newSkillSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';

const skillSchema = newSkillSchema.pick({
	name: true,
	categoryId: true
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

	const form = await superValidate(event, skillSchema);

	const results = await getPaginatedSkillGategories({ limit: 10, orderBy, offset: skip });

	return {
		form,
		categories: results?.categories || [],
		count: results?.count || 0
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, skillSchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const categoryId = crypto.randomUUID();

			const newCategory = await createNewSkillCategory({
				id: categoryId,
				createdAt: new Date(),
				updatedAt: new Date(),
				name: form.data.name
			});

			if (newCategory) {
				setFlash(
					{
						type: 'success',
						message: 'Category created!'
					},
					event
				);
			}
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Category was not able to be created.' }, event);
			return setError(form, 'Error creating Category.');
		}
		console.log('Category added successfully');
		return message(form, 'Category added successfully.');
	}
};
