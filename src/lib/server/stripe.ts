import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

export const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function createStripeInvoice(
	stripeCustomerId: string,
	amountInCents: number,
	description?: string,
	metadata: Record<string, any> = {}
): Promise<Stripe.Invoice> {
	if (!stripeCustomerId) {
		throw new Error('Stripe customer ID is required');
	}

	try {
		const invoice = await stripe.invoices.create({
			customer: stripeCustomerId,
			collection_method: 'send_invoice',
			days_until_due: 1, // Set the due date to 30 days from now
			auto_advance: false, // Automatically finalize and send the invoice,
			metadata
		});

		await stripe.invoiceItems.create({
			invoice: invoice.id,
			customer: stripeCustomerId,
			amount: amountInCents,
			currency: 'usd',
			description: description || 'Invoice for services rendered'
		});

		// Finalize the invoice (makes it ready to be paid)
		const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

		// Optionally send the invoice to the customer's email
		await stripe.invoices.sendInvoice(finalizedInvoice.id);

		return finalizedInvoice;
	} catch (error) {
		console.error('Error creating Stripe invoice:', error);
		throw error;
	}
}
