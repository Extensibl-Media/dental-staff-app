import db from '$lib/server/database/drizzle';
import { eq, and, inArray, sql, lt } from 'drizzle-orm';
import { invoiceTable } from '$lib/server/database/schemas/requisition';
import { json, type RequestHandler } from '@sveltejs/kit';
import crypto from 'crypto';
import { CRON_SECRET } from '$env/static/private';

export const GET: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('x-signature');
	const expectedSignature = crypto.createHmac('sha256', CRON_SECRET).digest('hex');
	if (signature !== expectedSignature) {
		return new Response('Invalid signature', { status: 401 });
	}
	try {
		console.log('Starting processInvoiceRemindersJob');

		// Get all invoices that are due today
		const today = new Date();

		const invoicesDueToday = await db
			.select()
			.from(invoiceTable)
			.where(and(eq(invoiceTable.status, 'open'), lt(invoiceTable.dueDate, today)));

		console.log(`Found ${invoicesDueToday.length} invoices due today`);

		// Process each invoice
		for (const invoice of invoicesDueToday) {
			// Here you would implement your logic to send reminders
			console.log(`Processing invoice ID: ${invoice.id}`);
			// Example: await sendReminder(invoice);
			// TODO: Send Email notification to client reminding them of unpaid invoice.
		}

		return json({ success: true, count: invoicesDueToday.length });
	} catch (error) {
		console.error('Error processing invoice reminders', error);
		return new Response('Internal Server Error', { status: 500 });
	}
};
