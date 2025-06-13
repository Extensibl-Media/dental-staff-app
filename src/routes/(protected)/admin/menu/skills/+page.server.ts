import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RequestEvent } from './$types';
import {
	createNewSkill,
	getAllSkillGategories,
	getAllSkills
} from '$lib/server/database/queries/skills';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newSkillSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import db from '$lib/server/database/drizzle';
import { skillTable } from '$lib/server/database/schemas/skill';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const skillSchema = newSkillSchema.pick({
	name: true,
	categoryId: true
});

export const load: PageServerLoad = async (event) => {
	const searchTerm = event.url.searchParams.get('search') || '';
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const form = await superValidate(event, skillSchema);
	const skills = await getAllSkills(searchTerm);
	const skillCategories = await getAllSkillGategories();

	return {
		form,
		skills: skills || [],
		categories: skillCategories || []
	};
};

export const actions = {
	addSkill: async (event: RequestEvent) => {
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
	},
	deleteSkill: async (event: RequestEvent) => {
		const user = event.locals.user;

		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		if (user.role !== 'SUPERADMIN') {
			fail(403, { message: 'You do not have permission to delete skills.' });
		}

		const form = await superValidate(event, z.object({ id: z.string().min(1) }));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const skillId = form.data.id;

		if (!skillId) {
			return fail(400, { message: 'Skill ID is required.' });
		}

		try {
			await db.delete(skillTable).where(eq(skillTable.id, skillId));

			setFlash(
				{
					type: 'success',
					message: 'Skill deleted successfully.'
				},
				event
			);
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Skill was not able to be deleted.' }, event);
			return setError(form, 'Error deleting skill.');
		}
		console.log('Skill deleted successfully');
		return message(form, 'Skill deleted successfully.');
	}
};
