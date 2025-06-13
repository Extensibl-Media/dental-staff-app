import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createNewSkillCategory, getAllSkillGategories } from '$lib/server/database/queries/skills';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newCategorySchema, deleteCategorySchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import db from '$lib/server/database/drizzle';
import { skillCategoryTable } from '$lib/server/database/schemas/skill';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const searchTerm = event.url.searchParams.get('search') || '';
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const form = await superValidate(event, newCategorySchema);
	const categories = await getAllSkillGategories(searchTerm);

	return {
		form,
		categories: categories || []
	};
};

export const actions = {
	addCategory: async (event) => {
		const user = event.locals.user;

		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		if (user.role !== 'SUPERADMIN') {
			fail(403, { message: 'You do not have permission to delete categories.' });
		}

		const form = await superValidate(event, newCategorySchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const categoryId = crypto.randomUUID();

			await createNewSkillCategory({
				id: categoryId,
				createdAt: new Date(),
				updatedAt: new Date(),
				name: form.data.name
			});

			setFlash(
				{
					type: 'success',
					message: 'Category created successfully.'
				},
				event
			);
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Category was not able to be created.' }, event);
			return setError(form, 'Error creating Category.');
		}
		console.log('Category added successfully');
		return message(form, 'Category added successfully.');
	},
	deleteCategory: async (event) => {
		const user = event.locals.user;

		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		if (user.role !== 'SUPERADMIN') {
			fail(403, { message: 'You do not have permission to delete categories.' });
		}

		const form = await superValidate(event, deleteCategorySchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const categoryId = form.data.id;

			await db.delete(skillCategoryTable).where(eq(skillCategoryTable.id, categoryId));
			setFlash(
				{
					type: 'success',
					message: 'Category deleted successfully.'
				},
				event
			);
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Category was not able to be deleted.' }, event);
			return setError(form, 'Error deleting Category.');
		}
		console.log('Category deleted successfully');
		return message(form, 'Category deleted successfully.');
	}
};
