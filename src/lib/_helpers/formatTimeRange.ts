/* eslint-disable @typescript-eslint/no-unused-vars */
type TimezoneMapping = {
	[key: string]: string;
};

const TIMEZONE_ABBR: TimezoneMapping = {
	'-07': 'MST',
	'-06': 'CST',
	'-05': 'EST',
	'-08': 'PST',
	'-04': 'EDT'
	// Add more as needed
};

interface TimeRange {
	startTime: string; // Format: "HH:MM:SS±TZ"
	endTime: string; // Format: "HH:MM:SS±TZ"
}

export function formatTimeRange({ startTime, endTime }: TimeRange): string {
	const timeRegex = /^(\d{2}):(\d{2}):(\d{2})([-+]\d{2})$/;

	const startMatch = startTime.match(timeRegex);
	const endMatch = endTime.match(timeRegex);

	if (!startMatch || !endMatch) {
		throw new Error('Invalid time format. Expected "HH:MM:SS±TZ"');
	}

	const [_, startHour, startMin] = startMatch;
	const [__, endHour, endMin, ___, offset] = endMatch;

	const format12Hour = (hour: string, min: string): string => {
		const h = parseInt(hour) % 12 || 12;
		const ampm = parseInt(hour) >= 12 ? 'PM' : 'AM';
		return `${h}:${min.padStart(2, '0')} ${ampm}`;
	};

	const tzAbbr = TIMEZONE_ABBR[offset] || `UTC${offset}`;

	console.log({ startMatch, endMatch, offset });
	return `${format12Hour(startHour, startMin)} - ${format12Hour(endHour, endMin)} (${tzAbbr})`;
}
