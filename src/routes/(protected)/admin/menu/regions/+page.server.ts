import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { newRegionSchema } from '$lib/config/zod-schemas';
import { setFlash } from 'sveltekit-flash-message/server';
import { USER_ROLES } from '$lib/config/constants';
import { createNewRegion, getPaginatedRegions } from '$lib/server/database/queries/regions';

const regionSchema = newRegionSchema.pick({
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

	const form = await superValidate(event, regionSchema);

	const results = await getPaginatedRegions({ limit: 10, orderBy, offset: skip });

	return {
		form,
		regions: results?.regions || [],
		count: results?.count || 0
	};
};

export const actions = {
	newRegion: async (event) => {
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
			return setError(form, 'Error creating Region.');
		}
		console.log('Region added successfully');
		return message(form, 'Region added successfully.');
	}
};
