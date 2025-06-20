import { USER_ROLES } from '$lib/config/constants.js';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import {
	getClientDashboardData,
	getClientProfileByStaffUserId,
	getClientProfilebyUserId,
	getClientStaffProfilebyUserId
} from '$lib/server/database/queries/clients';
import { superValidate } from 'sveltekit-superforms/server';
import db from '$lib/server/database/drizzle';
import { invoiceTable } from '$lib/server/database/schemas/requisition';
import { count, and, eq, lt, ne, sum } from 'drizzle-orm';
import { getAdminDashboardData } from '$lib/server/database/queries/admin';

export const load = async (event: RequestEvent) => {
	//I only have this function here so it will check page again
	//instead of keeping it cache if it was client side only.
	//If only client side, it might still show the page even
	//if the user has logged out.
	// const session = await locals.auth.validate();
	event.setHeaders({
		'cache-control': 'max-age=60'
	});

	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === 'SUPERADMIN') {
		const {
			timesheetsDueCount,
			supportTickets,
			openSupportTicketsCount,
			discrepancies,
			newCandidateProfiles,
			newClientSignups,
			invoicesDueCount,
			invoicesDue
		} = await getAdminDashboardData();

		// console.log(discrepancies)
		return {
			user,
			timesheetsDueCount,
			supportTickets,
			openSupportTicketsCount,
			discrepancies,
			newCandidateProfiles,
			newClientSignups,
			invoicesDueCount,
			invoicesDue
		};
	}

	if (user.role === USER_ROLES.CLIENT) {
		if (!user.completedOnboarding) {
			redirect(302, '/onboarding/client/company');
		}

		const client = await getClientProfilebyUserId(user.id);
		const {
			requisitions,
			supportTickets,
			newApplicationsCount,
			timesheetsDueCount,
			discrepanciesCount,
			positionApplications,
			timesheetsDue,
			invoices
		} = await getClientDashboardData(client?.id, user.id);

		const overdueInvoicesCount = await db
			.select({ count: count() })
			.from(invoiceTable)
			.where(
				and(
					eq(invoiceTable.clientId, client?.id),
					lt(invoiceTable.dueDate, new Date()),
					ne(invoiceTable.status, 'paid')
				)
			);

		const pendingInvoicesCount = await db
			.select({ count: count() })
			.from(invoiceTable)
			.where(and(eq(invoiceTable.clientId, client?.id), eq(invoiceTable.status, 'open')));

		const totalAmountDue = await db
			.select({ sum: sum(invoiceTable.amountDue) })
			.from(invoiceTable)
			.where(
				and(
					eq(invoiceTable.clientId, client?.id),
					ne(invoiceTable.status, 'paid'),
					ne(invoiceTable.status, 'void')
				)
			);

		return {
			user,
			profile: client,
			client,
			requisitions,
			recentApplications: positionApplications,
			supportTickets,
			newApplicationsCount,
			timesheetsDue,
			timesheetsDueCount,
			discrepanciesCount,
			invoices,
			totalAmountDue: totalAmountDue[0]?.sum,
			overdueInvoicesCount: overdueInvoicesCount[0]?.count,
			pendingInvoicesCount: pendingInvoicesCount[0]?.count
		};
	}

	if (user.role === USER_ROLES.CLIENT_STAFF) {
		const client = await getClientProfileByStaffUserId(user.id);
		const profile = await getClientStaffProfilebyUserId(user.id);

		if (!client) {
			return redirect(302, '/');
		}

		const {
			requisitions,
			supportTickets,
			newApplicationsCount,
			timesheetsDueCount,
			discrepanciesCount,
			positionApplications,
			timesheetsDue,
			invoices
		} = await getClientDashboardData(client?.id, user.id);

		const overdueInvoicesCount = await db
			.select({ count: count() })
			.from(invoiceTable)
			.where(
				and(
					eq(invoiceTable.clientId, client?.id),
					lt(invoiceTable.dueDate, new Date()),
					ne(invoiceTable.status, 'paid')
				)
			);

		const pendingInvoicesCount = await db
			.select({ count: count() })
			.from(invoiceTable)
			.where(and(eq(invoiceTable.clientId, client.id), eq(invoiceTable.status, 'open')));

		const totalAmountDue = await db
			.select({ sum: sum(invoiceTable.amountDue) })
			.from(invoiceTable)
			.where(
				and(
					eq(invoiceTable.clientId, client?.id),
					ne(invoiceTable.status, 'paid'),
					ne(invoiceTable.status, 'void')
				)
			);

		return {
			user,
			profile,
			client,
			requisitions,
			recentApplications: positionApplications,
			supportTickets,
			newApplicationsCount,
			timesheetsDue,
			timesheetsDueCount,
			discrepanciesCount,
			invoices,
			totalAmountDue: totalAmountDue[0]?.sum,
			overdueInvoicesCount: overdueInvoicesCount[0]?.count,
			pendingInvoicesCount: pendingInvoicesCount[0]?.count
		};
	}

	return null;
};
