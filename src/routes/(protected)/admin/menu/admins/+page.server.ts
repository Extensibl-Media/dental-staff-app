import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newSkillSchema, userSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { getPaginatedAdminUsers } from '$lib/server/database/queries/admin';

const adminUserSchema = userSchema.pick({
	firstName: true,
	lastName: true,
	email: true,
	role: true
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

	const form = await superValidate(event, adminUserSchema);

	const results = await getPaginatedAdminUsers({ limit: 10, orderBy, offset: skip });

	return {
		form,
		admins: results?.admins || [],
		count: results?.count || 0
	};
};

export const actions = {
	// default: async (event) => {
	// 	const form = await superValidate(event, adminUserSchema);
	// 	if (!form.valid) {
	// 		return fail(400, {
	// 			form
	// 		});
	// 	}
	// 	try {
	// 		const skillId = crypto.randomUUID();
	// 		const categoryId = form.data.categoryId;
	// 		const newSkill = await createNewSkill({
	// 			id: skillId,
	// 			categoryId,
	// 			createdAt: new Date(),
	// 			updatedAt: new Date(),
	// 			name: form.data.name
	// 		});
	// 		if (newSkill) {
	// 			setFlash(
	// 				{
	// 					type: 'success',
	// 					message: 'Skill created!'
	// 				},
	// 				event
	// 			);
	// 		}
	// 	} catch (e) {
	// 		console.error(e);
	// 		setFlash({ type: 'error', message: 'Skill was not able to be created.' }, event);
	// 		return setError(form, 'Error creating skill.');
	// 	}
	// 	console.log('skill added successfully');
	// 	return message(form, 'Skill added successfully.');
	// }
};
