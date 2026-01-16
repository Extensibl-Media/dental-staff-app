// /routes/api/stripe/setup-customer/+server.ts

import db from '$lib/server/database/drizzle';
import { getClientProfileById } from '$lib/server/database/queries/clients';
import { clientSubscriptionTable } from '$lib/server/database/schemas/client';
import { type RequestHandler, error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { stripe } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;

	if (!user || user.role !== 'SUPERADMIN') {
		throw error(403, 'Unauthorized');
	}

	try {
		const { clientId } = await request.json();

		if (!clientId) {
			throw error(400, 'Client ID is required');
		}

		const clientData = await getClientProfileById(clientId);

		if (!clientData) {
			throw error(404, 'Client not found');
		}

		// Create Stripe Checkout Session in SETUP MODE
		const session = await stripe.checkout.sessions.create({
			mode: 'setup',
			currency: 'usd', // Required for setup mode with dynamic payment methods
			customer_email: clientData.user.email,
			payment_method_types: ['card'],
			// Minimal redirect URLs (most users won't see these)
			success_url: `${request.headers.get('origin')}/setup-complete`,
			cancel_url: `${request.headers.get('origin')}/setup-complete`,
			metadata: {
				clientId: clientId,
				setupType: 'internal_customer'
			}
		});

		// Create or update clientSubscription with pending status
		const existingSubscription = await db
			.select()
			.from(clientSubscriptionTable)
			.where(eq(clientSubscriptionTable.clientId, clientId))
			.limit(1);

		if (existingSubscription.length > 0) {
			await db
				.update(clientSubscriptionTable)
				.set({
					stripeCustomerSetupPending: true,
					updatedAt: new Date()
				})
				.where(eq(clientSubscriptionTable.clientId, clientId));
		} else {
			await db.insert(clientSubscriptionTable).values({
				id: crypto.randomUUID(),
				clientId: clientId,
				status: 'inactive',
				stripeCustomerSetupPending: true,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		return json({ url: session.url });
	} catch (err) {
		console.error('Error creating setup session:', err);
		throw error(500, 'Failed to create setup session');
	}
};
