import type { PageServerLoad } from './$types';
import {
	changeRequisitionStatus,
	createNewRecurrenceDay,
	deleteRecurrenceDay,
	editRecurrenceDay,
	getRequisitionDetailsById
} from '$lib/server/database/queries/requisitions';
import { fail, redirect } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import {
	editRecurrenceDaySchema,
	newRecurrenceDaySchema,
	deleteRecurrenceDaySchema,
	changeStatusSchema
} from '$lib/config/zod-schemas';
import { USER_ROLES } from '$lib/config/constants';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const { id } = event.params;

	const idAsNum = Number(id);
	const result = await getRequisitionDetailsById(idAsNum);
	const recurrenceDayForm = await superValidate(event, newRecurrenceDaySchema);
	const changeStatusForm = await superValidate(event, changeStatusSchema);
	const editRecurrenceDayForm = await superValidate(event, editRecurrenceDaySchema);
	const deleteRecurrenceDayForm = await superValidate(event, deleteRecurrenceDaySchema);

	return {
		user,
		changeStatusForm,
		recurrenceDayForm,
		editRecurrenceDayForm,
		deleteRecurrenceDayForm,
		requisition: result?.requisition ?? null,
		recurrenceDays: result?.recurrenceDays || []
	};
};

export const actions = {
	changeStatus: async (request) => {
		const form = await superValidate(request, changeStatusSchema);

		if (!form.valid) {
			fail(400, { form });
		}

		try {
			const requisitionId = form.data.requisitionId;
			const status = form.data.status;

			const values = {
				updatedAt: new Date(),
				status
			};

			await changeRequisitionStatus(values, Number(requisitionId));

			return message(form, 'Status Updated');
		} catch (error) {
			console.log(error);
			return setError(form, 'Something went wrong');
		}
	},
	addRecurrenceDay: async (request) => {
		const form = await superValidate(request, newRecurrenceDaySchema);

		if (!form.valid) {
			fail(400, { form });
		}

		try {
			const requisitionId = form.data.requisitionId;
			const date = form.data.date;
			const dayStartTime = form.data.dayStartTime;
			const dayEndTime = form.data.dayEndTime;
			const lunchStartTime = form.data.lunchStartTime;
			const lunchEndTime = form.data.lunchEndTime;

			if (
				!requisitionId.length ||
				date.length ||
				dayStartTime.length ||
				dayEndTime.length ||
				lunchStartTime.length ||
				lunchEndTime.length
			) {
				fail(400, { form });
			}

			const values = {
				id: crypto.randomUUID(),
				createdAt: new Date(),
				updatedAt: new Date(),
				requisitionId: Number(requisitionId),
				date: date,
				dayStartTime: dayStartTime + ':00' + form.data.timezoneOffset,
				dayEndTime: dayEndTime + ':00' + form.data.timezoneOffset,
				lunchStartTime: lunchStartTime + ':00' + form.data.timezoneOffset,
				lunchEndTime: lunchEndTime + ':00' + form.data.timezoneOffset
			};

			await createNewRecurrenceDay(values);

			return message(
				{
					...form,
					data: {
						requisitionId: requisitionId,
						date: '',
						dayStartTime: '',
						dayEndTime: '',
						lunchStartTime: '',
						lunchEndTime: '',
						timezoneOffset: form.data.timezoneOffset
					}
				},
				'Created new Recurrence Day'
			);
		} catch (error) {
			console.log(error);
			return setError(form, 'Something went wrong');
		}
	},
	editRecurrenceDay: async (request) => {
		const form = await superValidate(request, editRecurrenceDaySchema);

		if (!form.valid) {
			fail(400, { form });
		}

		try {
			const id = form.data.id;
			const requisitionId = form.data.requisitionId;
			const date = form.data.date;
			const dayStartTime = form.data.dayStartTime;
			const dayEndTime = form.data.dayEndTime;
			const lunchStartTime = form.data.lunchStartTime;
			const lunchEndTime = form.data.lunchEndTime;

			if (
				!requisitionId.length ||
				date.length ||
				dayStartTime.length ||
				dayEndTime.length ||
				lunchStartTime.length ||
				lunchEndTime.length
			) {
				fail(400, { form });
			}

			const values = {
				updatedAt: new Date(),
				requisitionId: Number(requisitionId),
				date: date,
				dayStartTime: dayStartTime + ':00' + form.data.timezoneOffset,
				dayEndTime: dayEndTime + ':00' + form.data.timezoneOffset,
				lunchStartTime: lunchStartTime + ':00' + form.data.timezoneOffset,
				lunchEndTime: lunchEndTime + ':00' + form.data.timezoneOffset
			};

			await editRecurrenceDay(id, values);

			return message(
				{
					...form,
					data: {
						id,
						requisitionId: requisitionId,
						date: '',
						dayStartTime: '',
						dayEndTime: '',
						lunchStartTime: '',
						lunchEndTime: '',
						timezoneOffset: form.data.timezoneOffset
					}
				},
				'Edited Recurrence Day'
			);
		} catch (error) {
			console.log(error);
			return setError(form, 'Something went wrong');
		}
	},
	deleteRecurrenceDay: async (request) => {
		const form = await superValidate(request, deleteRecurrenceDaySchema);

		if (!form.valid) {
			fail(400, { form });
		}

		try {
			const id = form.data.id;

			if (!id.length) {
				fail(400, { form });
			}

			await deleteRecurrenceDay(id);

			return message(form, 'Deleted Recurrence Day');
		} catch (error) {
			console.log(error);
			return setError(form, 'Something went wrong');
		}
	}
};
