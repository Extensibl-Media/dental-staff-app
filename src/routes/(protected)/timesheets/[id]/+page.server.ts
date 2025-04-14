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
	validateTimesheet
} from '$lib/server/database/queries/requisitions';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

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
	rejectTimesheet: async (event: RequestEvent) => {},
	approveTimesheet: async (event: RequestEvent) => {
		// TODO: Validate Timesheet Data
		// Change Timesheet Status to APPROVED
		// Generate Invoice for timesheet
	},
	editTimesheet: async (event: RequestEvent) => {}
};
