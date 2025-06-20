import { USER_ROLES } from '$lib/config/constants';
import { redirectIfNotValidCustomer } from '$lib/server/database/queries/billing';
import {
	getClientProfileByStaffUserId,
	getClientProfilebyUserId
} from '$lib/server/database/queries/clients';
import {
	getAllTimesheetsForClient,
	getAllTimesheetsAdmin,
	getRecurrenceDaysForRequisition,
	getWorkdaysForRecurrenceDays,
	validateTimesheet
} from '$lib/server/database/queries/requisitions';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	const { locals, url } = event;
	const searchTerm = url.searchParams.get('search') || '';

	const { user } = locals;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	let timesheets: any = [];

	if (user.role === USER_ROLES.SUPERADMIN) {
		timesheets = await getAllTimesheetsAdmin(searchTerm);
	} else if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		await redirectIfNotValidCustomer(client.id, user.role);
		timesheets = await getAllTimesheetsForClient(client?.id, searchTerm);
	} else if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		await redirectIfNotValidCustomer(client?.id, user.role);
		timesheets = await getAllTimesheetsForClient(client?.id, searchTerm);
	}

	// Enhance timesheets with validation data and discrepancy checking
	const enhancedTimesheets = await Promise.all(
		(timesheets || []).map(async (timesheet) => {
			try {
				// Fetch validation data for this timesheet's requisition
				const recurrenceDays = await getRecurrenceDaysForRequisition(timesheet.requisition.id);
				const recurrenceDayIds = recurrenceDays?.map((rd) => rd.id);
				const workdays =
					recurrenceDayIds.length > 0 ? await getWorkdaysForRecurrenceDays(recurrenceDayIds) : [];

				// Run validation
				const discrepancies = validateTimesheet(timesheet.timesheet, recurrenceDays, workdays);

				// Return enhanced timesheet with validation data
				return {
					...timesheet,
					recurrenceDays,
					workdays,
					discrepancies,
					hasValidationIssues: discrepancies.length > 0
				};
			} catch (error) {
				console.error(`Error validating timesheet ${timesheet.timesheet.id}:`, error);
				// Return timesheet without validation data if error occurs
				return {
					...timesheet,
					recurrenceDays: [],
					workdays: [],
					discrepancies: [],
					hasValidationIssues: false
				};
			}
		})
	);

	return { user, timesheets: enhancedTimesheets, searchTerm };
};
