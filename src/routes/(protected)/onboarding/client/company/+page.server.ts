import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { setError, superValidate } from 'sveltekit-superforms/server';

import { clientCompanySchema } from '$lib/config/zod-schemas';
import { createClientCompany, createClientProfile } from '$lib/server/database/queries/clients.js';

const companySchema = clientCompanySchema.pick({
	companyName: true
});

export const load = async (event) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const form = await superValidate(event, companySchema);
	return {
		form
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, companySchema);
		// console.log(form);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const clientId = crypto.randomUUID();
			const companyId = crypto.randomUUID();

			await createClientProfile({
				id: clientId,
				userId: event.locals.user!.id,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			const newCompany = await createClientCompany({
				id: companyId,
				clientId,
				companyName: form.data.companyName,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			if (newCompany) {
				setFlash(
					{
						type: 'success',
						message: 'Company details created!'
					},
					event
				);
			}
		} catch (e) {
			console.error(e);
			setFlash({ type: 'error', message: 'Company was not able to be created.' }, event);
			return setError(form, 'Error creating company.');
		}
		redirect(302, '/onboarding/client/staff');
	}
};
