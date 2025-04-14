import type { RecurrenceDay, Requisition } from '$lib/server/database/schemas/requisition';
import { format, parseISO } from 'date-fns';

export function _pad(num: number) {
	const norm = Math.floor(Math.abs(num));
	return (norm < 10 ? '0' : '') + norm;
}

const requisitionStatusColorEnum = {
	PENDING: '#fde047',
	OPEN: '#3b82f6',
	FILLED: '#31c48d',
	UNFULFILLED: '#ff8a4c',
	CANCELED: '#f05252'
} as const;

export function convertRecurrenceDayToEvent(
	recurrenceDay: RecurrenceDay,
	requisition: Requisition
) {
	const { date, dayStartTime, dayEndTime, status } = recurrenceDay;
	const eventDate = new Date(date);
	const isoDate = parseISO(date);
	console.log({ date, eventDate });
	const dateString = format(isoDate, 'yyyy-MM-dd');

	return {
		start: `${dateString} ${dayStartTime}`,
		end: `${dateString} ${dayEndTime}`,
		resourceIds: [requisition.id, recurrenceDay.id],
		title: requisition.title,
		data: requisition,
		color: status ? requisitionStatusColorEnum[status] : '#b3b3b3',
		extendedProps: {
			type: 'RECURRENCE_DAY',
			requisition: { ...requisition },
			recurrenceDay: { ...recurrenceDay }
		}
	};
}
