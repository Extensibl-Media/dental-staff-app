<!-- RecurrenceDrawer.svelte -->
<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { sineIn } from 'svelte/easing';
	import { Label } from '../ui/label';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import DatePicker from '../../../routes/(protected)/requisitions/[id]/date-picker.svelte';
	import { type DateValue, DateFormatter, getLocalTimeZone } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import type { RecurrenceDay, Requisition } from '$lib/server/database/schemas/requisition';
	import { superForm } from 'sveltekit-superforms/client';

	// Import the UTC utility functions with verification
	import {
		getUserTimezone,
		localTimeToUTC,
		utcToLocalTime,
		toUTCDateString,
		formatTimezoneName
	} from '$lib/_helpers/UTCTimezoneUtils';
	import { Plus, PlusIcon } from 'lucide-svelte';

	// Props
	export let requisition: Requisition;
	export let company;
	export let form; // From parent

	const { enhance } = superForm(form, {
		onSubmit(input) {
			console.log('Submitting form with:', input);
		},
		onUpdate({ form }) {
			// Reset form state after successful submission
			if (form.message === 'success') {
				multipleDays = false;
				useSameTimeForAllDates = false;
				selectedRawDate = undefined;
				selectedRawDateRange = undefined;
				sharedTimes = {
					dayStartTime: '',
					dayEndTime: '',
					lunchStartTime: '',
					lunchEndTime: ''
				};
			}
		},
		onError(err) {
			console.error('Form submission error:', err);
		}
	});

	// Form state
	let multipleDays = false;
	let useSameTimeForAllDates = false;
	let selectedRawDate: DateValue | undefined;
	let selectedRawDateRange: DateRange | undefined;
	let userTimezone = getUserTimezone(); // Using the utility function

	// Display for user notification
	let userTimezoneDisplay = formatTimezoneName(userTimezone);

	// Times in local timezone (what the user inputs)
	let sharedTimes = {
		dayStartTime: '',
		dayEndTime: '',
		lunchStartTime: '',
		lunchEndTime: ''
	};

	const df = new DateFormatter('en-US', { dateStyle: 'full' });

	// Alternative manual conversion method as fallback
	function manualTimeToUTC(timeString: string, dateString: string, timezone: string): string {
		if (!timeString || !dateString || !timezone) {
			return timeString;
		}

		try {
			// Create a Date object in the specified timezone
			const [year, month, day] = dateString.split('-').map(Number);
			const [hours, minutes] = timeString.split(':').map(Number);

			// Create date in UTC
			const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));

			// Adjust for timezone offset
			const tzOffset = new Date().getTimezoneOffset();
			date.setMinutes(date.getMinutes() - tzOffset);

			// Format as HH:MM
			const utcHours = date.getUTCHours().toString().padStart(2, '0');
			const utcMinutes = date.getUTCMinutes().toString().padStart(2, '0');

			return `${utcHours}:${utcMinutes}`;
		} catch (error) {
			console.error('Error in manual UTC conversion:', error);
			return timeString;
		}
	}

	// Derived values
	$: operatingHours = company.operatingHours;

	$: formattedDateRange =
		multipleDays && selectedRawDateRange?.start && selectedRawDateRange?.end
			? getDatesInRange(
					new Date(df.format(selectedRawDateRange.start.toDate(getLocalTimeZone()))),
					new Date(df.format(selectedRawDateRange.end.toDate(getLocalTimeZone())))
				)
			: selectedRawDate
				? [new Date(df.format(selectedRawDate.toDate(getLocalTimeZone())))]
				: [];

	$: filteredDates = formattedDateRange.filter((date) => !operatingHours[date.getDay()].isClosed);

	// Prepare local date times for display and user input
	$: selectedDateTimes = filteredDates.map((date) => {
		// Convert date to UTC date string format
		const utcDateString = toUTCDateString(date);

		return {
			date: utcDateString,
			localDate: date,
			times: useSameTimeForAllDates
				? { ...sharedTimes }
				: {
						dayStartTime: '',
						dayEndTime: '',
						lunchStartTime: '',
						lunchEndTime: ''
					}
		};
	});

	// Convert the user input (local times) to UTC times for database storage
	function convertToUTCTimes(entry) {
		// For each date, convert the local time inputs to UTC
		const utcDateString = entry.date;

		// In single-day mode, use sharedTimes directly
		const localTimes = !multipleDays && selectedRawDate ? sharedTimes : entry.times;

		// Ensure we have values to convert and use empty string as fallback
		const dayStartTime = localTimes.dayStartTime || '';
		const dayEndTime = localTimes.dayEndTime || '';
		const lunchStartTime = localTimes.lunchStartTime || '';
		const lunchEndTime = localTimes.lunchEndTime || '';

		// Try to use our imported function first, fall back to manual method if it fails
		let utcStartTime = '';
		let utcEndTime = '';
		let utcLunchStart = '';
		let utcLunchEnd = '';

		try {
			if (dayStartTime) {
				utcStartTime =
					typeof localTimeToUTC === 'function'
						? localTimeToUTC(dayStartTime, utcDateString, userTimezone)
						: manualTimeToUTC(dayStartTime, utcDateString, userTimezone);
			}

			if (dayEndTime) {
				utcEndTime =
					typeof localTimeToUTC === 'function'
						? localTimeToUTC(dayEndTime, utcDateString, userTimezone)
						: manualTimeToUTC(dayEndTime, utcDateString, userTimezone);
			}

			if (lunchStartTime) {
				utcLunchStart =
					typeof localTimeToUTC === 'function'
						? localTimeToUTC(lunchStartTime, utcDateString, userTimezone)
						: manualTimeToUTC(lunchStartTime, utcDateString, userTimezone);
			}

			if (lunchEndTime) {
				utcLunchEnd =
					typeof localTimeToUTC === 'function'
						? localTimeToUTC(lunchEndTime, utcDateString, userTimezone)
						: manualTimeToUTC(lunchEndTime, utcDateString, userTimezone);
			}
		} catch (err) {
			console.error('Error converting times to UTC:', err);
			// If conversion fails, use the local times
			utcStartTime = dayStartTime;
			utcEndTime = dayEndTime;
			utcLunchStart = lunchStartTime;
			utcLunchEnd = lunchEndTime;
		}

		// Create the result object with our converted times
		return {
			date: utcDateString,
			dayStartTime: utcStartTime || dayStartTime,
			dayEndTime: utcEndTime || dayEndTime,
			lunchStartTime: utcLunchStart || lunchStartTime,
			lunchEndTime: utcLunchEnd || lunchEndTime,
			requisitionId: requisition.id
		};
	}

	// Final value with UTC times for database storage
	$: finalDateValue = multipleDays
		? selectedDateTimes.map(convertToUTCTimes)
		: selectedDateTimes[0]
			? convertToUTCTimes(selectedDateTimes[0])
			: null;

	// Helper functions
	function getDatesInRange(start: Date, end: Date): Date[] {
		const dates = [];
		const current = new Date(start);
		while (current <= end) {
			dates.push(new Date(current));
			current.setDate(current.getDate() + 1);
		}
		return dates;
	}

	// For debugging - add some time placeholders
	function addDummyTimes() {
		sharedTimes = {
			dayStartTime: '09:00',
			dayEndTime: '17:00',
			lunchStartTime: '12:00',
			lunchEndTime: '13:00'
		};
	}
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<Button builders={[builder]} class="bg-blue-800 hover:bg-blue-900 mb-4">
		<PlusIcon class="w-4 h-4 mr-2" />
			Add Shifts
		</Button>
	</Sheet.Trigger>

	<Sheet.Content side="right" class="overflow-scroll flex flex-col">
		<Sheet.Header>
			<Sheet.Title>Add Workdays</Sheet.Title>
			<Sheet.Description>
				Add dates and times for workdays. Dates will respect your hours of operation and closed
				dates will be excluded.
				<small class="block mt-1 text-gray-500">
					All times will be shown in your local timezone ({userTimezoneDisplay}) but stored in UTC.
				</small>
			</Sheet.Description>
		</Sheet.Header>

		<div class="flex flex-col flex-1 mt-4 h-full">
			<div>
				<Checkbox bind:checked={multipleDays} name="multipleDays" />
				<Label for="multipleDays">Multiple Days?</Label>
			</div>

			{#if multipleDays}
				<RangeCalendar bind:value={selectedRawDateRange} class="rounded-md border w-fit" />
				{#if filteredDates.length}
					<div class="mt-4">
						<Checkbox bind:checked={useSameTimeForAllDates} name="useSameTime" />
						<Label for="useSameTime">Use same schedule for all days</Label>
					</div>

					{#if useSameTimeForAllDates}
						<p class="mt-4 font-semibold">All Dates:</p>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="shared-day-start">Day Start</Label>
								<Input id="shared-day-start" type="time" bind:value={sharedTimes.dayStartTime} />
							</div>
							<div class="space-y-2">
								<Label for="shared-day-end">Day End</Label>
								<Input id="shared-day-end" type="time" bind:value={sharedTimes.dayEndTime} />
							</div>
							<div class="space-y-2">
								<Label for="shared-lunch-start">Lunch Start</Label>
								<Input
									id="shared-lunch-start"
									type="time"
									bind:value={sharedTimes.lunchStartTime}
								/>
							</div>
							<div class="space-y-2">
								<Label for="shared-lunch-end">Lunch End</Label>
								<Input id="shared-lunch-end" type="time" bind:value={sharedTimes.lunchEndTime} />
							</div>
						</div>
					{:else}
						{#each selectedDateTimes as dateEntry}
							<div class="mt-4">
								<p class="font-semibold">Date: {dateEntry.localDate.toLocaleDateString()}</p>
								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label for={`day-start-${dateEntry.date}`}>Day Start</Label>
										<Input
											id={`day-start-${dateEntry.date}`}
											type="time"
											bind:value={dateEntry.times.dayStartTime}
										/>
									</div>
									<div class="space-y-2">
										<Label for={`day-end-${dateEntry.date}`}>Day End</Label>
										<Input
											id={`day-end-${dateEntry.date}`}
											type="time"
											bind:value={dateEntry.times.dayEndTime}
										/>
									</div>
									<div class="space-y-2">
										<Label for={`lunch-start-${dateEntry.date}`}>Lunch Start</Label>
										<Input
											id={`lunch-start-${dateEntry.date}`}
											type="time"
											bind:value={dateEntry.times.lunchStartTime}
										/>
									</div>
									<div class="space-y-2">
										<Label for={`lunch-end-${dateEntry.date}`}>Lunch End</Label>
										<Input
											id={`lunch-end-${dateEntry.date}`}
											type="time"
											bind:value={dateEntry.times.lunchEndTime}
										/>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				{/if}
			{:else}
				<DatePicker bind:value={selectedRawDate} />
				{#if selectedRawDate}
					<div class="grid grid-cols-2 gap-4 mt-4">
						<div class="space-y-2">
							<Label for="single-day-start">Day Start</Label>
							<Input id="single-day-start" type="time" bind:value={sharedTimes.dayStartTime} />
						</div>
						<div class="space-y-2">
							<Label for="single-day-end">Day End</Label>
							<Input id="single-day-end" type="time" bind:value={sharedTimes.dayEndTime} />
						</div>
						<div class="space-y-2">
							<Label for="single-lunch-start">Lunch Start</Label>
							<Input id="single-lunch-start" type="time" bind:value={sharedTimes.lunchStartTime} />
						</div>
						<div class="space-y-2">
							<Label for="single-lunch-end">Lunch End</Label>
							<Input id="single-lunch-end" type="time" bind:value={sharedTimes.lunchEndTime} />
						</div>
					</div>

					<!-- Optional debug helper button -->
					<div class="mt-4">
						<Button type="button" on:click={addDummyTimes} variant="secondary" size="sm">
							Add Default Times (9-5 with 12-1 lunch)
						</Button>
					</div>
				{/if}
			{/if}

			<form use:enhance method="POST" action="?/addRecurrenceDays" class="mt-12 pb-4">
				<input type="hidden" name="recurrenceDays" value={JSON.stringify(finalDateValue)} />

				<Sheet.Footer>
					<Sheet.Close asChild let:builder>
						<Button
							builders={[builder]}
							variant="destructive"
							type="button"
							on:click={() => {
								multipleDays = false;
								useSameTimeForAllDates = false;
								selectedRawDate = undefined;
								selectedRawDateRange = undefined;
								sharedTimes = {
									dayStartTime: '',
									dayEndTime: '',
									lunchStartTime: '',
									lunchEndTime: ''
								};
							}}
						>
							Cancel
						</Button>
					</Sheet.Close>
					<Button type="submit">Add Days</Button>
				</Sheet.Footer>
			</form>
		</div>
	</Sheet.Content>
</Sheet.Root>
