import type { PageServerLoad, RequestEvent } from './$types';
import {
	changeRequisitionStatus,
	createNewRecurrenceDay,
	deleteRecurrenceDay,
	editRecurrenceDay,
	getRecurrenceDaysForRequisition,
	getRequisitionApplications,
	getRequisitionDetailsById,
	getRequisitionTimesheets
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
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getClientStaffProfilebyUserId
} from '$lib/server/database/queries/clients';
import type { ClientCompanyStaffProfile } from '$lib/server/database/schemas/client';

export const load: PageServerLoad = async (event: RequestEvent) => {
	const user = event.locals.user;

	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const { id } = event.params;
	const idAsNum = Number(id);
	const recurrenceDayForm = await superValidate(event, newRecurrenceDaySchema);
	const changeStatusForm = await superValidate(event, changeStatusSchema);
	const editRecurrenceDayForm = await superValidate(event, editRecurrenceDaySchema);
	const deleteRecurrenceDayForm = await superValidate(event, deleteRecurrenceDaySchema);
	if (user.role === USER_ROLES.SUPERADMIN) {
		const details = getRequsitionDetailsForAdmin(idAsNum);

		return {
			user,
			hasRequisitionRights: true,
			changeStatusForm,
			recurrenceDayForm,
			editRecurrenceDayForm,
			deleteRecurrenceDayForm,
			company: details.company,
			requisition: details.requisition,
			recurrenceDays: details.recurrenceDays || [],
			applications: details.applications || [],
			timesheets: details.timesheets || []
		};
	}

	if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		const company = await getClientCompanyByClientId(client.id);
		const result = await getRequisitionDetailsById(idAsNum, company.id);
		const requisitionApplications = await getRequisitionApplications(idAsNum);
		const requisitionTimesheets = await getRequisitionTimesheets(idAsNum);
		const requisitionRecurrenceDays = await getRecurrenceDaysForRequisition(idAsNum);

		const hasRequisitionRights = true;

		return {
			user,
			company,
			hasRequisitionRights,
			changeStatusForm,
			recurrenceDayForm,
			editRecurrenceDayForm,
			deleteRecurrenceDayForm,
			requisition: result?.requisition ?? null,
			recurrenceDays: requisitionRecurrenceDays || [],
			applications: requisitionApplications || [],
			timesheets: requisitionTimesheets || []
		};
	}
	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const profile: ClientCompanyStaffProfile | null = await getClientStaffProfilebyUserId(user.id);
		const client = await getClientProfileByStaffUserId(user.id);
		const company = await getClientCompanyByClientId(client?.id);
		const result = await getRequisitionDetailsById(idAsNum, company.id);
		const requisitionApplications = await getRequisitionApplications(idAsNum);
		const requisitionTimesheets = await getRequisitionTimesheets(idAsNum);
		const requisitionRecurrenceDays = await getRecurrenceDaysForRequisition(idAsNum);

		const hasRequisitionRights =
			profile?.staffRole === 'CLIENT_ADMIN' || profile?.staffRole === 'CLIENT_MANAGER';

		return {
			user,
			company,
			changeStatusForm,
			hasRequisitionRights,
			recurrenceDayForm,
			editRecurrenceDayForm,
			deleteRecurrenceDayForm,
			requisition: result?.requisition ?? null,
			recurrenceDays: requisitionRecurrenceDays || [],
			applications: requisitionApplications || [],
			timesheets: requisitionTimesheets || []
		};
	}
};

export const actions = {
	changeStatus: async (request: RequestEvent) => {
		const user = request.locals.user;
		if (!user) {
			return fail(403);
		}

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

			await changeRequisitionStatus(values, Number(requisitionId), user.id);

			return message(form, 'Status Updated');
		} catch (error) {
			console.log(error);
			return setError(form, 'Something went wrong');
		}
	},
	addRecurrenceDays: async (event: RequestEvent) => {
		const user = event.locals.user;
		if (!user) return fail(403);

		const form = await superValidate(event, newRecurrenceDaySchema);
		if (!form.valid) return fail(400, { form });

		try {
			const daysToAdd = form.data.recurrenceDays;

			console.log(daysToAdd);

			await Promise.all(
				daysToAdd.map((day) =>
					createNewRecurrenceDay(
						{
							id: crypto.randomUUID(),
							createdAt: new Date(),
							updatedAt: new Date(),
							requisitionId: Number(day.requisitionId),
							date: day.date,
							dayStartTime: `${day.dayStartTime}:00${day.timezoneOffset || ''}`,
							dayEndTime: `${day.dayEndTime}:00${day.timezoneOffset || ''}`,
							lunchStartTime: `${day.lunchStartTime}:00${day.timezoneOffset || ''}`,
							lunchEndTime: `${day.lunchEndTime}:00${day.timezoneOffset || ''}`
						},
						user.id
					)
				)
			);

			return message(form, 'Created new Recurrence Days');
		} catch (error) {
			console.error(error);
			return setError(form, 'Something went wrong');
		}
	},
	editRecurrenceDay: async (request: RequestEvent) => {
		const user = request.locals.user;
		if (!user) {
			return fail(403);
		}
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

			await editRecurrenceDay(id, values, user.id);

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
	deleteRecurrenceDay: async (request: RequestEvent) => {
		const user = request.locals.user;
		if (!user) {
			return fail(403);
		}

		const form = await superValidate(request, deleteRecurrenceDaySchema);

		if (!form.valid) {
			fail(400, { form });
		}

		try {
			const id = form.data.id;

			if (!id.length) {
				fail(400, { form });
			}

			await deleteRecurrenceDay(id, user.id);

			return message(form, 'Deleted Recurrence Day');
		} catch (error) {
			console.log(error);
			return setError(form, 'Something went wrong');
		}
	}
};
