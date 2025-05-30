import { USER_ROLES } from '$lib/config/constants';
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getClientSubscription
} from '$lib/server/database/queries/clients';
import {
	approveTimesheet,
	convertToStripeAmount,
	createInvoiceRecord,
	getInvoiceByTimesheetId,
	getRecurrenceDaysForTimesheet,
	getRequisitionDetailsById,
	getRequisitionDetailsByIdAdmin,
	getTimesheetDetails,
	getTimesheetDetailsAdmin,
	getWorkdaysForTimesheet,
	rejectTimesheet,
	revertTimesheetToPending,
	validateTimesheet,
	voidTimesheet
} from '$lib/server/database/queries/requisitions';
import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { createStripeInvoice, stripe } from '$lib/server/stripe';
import db from '$lib/server/database/drizzle';
import { desc, eq } from 'drizzle-orm';
import { adminConfigTable } from '$lib/server/database/schemas/config';
import { actionHistoryTable } from '$lib/server/database/schemas/admin';
import { redirectIfNotValidCustomer } from '$lib/server/database/queries/billing';
import { userTable } from '$lib/server/database/schemas/auth';
import { getUserById } from '$lib/server/database/queries/users';

export const load = async (event: RequestEvent) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	const { id } = event.params;

	if (user.role === USER_ROLES.SUPERADMIN) {
		const timesheet = await getTimesheetDetailsAdmin(id);
		const requisition = await getRequisitionDetailsByIdAdmin(timesheet.requisitionId);
		const recurrenceDays = await getRecurrenceDaysForTimesheet(timesheet);
		const workdays = await getWorkdaysForTimesheet(timesheet);
		const discrepancies = validateTimesheet(timesheet, recurrenceDays, workdays);
		const invoice = await getInvoiceByTimesheetId(id);
		const auditHistoryRaw = await db
			.select()
			.from(actionHistoryTable)
			.where(eq(actionHistoryTable.entityId, id))
			.orderBy(desc(actionHistoryTable.createdAt));

		const auditHistory = await Promise.allSettled(
			auditHistoryRaw.map(async (history) => {
				const { user } = await getUserById(history.userId);
				return {
					...history,
					user: user || null
				};
			})
		);

		console.log(auditHistory.map((h) => h.status === 'fulfilled' && h.value));

		return {
			user,
			timesheet,
			workdays,
			recurrenceDays,
			requisition: requisition.requisition,
			discrepancies,
			invoice,
			auditHistory: auditHistory.map((h) => h.status === 'fulfilled' && h.value)
		};
	}

	if (user.role === USER_ROLES.CLIENT) {
		const client = await getClientProfilebyUserId(user.id);
		await redirectIfNotValidCustomer(client.id, user.role);

		const timesheet = await getTimesheetDetails(id, client.id);
		const requisition = await getRequisitionDetailsById(timesheet.requisitionId);
		const recurrenceDays = await getRecurrenceDaysForTimesheet(timesheet);
		const workdays = await getWorkdaysForTimesheet(timesheet);
		const discrepancies = validateTimesheet(timesheet, recurrenceDays, workdays);
		const invoice = await getInvoiceByTimesheetId(id);

		return {
			user,
			timesheet,
			workdays,
			recurrenceDays,
			requisition: requisition.requisition,
			discrepancies,
			invoice
		};
	}
	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		await redirectIfNotValidCustomer(client?.id, user.role);

		const timesheet = await getTimesheetDetails(id, client?.id);
		const requisition = await getRequisitionDetailsById(timesheet.requisitionId);
		const recurrenceDays = await getRecurrenceDaysForTimesheet(timesheet);
		const workdays = await getWorkdaysForTimesheet(timesheet);
		const discrepancies = validateTimesheet(timesheet, recurrenceDays, workdays);
		const invoice = await getInvoiceByTimesheetId(id);

		return {
			user,
			timesheet,
			workdays,
			recurrenceDays,
			requisition: requisition.requisition,
			discrepancies,
			invoice
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
		const user = event.locals.user;
		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		const userId = user.id;
		try {
			const { id } = event.params;
			await rejectTimesheet(id, userId);
			setFlash({ type: 'success', message: 'Timesheet rejected' }, event);
			return { succes: true };
		} catch (error) {
			console.error('Error rejecting timesheet:', error);
			setFlash({ type: 'error', message: 'Error rejecting timesheet' }, event);
		}
	},
	approveTimesheet: async (event: RequestEvent) => {
		const { id } = event.params;
		try {
			const [adminConfig] = await db.select().from(adminConfigTable).limit(1);
			const { user } = event.locals;

			if (user === null) {
				redirect(302, '/auth/sign-in');
			}
			const timesheet = await approveTimesheet(id, user.id);
			const amountInCents = convertToStripeAmount(
				timesheet.totalHoursWorked || 0,
				timesheet.candidateRateBase,
				timesheet.candidateRateOT
			);

			const adminFee = adminConfig.adminPaymentFee;
			const adminFeeType = adminConfig.adminPaymentFeeType;
			let finalAmt = amountInCents;

			if (adminFeeType === 'PERCENTAGE') {
				finalAmt += Math.round((amountInCents * adminFee) / 100);
			} else if (adminFeeType === 'FIXED') {
				finalAmt += adminFee;
			}
			const stripeCustomerId =
				(await getClientSubscription(timesheet.associatedClientId)) || user.stripeCustomerId;

			const stripeInvoice = await createStripeInvoice(
				stripeCustomerId,
				finalAmt,
				`DentalStaff.US invoice: Hours worked for ${user.firstName} ${user.lastName} for timesheet ${id}`,
				{ userId: user.id, timesheetId: timesheet.id }
			);

			await createInvoiceRecord({
				clientId: timesheet.associatedClientId,
				timesheet,
				stripeInvoice: stripeInvoice,
				amountInDollars: (stripeInvoice.amount_due / 100).toFixed(2)
			});

			setFlash({ type: 'success', message: 'Timesheet approved' }, event);
			return {
				success: true,
				message: 'Timesheet approved',
				timesheet,
				// invoice,
				stripeInvoice
			};
		} catch (err) {
			await revertTimesheetToPending(id);
			console.error('Error approving timesheet:', err);
			setFlash({ type: 'error', message: 'Error approving timesheet' }, event);
			return { success: false };
		}
	},
	editTimesheet: async (event: RequestEvent) => {
		if (event.locals.user?.role !== USER_ROLES.SUPERADMIN) {
			throw error(403, 'Forbidden');
		}

		const { id } = event.params;
	},
	voidTimesheet: async (event: RequestEvent) => {
		const user = event.locals.user;
		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		const userId = user.id;
		try {
			const { id } = event.params;
			await voidTimesheet(id, userId);
			setFlash({ type: 'success', message: 'Timesheet voided' }, event);
			return { succes: true };
		} catch (error) {
			console.error('Error rejecting timesheet:', error);
			setFlash({ type: 'error', message: 'Error voiding timesheet' }, event);
		}
	},
	adminOverrideTimesheet: async (event: RequestEvent) => {
		if (event.locals.user?.role !== USER_ROLES.SUPERADMIN) {
			throw error(403, 'Forbidden');
		}
	}
};
