import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getPaginatedDisciplines,
	createNewDiscipline
} from '$lib/server/database/queries/disciplines';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newDisciplineSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { USER_ROLES } from '$lib/config/constants';

const disciplineSchema = newDisciplineSchema.pick({
	name: true,
	abbreviation: true
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

	if (user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const form = await superValidate(event, disciplineSchema);

	const results = await getPaginatedDisciplines({ limit: 10, orderBy, offset: skip });

	return {
		form,
		disciplines: results?.disciplines || [],
		count: results?.count || 0
	};
};

export const actions = {
	newDiscipline: async (event) => {
		const form = await superValidate(event, disciplineSchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const disciplineId = crypto.randomUUID();

			const newDiscipline = await createNewDiscipline({
				id: disciplineId,
				createdAt: new Date(),
				updatedAt: new Date(),
				name: form.data.name,
				abbreviation: form.data.abbreviation
			});

			if (newDiscipline) {
				setFlash(
					{
						type: 'success',
						message: 'Discipline created!'
					},
					event
				);
			}
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Discipline was not able to be created.' }, event);
			return setError(form, 'Error creating Discipline.');
		}
		console.log('Discipline added successfully');
		return message(form, 'Skill added successfully.');
	}
};
