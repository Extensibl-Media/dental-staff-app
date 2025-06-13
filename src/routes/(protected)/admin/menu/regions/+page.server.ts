import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, RequestEvent } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newRegionSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { USER_ROLES } from '$lib/config/constants';
import { createNewRegion, getAllRegions } from '$lib/server/database/queries/regions';
import db from '$lib/server/database/drizzle';
import { regionTable } from '$lib/server/database/schemas/region';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const regionSchema = newRegionSchema.pick({
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

	const form = await superValidate(event, regionSchema);
	const regions = await getAllRegions(searchTerm);

	return {
		form,
		regions: regions || []
	};
};

export const actions = {
	addRegion: async (event: RequestEvent) => {
		const form = await superValidate(event, regionSchema);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const regionId = crypto.randomUUID();

			const newRegion = await createNewRegion({
				id: regionId,
				createdAt: new Date(),
				updatedAt: new Date(),
				name: form.data.name,
				abbreviation: form.data.abbreviation
			});

			if (newRegion) {
				setFlash(
					{
						type: 'success',
						message: 'Region created!'
					},
					event
				);
			}
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Region was not able to be created.' }, event);
			return setError(form, 'Error creating region.');
		}

		console.log('Region added successfully');
		return message(form, 'Region added successfully.');
	},

	deleteRegion: async (event: RequestEvent) => {
		const user = event.locals.user;

		if (!user) {
			redirect(302, '/auth/sign-in');
		}

		if (user.role !== 'SUPERADMIN') {
			return fail(403, { message: 'You do not have permission to delete regions.' });
		}

		const form = await superValidate(event, z.object({ id: z.string().min(1) }));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const regionId = form.data.id;

		if (!regionId) {
			return fail(400, { message: 'Region ID is required.' });
		}

		try {
			await db.delete(regionTable).where(eq(regionTable.id, regionId));

			setFlash(
				{
					type: 'success',
					message: 'Region deleted successfully.'
				},
				event
			);
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Region was not able to be deleted.' }, event);
			return setError(form, 'Error deleting region.');
		}

		console.log('Region deleted successfully');
		return message(form, 'Region deleted successfully.');
	}
};
