import { USER_ROLES } from '$lib/config/constants';
import {
	getClientCompanyByClientId,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getClientSubscription
} from '$lib/server/database/queries/clients';
import {
	adminOverrideTimesheet,
	approveTimesheet,
	convertToStripeAmount,
	createInvoiceRecord,
	getInvoiceByTimesheetId,
	getRecurrenceDaysForTimesheet,
	getRequisitionById,
	getRequisitionDetailsById,
	getRequisitionDetailsByIdAdmin,
	getTimesheetById,
	getTimesheetDetails,
	getTimesheetDetailsAdmin,
	getWorkdaysForTimesheet,
	rejectTimesheet,
	revertTimesheetToPending,
	updateTimesheetHours,
	validateTimesheet,
	voidTimesheet
} from '$lib/server/database/queries/requisitions';
import { error, fail, redirect } from '@sveltejs/kit';
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
				const user = await getUserById(history.userId);
				return { ...history, user: user?.user || null };
			})
		);

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
		if (!user.completedOnboarding) {
			redirect(302, '/onboarding/client/company');
		}
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

	return { user, timesheet: null, workdays: [], recurrenceDays: [], discrepancies: [] };
};

export const actions = {
	rejectTimesheet: async (event: RequestEvent) => {
		const user = event.locals.user;
		if (!user) {
			redirect(302, '/auth/sign-in');
		}
		const userId = user.id;
		const { id } = event.params;
		try {
			const { id } = event.params;
			await rejectTimesheet(id, userId);
			setFlash({ type: 'success', message: 'Timesheet rejected' }, event);
			return { succes: true };
		} catch (error) {
			await revertTimesheetToPending(id, user.id);
			console.error('Error rejecting timesheet:', error);
			setFlash({ type: 'error', message: 'Error rejecting timesheet' }, event);
		}
	},
	approveTimesheet: async (event: RequestEvent) => {
		const { id } = event.params;
		const { user } = event.locals;
		if (user === null) {
			redirect(302, '/auth/sign-in');
		}
		try {
			const [adminConfig] = await db.select().from(adminConfigTable).limit(1);

			const timesheet = await approveTimesheet(id, user.id);
			const requisition = timesheet.requisitionId
				? await getRequisitionById(timesheet.requisitionId)
				: null;
			if (!requisition) {
				throw new Error('Requisition not found for timesheet');
			}
			const amountInCents = convertToStripeAmount(
				timesheet.totalHoursWorked || 0,
				requisition!.hourlyRate,
				requisition!.hourlyRate && requisition.hourlyRate * 1.5
			);

			const adminFee = adminConfig.adminPaymentFee;
			const adminFeeType = adminConfig.adminPaymentFeeType;
			let finalAmt = amountInCents;

			if (adminFeeType === 'PERCENTAGE') {
				finalAmt += Math.round((amountInCents * adminFee) / 100);
			} else if (adminFeeType === 'FIXED') {
				finalAmt += Math.round(adminFee * 100);
			}

			finalAmt = Math.round(finalAmt);

			const stripeCustomerId =
				(await getClientSubscription(timesheet.associatedClientId)) || user.stripeCustomerId;

			const stripeInvoice = await createStripeInvoice(
				stripeCustomerId,
				[{ amountInCents: finalAmt, description: `Invoice for timesheet ${id}` }],
				{ userId: user.id, timesheetId: timesheet.id },
				`DentalStaff.US invoice: Hours worked for ${user.firstName} ${user.lastName} for timesheet ${id}`
			);

			await createInvoiceRecord(
				{
					clientId: timesheet.associatedClientId,
					timesheet,
					stripeInvoice: stripeInvoice,
					amountInDollars: (stripeInvoice.amount_due / 100).toFixed(2)
				},
				user.id
			);

			setFlash({ type: 'success', message: 'Timesheet approved' }, event);
			return { success: true, message: 'Timesheet approved', timesheet, stripeInvoice };
		} catch (err) {
			await revertTimesheetToPending(id, user?.id);
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
		if (event.locals.user === null) {
			redirect(302, '/auth/sign-in');
		}
		if (event.locals.user?.role !== USER_ROLES.SUPERADMIN) {
			throw error(403, 'Forbidden');
		}
		const { user } = event.locals;
		const { id } = event.params;
		try {
			const timesheet = await getTimesheetById(id);

			if (!timesheet) {
				return fail(404, { error: 'Timesheet not found' });
			}
			const overridden = await adminOverrideTimesheet(id, user.id, timesheet);
			const requisition = overridden.requisitionId
				? await getRequisitionById(overridden.requisitionId)
				: null;

			if (!requisition) {
				throw new Error('Requisition not found for timesheet');
			}

			const [adminConfig] = await db.select().from(adminConfigTable).limit(1);

			const amountInCents = convertToStripeAmount(
				timesheet.totalHoursWorked || 0,
				requisition!.hourlyRate,
				requisition!.hourlyRate && requisition.hourlyRate * 1.5
			);

			const adminFee = adminConfig.adminPaymentFee;
			const adminFeeType = adminConfig.adminPaymentFeeType;
			let finalAmt = amountInCents;

			if (adminFeeType === 'PERCENTAGE') {
				finalAmt += Math.round((amountInCents * adminFee) / 100);
			} else if (adminFeeType === 'FIXED') {
				finalAmt += Math.round(adminFee * 100);
			}

			finalAmt = Math.round(finalAmt);

			const stripeCustomerId = await getClientSubscription(overridden.associatedClientId);

			if (!stripeCustomerId) {
				return fail(404, { error: 'No Stripe customer found for this client' });
			}

			const stripeInvoice = await createStripeInvoice(
				stripeCustomerId,
				[{ amountInCents: finalAmt, description: `Invoice for timesheet ${id}` }],
				{ userId: user.id, timesheetId: overridden.id },
				`DentalStaff.US invoice: Hours worked for ${user.firstName} ${user.lastName} for timesheet ${id}`
			);

			await createInvoiceRecord(
				{
					clientId: overridden.associatedClientId,
					timesheet: overridden,
					stripeInvoice: stripeInvoice,
					amountInDollars: (stripeInvoice.amount_due / 100).toFixed(2)
				},
				user.id
			);

			setFlash({ type: 'success', message: 'Timesheet approved' }, event);
			return { success: true, message: 'Timesheet approved', overridden, stripeInvoice };
		} catch (error) {}
	},
	adminEditTimesheet: async (event: RequestEvent) => {
		const user = event.locals.user;
		if (!user) {
			redirect(302, '/auth/sign-in');
		}

		if (user.role !== USER_ROLES.SUPERADMIN) {
			throw error(403, 'Forbidden');
		}

		const { id } = event.params;
		const formData = await event.request.formData();

		try {
			// Parse the updated hours data from form
			const hoursRaw = JSON.parse(formData.get('hoursRaw') as string);
			const totalHoursWorked = formData.get('totalHoursWorked') as string;

			// Update timesheet with new hours
			const updatedTimesheet = await updateTimesheetHours(id, {
				hoursRaw,
				totalHoursWorked,
				userId: user.id
			});

			setFlash({ type: 'success', message: 'Timesheet hours updated successfully' }, event);
			return { success: true, timesheet: updatedTimesheet };
		} catch (error) {
			console.error('Error updating timesheet:', error);
			setFlash({ type: 'error', message: 'Error updating timesheet hours' }, event);
			return { success: false };
		}
	}
};
