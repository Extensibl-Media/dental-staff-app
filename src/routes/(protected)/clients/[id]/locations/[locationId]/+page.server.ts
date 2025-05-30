import {
	getClientProfileById,
	getLocationByIdForCompany,
	updateCompanyLocation
} from '$lib/server/database/queries/clients';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { getAllRegions, getRegionById } from '$lib/server/database/queries/regions';
import { setFlash } from 'sveltekit-flash-message/server';
import {
	ContactSchema,
	LocationSchema,
	NewAddressSchema,
	OperatingHoursSchema
} from '$lib/config/zod-schemas';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}
	if (user.role !== 'SUPERADMIN') {
		redirect(302, '/dashboard');
	}
	const { id, locationId } = event.params;

	const client = await getClientProfileById(id);
	const location = await getLocationByIdForCompany(locationId, client.company.id);
	const region = await getRegionById(location.regionId);
	const regions = await getAllRegions();

	const addressForm = await superValidate(event, NewAddressSchema);
	const contactForm = await superValidate(event, ContactSchema);
	const operatingHoursForm = await superValidate(event, OperatingHoursSchema);
	const locationForm = await superValidate(event, LocationSchema);

	addressForm.data = {
		streetOne: location.streetOne || '',
		streetTwo: location.streetTwo || '',
		city: location.city || '',
		state: location.state || '',
		zipcode: location.zipcode || ''
	};

	contactForm.data = {
		companyPhone: location.companyPhone || '',
		email: location.email || ''
	};

	operatingHoursForm.data = {
		operatingHours: JSON.stringify(location.operatingHours)
	};

	locationForm.data = {
		timezone: location.timezone || 'America/New_York',
		regionId: location.regionId || ''
	};

	return {
		user,
		client,
		location,
		region,
		addressForm,
		contactForm,
		operatingHoursForm,
		locationForm,
		regions
	};
};

export const actions = {
	updateAddress: async (event) => {
		const user = event.locals.user;
		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		const form = await superValidate(event, NewAddressSchema);

		if (!form.valid) {
			return fail(400, { form });
		}
		const { locationId } = event.params;

		const { streetOne, streetTwo, city, state, zipcode } = form.data;

		const addressData = {
			streetOne,
			streetTwo: streetTwo || '',
			city,
			state,
			zipcode
		};

		try {
			await updateCompanyLocation(locationId, addressData);
			setFlash(
				{
					type: 'success',
					message: 'Address updated successfully'
				},
				event
			);
			return { form };
		} catch (error) {
			console.error('Error updating address:', error);
			setFlash(
				{
					type: 'error',
					message: 'Failed to update address. Please try again.'
				},
				event
			);
			return { form };
		}
	},
	updateContactInfo: async (event) => {
		const user = event.locals.user;
		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		const form = await superValidate(event, ContactSchema);
		if (!form.valid) {
			return fail(400, { form });
		}
		const { locationId } = event.params;
		const { companyPhone, email } = form.data;
		const contactData = {
			companyPhone: companyPhone || '',
			email: email || ''
		};
		try {
			await updateCompanyLocation(locationId, contactData);
			setFlash(
				{
					type: 'success',
					message: 'Contact information updated successfully'
				},
				event
			);
			return { form };
		} catch (error) {
			console.error('Error updating contact information:', error);
			setFlash(
				{
					type: 'error',
					message: 'Failed to update contact information. Please try again.'
				},
				event
			);
			return { form };
		}
	},
	updateOperatingHours: async (event) => {
		const user = event.locals.user;
		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		const form = await superValidate(event, OperatingHoursSchema);

		if (!form.valid) {
			return fail(400, { form });
		}

		let jsonHours: Record<
			string,
			{ openTime: string; closeTime: string; isClosed: boolean; timezone: string }
		>;

		try {
			jsonHours = JSON.parse(form.data.operatingHours);
		} catch (error) {
			console.error('Invalid JSON format for operating hours:', error);
			setError(form, 'operatingHours', 'Invalid JSON format for operating hours');
			setFlash(
				{
					type: 'error',
					message: 'Invalid JSON format for operating hours'
				},
				event
			);
			return { form };
		}
		const { locationId } = event.params;

		try {
			await updateCompanyLocation(locationId, { operatingHours: jsonHours });
			setFlash(
				{
					type: 'success',
					message: 'Operating hours updated successfully'
				},
				event
			);
			return { form };
		} catch (err) {
			console.error('Error updating operating hours:', err);
			setFlash(
				{
					type: 'error',
					message: 'Failed to update operating hours. Please try again.'
				},
				event
			);
			return { form };
		}
	},
	updateLocation: async (event) => {
		const user = event.locals.user;
		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		const form = await superValidate(event, LocationSchema);
		if (!form.valid) {
			return fail(400, { form });
		}
		const { locationId } = event.params;
		const { timezone, regionId } = form.data;

		try {
			await updateCompanyLocation(locationId, {
				timezone,
				regionId
			});
			setFlash(
				{
					type: 'success',
					message: 'Location updated successfully'
				},
				event
			);
			return { form };
		} catch (error) {
			console.error('Error updating location:', error);
			setFlash(
				{
					type: 'error',
					message: 'Failed to update location. Please try again.'
				},
				event
			);
			return { form };
		}
	}
};
