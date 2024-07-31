import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	createNewSkill,
	getAllSkillGategories,
	getPaginatedSkills
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

	const results = await getPaginatedSkills({ limit: 10, orderBy, offset: skip });
	const skillCategories = await getAllSkillGategories();

	return {
		form,
		skills: results?.skills || [],
		categories: skillCategories || [],
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
			const skillId = crypto.randomUUID();
			const categoryId = form.data.categoryId;

			const newSkill = await createNewSkill({
				id: skillId,
				categoryId,
				createdAt: new Date(),
				updatedAt: new Date(),
				name: form.data.name
			});

			if (newSkill) {
				setFlash(
					{
						type: 'success',
						message: 'Skill created!'
					},
					event
				);
			}
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Skill was not able to be created.' }, event);
			return setError(form, 'Error creating skill.');
		}
		console.log('skill added successfully');
		return message(form, 'Skill added successfully.');
	}
};
