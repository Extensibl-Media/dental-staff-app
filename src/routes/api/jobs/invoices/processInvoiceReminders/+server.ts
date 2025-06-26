import db from '$lib/server/database/drizzle';
import { eq, and, lt } from 'drizzle-orm';
import { invoiceTable } from '$lib/server/database/schemas/requisition';
import { json, type RequestHandler } from '@sveltejs/kit';
import crypto from 'crypto';
import { CRON_SECRET } from '$env/static/private';
import { EmailService } from '$lib/server/email/emailService';

export const GET: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('x-signature');
	const expectedSignature = crypto.createHmac('sha256', CRON_SECRET).digest('hex');
	const emailService = new EmailService();

	if (signature !== expectedSignature) {
		return new Response('Invalid signature', { status: 401 });
	}
	try {
		console.log('Starting processInvoiceRemindersJob');

		// Get all invoices that are past their due date and still open
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Normalize to start of the day
		console.log(`Today's date: ${today.toISOString()}`);

		// Query to find all overdue invoices
		const overdueInvoices = await db
			.select()
			.from(invoiceTable)
			.where(and(eq(invoiceTable.status, 'open'), lt(invoiceTable.dueDate, today)));

		console.log(`Found ${overdueInvoices.length} overdue invoices`);

		// Process each overdue invoice
		for (const invoice of overdueInvoices) {
			console.log(`Processing overdue invoice ID: ${invoice.id}`);
			// TODO: Implement logic to send email reminders
			// Example: await sendReminder(invoice);
			await emailService.sendOverdueInvoiceReminderEmail(invoice.customerEmail!, invoice);
			console.log(`Reminder sent for invoice ID: ${invoice.id}`);
		}

		return json({ success: true, count: overdueInvoices.length });
	} catch (error) {
		console.error('Error processing invoice reminders', error);
		return new Response('Internal Server Error', { status: 500 });
	}
};
