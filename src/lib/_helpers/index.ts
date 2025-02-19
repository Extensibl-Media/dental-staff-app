import { formatDistance } from "date-fns";

// Format date helper functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

export const formatTicketDate = (dateString: string) => {
  return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
};

// Format currency helper function
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};