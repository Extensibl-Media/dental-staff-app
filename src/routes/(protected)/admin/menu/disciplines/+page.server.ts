import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RequestEvent } from './$types';
import { getAllDisciplines, createNewDiscipline } from '$lib/server/database/queries/disciplines';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newDisciplineSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { USER_ROLES } from '$lib/config/constants';
import db from '$lib/server/database/drizzle';
import { disciplineTable } from '$lib/server/database/schemas/skill';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const disciplineSchema = newDisciplineSchema.pick({
	name: true,
	abbreviation: true
});

export const load: PageServerLoad = async (event) => {
	const searchTerm = event.url.searchParams.get('search') || '';
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const form = await superValidate(event, disciplineSchema);
	const disciplines = await getAllDisciplines(searchTerm);

	return {
		form,
		disciplines: disciplines || []
	};
};

export const actions = {
	addDiscipline: async (event: RequestEvent) => {
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
			return setError(form, 'Error creating discipline.');
		}

		console.log('Discipline added successfully');
		return message(form, 'Discipline added successfully.');
	},

	deleteDiscipline: async (event: RequestEvent) => {
		const user = event.locals.user;

		if (!user) {
			redirect(302, '/auth/sign-in');
		}

		if (user.role !== 'SUPERADMIN') {
			return fail(403, { message: 'You do not have permission to delete disciplines.' });
		}

		const form = await superValidate(event, z.object({ id: z.string().min(1) }));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const disciplineId = form.data.id;

		if (!disciplineId) {
			return fail(400, { message: 'Discipline ID is required.' });
		}

		try {
			await db.delete(disciplineTable).where(eq(disciplineTable.id, disciplineId));

			setFlash(
				{
					type: 'success',
					message: 'Discipline deleted successfully.'
				},
				event
			);
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Discipline was not able to be deleted.' }, event);
			return setError(form, 'Error deleting discipline.');
		}

		console.log('Discipline deleted successfully');
		return message(form, 'Discipline deleted successfully.');
	}
};
