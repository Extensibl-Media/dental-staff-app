// lib/server/database/queries/billing.ts
import { eq } from 'drizzle-orm';
import db from '../drizzle';
import { clientSubscriptionTable } from '../schemas/client';
import { stripe } from '$lib/server/stripe';
import { error } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { getUserByEmail } from './users';
import { getClientProfilebyUserId } from './clients';
import { userTable } from '../schemas/auth';

export async function getClientBillingInfo(clientId: string | undefined) {
	if (!clientId) return error(500, 'Must provide client id');

	try {
		const [dbSubscription] = await db
			.select()
			.from(clientSubscriptionTable)
			.where(eq(clientSubscriptionTable.clientId, clientId))
			.limit(1);

		if (!dbSubscription?.stripeCustomerId) {
			return {
				subscription: null,
				paymentMethod: null,
				invoices: []
			};
		}

		// Fetch subscription details from Stripe without expand
		const [subscriptions, paymentMethods, invoices] = await Promise.all([
			stripe.subscriptions.list({
				customer: dbSubscription.stripeCustomerId,
				limit: 1,
				status: 'active'
			}),
			stripe.paymentMethods.list({
				customer: dbSubscription.stripeCustomerId,
				type: 'card'
			}),
			stripe.invoices.list({
				customer: dbSubscription.stripeCustomerId,
				limit: 12
			})
		]);

		const activeSubscription = subscriptions.data[0];
		const defaultPaymentMethod = paymentMethods.data[0];

		let productName = null;
		if (activeSubscription) {
			const price = await stripe.prices.retrieve(activeSubscription.items.data[0].price.id);
			const product = await stripe.products.retrieve(price.product as string);
			productName = product.name;
		}

		return {
			clientSubscription: dbSubscription,
			subscription: activeSubscription
				? {
						id: activeSubscription.id,
						status: activeSubscription.status,
						currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
						cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
						priceId: activeSubscription.items.data[0].price.id,
						productName,
						amount: activeSubscription.items.data[0].price.unit_amount! / 100,
						interval: activeSubscription.items.data[0].price.recurring?.interval
					}
				: null,
			paymentMethod: defaultPaymentMethod
				? {
						id: defaultPaymentMethod.id,
						brand: defaultPaymentMethod.card?.brand,
						last4: defaultPaymentMethod.card?.last4,
						expiryMonth: defaultPaymentMethod.card?.exp_month,
						expiryYear: defaultPaymentMethod.card?.exp_year
					}
				: null,
			invoices: invoices.data.map((invoice) => ({
				id: invoice.id,
				number: invoice.number,
				amount: invoice.amount_paid / 100,
				status: invoice.status,
				date: new Date(invoice.created * 1000),
				pdfUrl: invoice.invoice_pdf
			}))
		};
	} catch (error) {
		console.error('Error fetching billing info:', error);
		throw error;
	}
}

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
	try {
		const customerId = subscription.customer as string;
		const priceId = subscription.items.data[0].price.id;

		const customerData = await stripe.customers.retrieve(customerId);
		if (customerData.deleted === true) {
			console.log('Customer was deleted, skipping subscription creation');
			return;
		}

		if (!customerData.email) {
			console.log('No customer email found, skipping subscription creation');
			return;
		}

		const user = await getUserByEmail(customerData.email);
		if (!user) {
			console.log('No user found for email:', customerData.email);
			return;
		}

		const client = await getClientProfilebyUserId(user.id);
		if (!client) {
			console.log('No client found for user:', user.id);
			return;
		}

		// Use upsert instead of insert
		await db
			.insert(clientSubscriptionTable)
			.values({
				id: subscription.id,
				clientId: client.id,
				stripeCustomerId: customerId,
				status: subscription.status,
				priceId: priceId,
				createdAt: new Date(subscription.created * 1000),
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: clientSubscriptionTable.id,
				set: {
					status: subscription.status,
					priceId: priceId,
					updatedAt: new Date()
				}
			});

		await db
			.update(userTable)
			.set({ stripeCustomerId: customerId })
			.where(eq(userTable.id, user.id));
	} catch (error) {
		console.error('Error in handleSubscriptionCreated:', error);
		throw error;
	}
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
	const priceId = subscription.items.data[0].price.id;
	const customerId = subscription.customer as string;

	const customerData = await stripe.customers.retrieve(customerId);
	if (customerData.deleted === true) {
		console.log('Customer was deleted, skipping subscription creation');
		return;
	}

	if (!customerData.email) {
		console.log('No customer email found, skipping subscription creation');
		return;
	}

	const user = await getUserByEmail(customerData.email);

	await db
		.update(clientSubscriptionTable)
		.set({
			status: subscription.status,
			priceId: priceId,
			updatedAt: new Date()
		})
		.where(eq(clientSubscriptionTable.id, subscription.id));
	if (user) {
		await db
			.update(userTable)
			.set({ stripeCustomerId: customerId })
			.where(eq(userTable.id, user.id));
	}
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	await db
		.update(clientSubscriptionTable)
		.set({
			status: 'canceled',
			updatedAt: new Date()
		})
		.where(eq(clientSubscriptionTable.id, subscription.id));
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
	try {
		if (!session.customer_email) {
			console.log('No customer email in session');
			return;
		}

		if (!session.subscription) {
			console.log('No subscription in session');
			return;
		}

		const [subscription, user] = await Promise.all([
			stripe.subscriptions.retrieve(session.subscription as string),
			getUserByEmail(session.customer_email)
		]);

		if (!user) {
			console.log('No user found for email:', session.customer_email);
			return;
		}

		const client = await getClientProfilebyUserId(user.id);
		if (!client) {
			console.log('No client found for user:', user.id);
			return;
		}

		const customerId = subscription.customer as string;
		const priceId = subscription.items.data[0].price.id;

		// Use upsert instead of insert
		await db
			.insert(clientSubscriptionTable)
			.values({
				id: subscription.id,
				clientId: client.id,
				stripeCustomerId: customerId,
				status: subscription.status,
				priceId: priceId,
				createdAt: new Date(subscription.created * 1000),
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: clientSubscriptionTable.id,
				set: {
					status: subscription.status,
					priceId: priceId,
					updatedAt: new Date()
				}
			});
	} catch (error) {
		console.error('Error in handleCheckoutCompleted:', error);
		throw error;
	}
}
