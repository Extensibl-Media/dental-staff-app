<script lang="ts">
	import * as Dialog from '../ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import { Edit, Loader2, Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { type EditRecurrenceDaySchema } from '$lib/config/zod-schemas';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms/client';
	import Input from '../ui/input/input.svelte';
	import Label from '../ui/label/label.svelte';
	import { getTimezoneOffset } from 'date-fns-tz';

	export let recurrenceDay: {
		requisitionId: number | null;
		date: string;
		dayStartTime: string;
		dayEndTime: string;
		lunchStartTime: string;
		lunchEndTime: string;
		id: string;
		createdAt: Date;
		updatedAt: Date;
	};

	export let form: SuperValidated<EditRecurrenceDaySchema>;
	let userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	$: timezoneOffsetString = getTimezoneOffset(userTimeZone) / 60 / 60 / 1000;

	const { form: formObj, enhance } = superForm(form);
</script>

<Dialog.Root>
	<Dialog.Trigger
		><Button class="bg-gray-200 hover:bg-gray-300 p-2 h-8 w-8"
			><Edit class="text-black h-fit" size={16} /></Button
		></Dialog.Trigger
	>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit Recurrence Day</Dialog.Title>
		</Dialog.Header>
		<form use:enhance method="POST" action="?/editRecurrenceDay">
			<Label for="date">Date</Label>
			<Input type="date" name="date" bind:value={recurrenceDay.date} />
			<div class="grid grid-cols-2 gap-8">
				<div class="col-span-2 md:col-span-1">
					<Label for="date">Day Start Time</Label>
					<Input type="time" name="dayStartTime" required bind:value={recurrenceDay.dayStartTime} />
				</div>
				<div class="col-span-2 md:col-span-1">
					<Label for="date">Day End Time</Label>
					<Input type="time" name="dayEndTime" required bind:value={recurrenceDay.dayEndTime} />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-8">
				<div class="col-span-2 md:col-span-1">
					<Label for="date">Lunch Start Time</Label>
					<Input
						type="time"
						name="lunchStartTime"
						required
						bind:value={recurrenceDay.lunchStartTime}
					/>
				</div>
				<div class="col-span-2 md:col-span-1">
					<Label for="date">Lunch End Time</Label>
					<Input type="time" name="lunchEndTime" required bind:value={recurrenceDay.lunchEndTime} />
				</div>
			</div>
			<input type="hidden" bind:value={recurrenceDay.requisitionId} name="requisitionId" />
			<input type="hidden" bind:value={recurrenceDay.id} name="id" />
			<input type="hidden" bind:value={timezoneOffsetString} name="timezoneOffset" />
			<Dialog.Footer>
				<Button type="submit" class="ml-auto mt-4">Submit</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
