import { message } from 'sveltekit-superforms/server';
import { stripe } from '$lib/server/stripe';
import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { USER_ROLES } from '$lib/config/constants';
import { getInvoiceById, getInvoiceByIdAdmin } from '$lib/server/database/queries/requisitions';
import { getClientProfilebyUserId } from '$lib/server/database/queries/clients';
import { setFlash } from 'sveltekit-flash-message/server';
import { Stripe } from 'stripe';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		redirect(302, '/auth/sign-in');
	}

	if (user.role === USER_ROLES.SUPERADMIN) {
		const invoiceDetails = await getInvoiceByIdAdmin(event.params.id);

		return {
			user,
			invoice: invoiceDetails
		};
	}

	if (user.role === USER_ROLES.CLIENT) {
		if (!user.completedOnboarding) {
			redirect(302, '/onboarding/client/company');
		}
		const client = await getClientProfilebyUserId(user.id);
		const invoiceDetails = await getInvoiceById(event.params.id, client.id);

		return {
			user,
			invoice: invoiceDetails
		};
	}

	return {
		user,
		invoice: null
	};
};

export const actions = {
	adminProcessInvoice: async (event) => {
		const id = event.params.id;
		const user = event.locals.user;
		if (!user || user.role !== USER_ROLES.SUPERADMIN) {
			redirect(302, '/auth/sign-in');
		}

		const invoice = await getInvoiceByIdAdmin(id);
		if (!invoice) {
			redirect(302, '/invoices');
		}
		console.log(invoice);

		try {
			if (invoice.invoice.stripeInvoiceId) {
				const result = await stripe.invoices.pay(invoice.invoice.stripeInvoiceId);

				console.log('Invoice payment result:', result);

				setFlash({ type: 'success', message: 'Invoice processed successfully' }, event);
				return {
					success: true
				};
			}
		} catch (error) {
			console.error('Error processing invoice:', error);
			setFlash(
				{ type: 'error', message: `Failed to process invoice: ${error.raw.message}` },
				event
			);
		}
	}
};
