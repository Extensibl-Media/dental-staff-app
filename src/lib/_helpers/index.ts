import { format, formatDistance, isValid, parseISO, startOfWeek } from 'date-fns';

// Format date helper functions
export const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString();
};

export const formatTicketDate = (dateString: string) => {
	console.log({ dateString });
	return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
};

// Format currency helper function
export const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(amount);
};

/**
 * Normalizes a date to YYYY-MM-DD format for consistent comparison
 * Handles both string dates and ISO timestamps
 */
export function normalizeDate(date: string | Date | null | undefined): string {
	if (!date) return '';

	try {
		let dateObj: Date;

		if (typeof date === 'string') {
			// Handle ISO date strings like "2025-05-22"
			if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
				return date; // Already in YYYY-MM-DD format
			}

			// Handle ISO timestamps like "2025-05-22T15:00:00.000Z"
			if (date.includes('T') || date.includes('Z')) {
				dateObj = new Date(date);
			} else {
				// Try parseISO first, then fallback to Date constructor
				dateObj = parseISO(date);
				if (!isValid(dateObj)) {
					dateObj = new Date(date);
				}
			}
		} else {
			dateObj = date;
		}

		if (!isValid(dateObj)) {
			console.warn('Invalid date in normalizeDate:', date);
			return '';
		}

		return format(dateObj, 'yyyy-MM-dd');
	} catch (error) {
		console.error('Error normalizing date:', error, date);
		return '';
	}
}

// AIzaSyAZhgbiPAhVE61G6O4xtzcsqpZq3mldJYc

// Function to get the correct weekBeginDate regardless of timezone
export function getConsistentWeekBeginDate(dateString: Date | string) {
	// Parse the ISO string but force it to be interpreted at local timezone midnight
	const localDate = parseISO(`${dateString}T00:00:00`);

	// Get the start of the week (Sunday by default in date-fns)
	const weekBegin = startOfWeek(localDate);

	// Format back to YYYY-MM-DD format
	return format(weekBegin, 'yyyy-MM-dd');
}

export const getDayName = (dayIndex: number): string => {
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	return days[dayIndex];
};

export function getMiles(meters: number) {
	return meters * 0.000621371192;
}

export function getMeters(miles: number) {
	return miles * 1609.344;
}
