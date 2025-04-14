import { formatDistance } from 'date-fns';

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

export function normalizeDate(date: string | Date): string {
	if (typeof date === 'string') {
		// If it's an ISO date string, extract just the YYYY-MM-DD part
		if (date.includes('T')) {
			return date.split('T')[0];
		}
		return date;
	}

	// If it's a Date object, convert to YYYY-MM-DD format
	return date.toISOString().split('T')[0];
}
