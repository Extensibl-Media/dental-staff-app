<script lang="ts">
	import Calendar from '@event-calendar/core';
	import TimeGrid from '@event-calendar/time-grid';
	import DayGrid from '@event-calendar/day-grid';
	import '@event-calendar/core/index.css';
	import type { CalendarEvent } from '$lib/types';

	export let events: any;
	export let selectEvent: (event: CalendarEvent) => void;

	let plugins = [DayGrid, TimeGrid];
	let options = {
		view: 'dayGridMonth',
		headerToolbar: {
			start: 'prev,next today',
			center: 'title',
			end: 'dayGridMonth,timeGridWeek,timeGridDay'
		},
		events,
		views: {
			timeGridWeek: { pointer: true },
			resourceTimeGridWeek: { pointer: true }
		},
		// dayMaxEvents: true,
		nowIndicator: true,
		selectable: true,
		displayEventEnd: true,
		eventClick: (item: any) => {
			console.log(item.event);
			selectEvent(item.event);
		}
	};
</script>

<Calendar {plugins} {options} />
