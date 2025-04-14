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

function toBuffer(ab: ArrayBuffer): Buffer {
	const buf = Buffer.alloc(ab.byteLength);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buf.length; i++) {
		buf[i] = view[i];
	}
	return buf;
}

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
			// case 'invoice.paid':
			// 	const invoice = event.data.object as Stripe.Invoice;
			// 	// You might want to handle this event to track successful payments
			// 	console.log('Invoice paid:', invoice.id);
			// 	break;

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
				break;
		}

		return json({ received: true });
	} catch (err) {
		console.error('Full webhook error:', err);
		console.error('Error message:', err.message);
		return new Response(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`, {
			status: 400
		});
	}
};
