import { scheduleJob, scheduledJobs, RecurrenceRule } from 'node-schedule';
import { API_URL, CRON_SECRET } from '$env/static/private';
import crypto from 'crypto';
/**
 * Process Past Recurrence Days for Requisitions
 *
 * This job runs at 12:00 AM EST
 */
export const processPastRecurrenceDaysJob = () => {
	const rule = new RecurrenceRule();
	rule.hour = 0;
	rule.minute = 0;
	rule.second = 0;
	rule.tz = 'America/New_York';

	return scheduleJob('processPastRecurrenceDays', rule, async function (fireDate) {
		try {
			const timestamp = fireDate.toISOString();
			const signature = crypto.createHmac('sha256', CRON_SECRET).digest('hex');

			console.log('Starting processPastRecurrenceDaysJob - ', fireDate);
			const request = await fetch(`${API_URL}/jobs/requisitions/processPastRecurrenceDays`, {
				method: 'GET',
				headers: {
					'X-Timestamp': timestamp,
					'X-Signature': signature
				}
			});

			const result = await request.json();
			console.log(result);
		} catch (error) {
			console.error('Error processing past recurrence days', error);
		} finally {
			console.log('Finished processPastRecurrenceDaysJob - ', fireDate);
		}
	});
};

/**
 * Process outdated requisitions that are still OPEN
 *
 * This job runs at 1:00 AM EST
 */
export const processOutdatedRequisitionsJob = () => {
	const rule = new RecurrenceRule();
	rule.hour = 1;
	rule.minute = 0;
	rule.second = 0;
	rule.tz = 'America/New_York';

	return scheduleJob('processOutdatedRequisitions', rule, async function (fireDate) {
		const timestamp = fireDate.toISOString();
		const signature = crypto.createHmac('sha256', CRON_SECRET).digest('hex');

		try {
			console.log(`Starting processPastRequisitionsJob - ${fireDate}`);

			// Call your API endpoint
			const result = await fetch(`${API_URL}/jobs/requisitions/processPastRequisitions`, {
				method: 'GET',
				headers: {
					'X-Timestamp': timestamp,
					'X-Signature': signature
				}
			});

			if (!result.ok) {
				const errorText = await result.text();
				throw new Error(`API returned error status ${result.status}: ${errorText}`);
			}

			const data = await result.json();
			console.log(
				`Processed ${data.updated || 0} outdated requisitions (${data.cancelled || 0} cancelled, ${data.unfulfilled || 0} unfulfilled)`
			);
		} catch (error) {
			console.error('Error closing outdated requisitions:', error);
		} finally {
			console.log(`Finished processPastRequisitionsJob - ${fireDate}`);
		}
	});
};

/**
 * Process sending out 48hr reminder for workdays to candidate
 *
 * This job runs at 6:00 AM EST
 */
export const processWorkday48HrReminderJob = () => {
	const rule = new RecurrenceRule();
	rule.hour = 6;
	rule.minute = 0;
	rule.second = 0;
	rule.tz = 'America/New_York';

	return scheduleJob('processWorkday48HrReminder', rule, async function (fireDate) {
		const timestamp = fireDate.toISOString();
		const signature = crypto.createHmac('sha256', CRON_SECRET).digest('hex');

		try {
			console.log(`Starting processWorkday48HrReminderJob - ${fireDate}`);

			// Call your API endpoint
			const result = await fetch(`${API_URL}/jobs/requisitions/processWorkday48HrReminder`, {
				method: 'GET',
				headers: {
					'X-Timestamp': timestamp,
					'X-Signature': signature
				}
			});

			if (!result.ok) {
				const errorText = await result.text();
				throw new Error(`API returned error status ${result.status}: ${errorText}`);
			}

			const data = await result.json();
			console.log(`Processed ${data.sent || 0} workday reminders`);
		} catch (error) {
			console.error('Error sending workday reminders:', error);
		} finally {
			console.log(`Finished processWorkday48HrReminderJob - ${fireDate}`);
		}
	});
};
