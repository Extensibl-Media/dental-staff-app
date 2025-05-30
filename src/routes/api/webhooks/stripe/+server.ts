import {
	invoiceTable,
	timeSheetTable,
	type TimeSheetSelect
} from './../../../../lib/server/database/schemas/requisition';
import { stripe } from '$lib/server/stripe';
import { json } from '@sveltejs/kit';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';
import { getClientProfilebyUserId } from '$lib/server/database/queries/clients';
import {
	handleCheckoutCompleted,
	handleSubscriptionCreated,
	handleSubscriptionDeleted,
	handleSubscriptionUpdated
} from '$lib/server/database/queries/billing';
import type Stripe from 'stripe';
import db from '$lib/server/database/drizzle';
import { clientSubscriptionTable } from '$lib/server/database/schemas/client';
import { eq } from 'drizzle-orm';
import {
	createInvoiceRecord,
	getTimesheetDetails
} from '$lib/server/database/queries/requisitions';

export const POST: RequestHandler = async ({ request }) => {
	console.log('Webhook received');
	console.log('Webhook Secret: ', STRIPE_WEBHOOK_SECRET);

	// Get the raw body directly as text instead of converting to buffer
	const payload = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		console.error('No stripe signature found');
		return new Response('No stripe signature', { status: 400 });
	}

	try {
		console.log('Constructing event...');
		const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
		console.log('Event constructed successfully:', event.type);

		// Add special handling for invoice.paid events
		switch (event.type) {
			case 'checkout.session.completed':
				console.log('Handling checkout session completed');
				await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
				break;

			case 'customer.subscription.created':
				console.log('Handling customer subscription created');
				await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
				break;

			case 'customer.subscription.updated':
				console.log('Handling customer subscription updated');
				await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
				break;

			case 'customer.subscription.deleted':
				console.log('Handling customer subscription deleted');
				await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
				// TODO: handle subscription delete/cleanup in database
				await db
					.delete(clientSubscriptionTable)
					.where(
						eq(clientSubscriptionTable.stripeCustomerId, event.data.object.customer as string)
					);
				break;
			case 'invoice.created':
				console.log('Handling invoice created');
				const invoiceCreated = event.data.object as Stripe.Invoice;
				console.log(invoiceCreated);
				break;
			case 'invoice.finalized':
				console.log('Handling invoice finalized');
				const invoiceFinalized = event.data.object as Stripe.Invoice;

				let timesheet;

				const client = await getClientProfilebyUserId(invoiceFinalized.metadata?.userId);
				if (!client) {
					console.error('Client not found for userId:', invoiceFinalized.metadata?.userId);
					return new Response('Client not found', { status: 400 });
				}

				if (invoiceFinalized.metadata?.timesheetId) {
					const [result] = await db
						.select()
						.from(timeSheetTable)
						.where(eq(timeSheetTable.id, invoiceFinalized.metadata?.timesheetId))
						.limit(1);
					timesheet = result as TimeSheetSelect;
				}

				const invoice = event.data.object as Stripe.Invoice;
				console.log('Invoice paid:', invoice.id);
				break;
			case 'invoice.payment_failed':
				console.log('Handling invoice payment failed');
				const invoicePaymentFailed = event.data.object as Stripe.Invoice;
				console.log(invoicePaymentFailed);
				break;
			case 'invoice.payment_succeeded':
				console.log('Handling invoice payment succeeded');
				const invoicePaymentSucceeded = event.data.object as Stripe.Invoice;
				console.log(invoicePaymentSucceeded);
				const [existingPaidInvoice] = await db
					.select()
					.from(invoiceTable)
					.where(eq(invoiceTable.stripeInvoiceId, invoicePaymentSucceeded.id))
					.limit(1);
				if (existingPaidInvoice) {
					console.log('Invoice  exists in the database:', existingPaidInvoice);
					await db
						.update(invoiceTable)
						.set({
							status: 'paid',
							stripeStatus: invoicePaymentSucceeded.status,
							paidAt: new Date(),
							amountDue: (invoicePaymentSucceeded.amount_due / 100).toFixed(2),
							amountPaid: (invoicePaymentSucceeded.amount_paid / 100).toFixed(2),
							amountRemaining: (invoicePaymentSucceeded.amount_remaining / 100).toFixed(2)
						})
						.where(eq(invoiceTable.id, existingPaidInvoice.id));
				}
				break;
			case 'invoice.voided':
				console.log('Handling invoice voided');
				const invoiceVoided = event.data.object as Stripe.Invoice;
				console.log(invoiceVoided);
				const [existingVoidedInvoice] = await db
					.select()
					.from(invoiceTable)
					.where(eq(invoiceTable.stripeInvoiceId, invoiceVoided.id))
					.limit(1);
				if (existingVoidedInvoice) {
					console.log('Invoice  exists in the database:', existingVoidedInvoice);
					await db
						.update(invoiceTable)
						.set({
							status: 'void',
							stripeStatus: invoiceVoided.status
						})
						.where(eq(invoiceTable.id, existingVoidedInvoice.id));
				}
				break;
		}

		return json({ received: true });
	} catch (err) {
		console.error('Full webhook error:', err);
		console.error('Error message:', (err as Error).message);
		return new Response(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`, {
			status: 400
		});
	}
};
