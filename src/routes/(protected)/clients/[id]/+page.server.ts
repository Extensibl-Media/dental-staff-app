import type { PageServerLoad, RequestEvent } from './$types';
import {
	getAllClientLocationsByCompanyId,
	getAllClientStaffProfiles,
	getCalendarEventsForClient,
	getClientProfileById,
	getClientSubscription
} from '$lib/server/database/queries/clients';
import { redirect } from '@sveltejs/kit';
import { USER_ROLES } from '$lib/config/constants';
import {
	getSupportTicketsForClient,
	getSupportTicketsForUser
} from '$lib/server/database/queries/support';
import { createInvoiceRecord, getClientInvoices } from '$lib/server/database/queries/requisitions';
import { createStripeInvoice } from '$lib/server/stripe';
import { z } from 'zod';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { setFlash } from 'sveltekit-flash-message/server';
import { getClientBillingInfo } from '$lib/server/database/queries/billing';

const LineItemSchema = z.array(
	z.object({
		description: z.string().optional(),
		amount: z.number().min(0, 'Item amount must be a positive number'),
		quantity: z.any().transform((val) => {
			const parsed = parseInt(val, 10);
			if (isNaN(parsed) || parsed <= 0) {
				throw new Error('Item quantity must be a positive integer');
			}
			return parsed;
		}),
		rate: z.string().transform((val) => {
			const parsed = parseFloat(val);
			if (isNaN(parsed) || parsed < 0) {
				throw new Error('Item rate must be a non-negative number');
			}
			return parsed;
		})
	})
);

const NewInvoiceSchema = z.object({
	amount: z.number().min(0, 'Amount must be a positive number'),
	dueDate: z.string().optional(),
	description: z.string().optional(),
	items: z.string().transform((val) => {
		try {
			return JSON.parse(val);
		} catch {
			return [];
		}
	})
});

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role !== USER_ROLES.SUPERADMIN) {
		redirect(302, '/dashboard');
	}

	const { id } = params;

	const result = await getClientProfileById(id);
	const locations = result.company ? await getAllClientLocationsByCompanyId(result.company.id) : [];
	const requisitions = await getCalendarEventsForClient(id);
	const supportTickets = await getSupportTicketsForClient(result.profile.id);
	const staff = await getAllClientStaffProfiles(result.company.id);
	const invoices = await getClientInvoices(id, { includeStripeData: true });
	const invoiceForm = await superValidate(NewInvoiceSchema);

	return result
		? {
				user,
				client: {
					profile: result.profile,
					user: result.user,
					company: result.company,
					locations: locations
				},
				requisitions,
				supportTickets,
				staff,
				invoices,
				invoiceForm
			}
		: {
				user,
				client: null,
				requisitions: [],
				supportTickets: [],
				invoices: [],
				staff: [],
				invoiceForm
			};
};

export const actions = {
	createInvoice: async (request: RequestEvent) => {
		const user = request.locals.user;
		const { id: clientId } = request.params;

		if (!user || user.role !== USER_ROLES.SUPERADMIN) {
			redirect(302, '/dashboard');
		}

		const form = await superValidate(request, NewInvoiceSchema);

		try {
			const lineItems = await LineItemSchema.parseAsync(form.data.items);
			const dateString = form.data.dueDate; // User selected this date
			const localDate = new Date(dateString + 'T00:00:00'); // Treat as local midnight
			const utcDate = localDate.toISOString();
			const stripeCustomerId = await getClientSubscription(clientId);

			if (stripeCustomerId) {
				const invoice = await createStripeInvoice(
					stripeCustomerId,
					lineItems.map((item) => ({
						amountInCents: Math.round(item.amount * 100), // Convert to cents
						description: item.description || '',
						quantity: item.quantity || 1,
						currency: 'usd'
					})),
					{ clientId: clientId },
					form.data.description,
					utcDate
				);
				await createInvoiceRecord({
					clientId,
					stripeInvoice: invoice,
					amountInDollars: (invoice.amount_due / 100).toFixed(2)
				});
			} else throw new Error('Stripe customer ID not found for the client');
			setFlash({ type: 'success', message: 'Invoice created successfully' }, request);
			return message(form, 'Invoice created successfully');
		} catch (error) {
			setFlash({ type: 'error', message: 'Failed to create invoice' }, request);
			console.error('Error creating invoice:', error);
			return setError(form, 'Failed to create invoice');
		}
	}
};
