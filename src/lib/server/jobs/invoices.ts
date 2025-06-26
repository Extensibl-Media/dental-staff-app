import { scheduleJob, scheduledJobs, RecurrenceRule } from 'node-schedule';
import { API_URL, CRON_SECRET } from '$env/static/private';
import crypto from 'crypto';

export const processInvoiceRemindersJob = () => {
	const rule = new RecurrenceRule();
	rule.hour = 7; // 7 AM
	rule.minute = 0; // 0 minutes
	rule.second = 0; // 0 seconds
	rule.tz = 'America/New_York';

	return scheduleJob('processInvoiceReminders', rule, async function (fireDate) {
		try {
			const timestamp = fireDate.toISOString();
			const signature = crypto.createHmac('sha256', CRON_SECRET).digest('hex');

			console.log('Starting processInvoiceRemindersJob - ', fireDate);
			const request = await fetch(`${API_URL}/jobs/invoices/processInvoiceReminders`, {
				method: 'GET',
				headers: {
					'X-Timestamp': timestamp,
					'X-Signature': signature
				}
			});

			const result = await request.json();
			console.log(result);
		} catch (error) {
			console.error('Error processing invoice reminders', error);
		} finally {
			console.log('Finished processInvoiceRemindersJob - ', fireDate);
		}
	});
};
