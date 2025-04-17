import { USER_ROLES } from '$lib/config/constants';
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients';
import {
	getRecurrenceDaysForTimesheet,
	getRequisitionDetailsById,
	getTimesheetDetails,
	getWorkdaysForTimesheet,
	rejectTimesheet,
	validateTimesheet
} from '$lib/server/database/queries/requisitions';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async (event: RequestEvent) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const { id } = event.params;

	if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		const company = await getClientCompanyByClientId(client.id);

		const timesheet = await getTimesheetDetails(id, client.id);
		const requisition = await getRequisitionDetailsById(timesheet.requisitionId, company.id);
		const recurrenceDays = await getRecurrenceDaysForTimesheet(timesheet);
		const workdays = await getWorkdaysForTimesheet(timesheet);
		const discrepancies = validateTimesheet(timesheet, recurrenceDays, workdays);

		console.log({ timesheet });

		return {
			user,
			timesheet,
			workdays,
			recurrenceDays,
			requisition: requisition.requisition,
			discrepancies
		};
	}
	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		const company = await getClientCompanyByClientId(client?.id);

		const timesheet = await getTimesheetDetails(id, client?.id);
		const requisition = await getRequisitionDetailsById(timesheet.requisitionId, company.id);
		const recurrenceDays = await getRecurrenceDaysForTimesheet(timesheet);
		const workdays = await getWorkdaysForTimesheet(timesheet);
		const discrepancies = validateTimesheet(timesheet, recurrenceDays, workdays);

		console.log({ timesheet });

		return {
			user,
			timesheet,
			workdays,
			recurrenceDays,
			requisition: requisition.requisition,
			discrepancies
		};
	}

	return {
		user,
		timesheet: null,
		workdays: [],
		recurrenceDays: [],
		discrepancies: []
	};
};

export const actions = {
	rejectTimesheet: async (event: RequestEvent) => {
		try {
			// TODO: Change Timesheet Status to DISCREPANCY
			const { id } = event.params;

			console.log('Rejecting timesheet: ', id);
			await rejectTimesheet(id);
			setFlash({ type: 'success', message: 'Timesheet rejected' }, event);
			return { succes: true };
		} catch (error) {
			console.error('Error rejecting timesheet:', error);
			setFlash({ type: 'error', message: 'Error rejecting timesheet' }, event);
		}
	},
	approveTimesheet: async (event: RequestEvent) => {
		// TODO: Validate Timesheet Data
		// Change Timesheet Status to APPROVED
		// Generate Invoice for timesheet
	},
	// editTimesheet: async (event: RequestEvent) => {},
	closeTimesheet: async (event: RequestEvent) => {
		// TODO: Change Timesheet Status to VOID
	}
};
