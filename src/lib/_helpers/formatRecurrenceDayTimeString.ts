import moment from 'moment';

export const formatRecurrenceDayTimeString = (timeString: string, date: string) => {
	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const time = moment.tz(`${date} ${timeString}`, 'YYYY-MM-DD HH:mm:ssZ', userTimeZone);
	const formatted = time.format('hh:mm A');

	return formatted;
};
