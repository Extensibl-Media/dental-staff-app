export type CalendarEvent = {
	start: Date;
	end: Date;
	title: string;
	resourceIds?: string[];
	resourceId?: string;
	id: string;
	extendedProps: Record<string, any>;
};

export type PaginateOptions = {
	limit: number;
	offset: number;
	orderBy?: { column: string; direction: string };
}