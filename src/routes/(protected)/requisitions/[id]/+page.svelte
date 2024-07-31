<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button';
	import { Button as FBButton, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { Briefcase, CalendarClock, ChevronDown, MapPin, Trash } from 'lucide-svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	import AddRecurrenceDayDialog from '$lib/components/dialogs/addRecurrenceDayDialog.svelte';
	import EditRecurrenceDayDialog from '$lib/components/dialogs/editRecurrenceDayDialog.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type {
		NewRecurrenceDaySchema,
		DeleteRecurrenceDaySchema,
		EditRecurrenceDaySchema,
		ChangeStatusSchema
	} from '$lib/config/zod-schemas';
	import { format } from 'date-fns';
	import { cn } from '$lib/utils';
	import { USER_ROLES } from '$lib/config/constants';
	import { formatRecurrenceDayTimeString } from '$lib/_helpers/formatRecurrenceDayTimeString';

	$: user = data.user;
	$: requisition = data.requisition;
	$: recurrenceDays = data.recurrenceDays;
	$: status = requisition?.status;
	$: hasRequisitionRights =
		user.role === USER_ROLES.SUPERADMIN || requisition.company.client.user.id === user?.id;

	$: console.log(requisition);

	export let changeStatusForm: SuperValidated<ChangeStatusSchema>;
	export let recurrenceDayForm: SuperValidated<NewRecurrenceDaySchema>;
	export let editecurrenceDayForm: SuperValidated<EditRecurrenceDaySchema>;
	export let deleteRecurrenceDayForm: SuperValidated<DeleteRecurrenceDaySchema>;

	const { enhance } = superForm(deleteRecurrenceDayForm);
	const { enhance: statusEnhance } = superForm(changeStatusForm);
</script>

<section class="grow h-screen overflow-y-auto p-6 grid grid-cols-3 gap-6">
	<div class="col-span-3 lg:col-span-2 space-y-8">
		<div class="space-y-1">
			<img
				class="h-20 w-20 rounded-md mb-2"
				src={requisition?.company?.companyLogo}
				alt="company logo"
			/>
			<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
				{requisition?.title}
			</h1>
			<p class="text-lg font-semibold text-gray-500">{requisition?.company.companyName}</p>
		</div>
		<div class="flex flex-wrap gap-2 grow-0 items-center">
			<div
				class="py-2.5 px-3 text-sm w-fit border border-gray-300 bg-white rounded-md flex items-center gap-2"
			>
				<span
					class={cn(
						'h-3 w-3 rounded-full',
						status === 'PENDING' && 'bg-yellow-300',
						status === 'OPEN' && 'bg-blue-500',
						status === 'FILLED' && 'bg-green-400',
						status === 'UNFULFILLED' && 'bg-orange-400',
						status === 'CANCELED' && 'bg-red-500'
					)}
				></span>
				{requisition?.status}
			</div>
			{#if hasRequisitionRights}
				<FBButton class=" text-black bg-white border border-gray-300"
					>Update Status<ChevronDown class="w-6 h-6 ms-2 text-black" /></FBButton
				>
				<Dropdown class="w-40">
					<form use:statusEnhance method="POST" action="?/changeStatus">
						<input type="hidden" name="requisitionId" value={requisition?.id} />
						<DropdownItem type="submit" name="status" value="PENDING">Pending</DropdownItem>
						<DropdownItem type="submit" name="status" value="OPEN">Open</DropdownItem>
						<DropdownItem type="submit" name="status" value="FILLED">Filled</DropdownItem>
						<DropdownItem type="submit" name="status" value="UNFULFILLED">Unfulfilled</DropdownItem>
						<DropdownItem type="submit" name="status" value="CANCELED">Canceled</DropdownItem>
					</form>
				</Dropdown>
			{/if}
		</div>
		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<MapPin class="shrink-0 text-gray-400" />
				<p>
					{requisition?.location?.streetOne}
					{requisition?.location?.streetTwo}
					{requisition?.location?.city},
					{requisition?.location?.state}
					{requisition?.location?.zipcode}
				</p>
			</div>
			<div class="flex items-center gap-2">
				<CalendarClock class="shrink-0 text-gray-400" />
				<p>Temporary Position</p>
			</div>
			<div class="flex items-center gap-2">
				<Briefcase class="shrink-0 text-gray-400" />
				<p>{requisition?.experienceLevel?.value} Experience</p>
			</div>
		</div>
		<div class="space-y-2">
			<p class="text-lg font-semibold">Job Description</p>
			<div class="text-sm whitespace-pre-wrap">
				{@html requisition?.jobDescription}
			</div>
			<div class="">
				<p class="text-lg font-semibold">Special Instructions</p>
				<p class="text-sm">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
					ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
					ullamco laboris nisi ut aliquip ex ea commodo consequat.
				</p>
			</div>
		</div>
	</div>
	<div class="col-span-3 lg:col-span-1">
		<div class="rounded-md border border-gray-300 p-4 flex flex-col gap-4">
			<p class="text-2xl font-bold">Recurrence Days</p>
			<div class="flex flex-col gap-12 overflow-y-auto">
				{#if !recurrenceDays.length}
					<p>No Dates Set</p>
				{/if}
				{#if hasRequisitionRights}
					<AddRecurrenceDayDialog form={recurrenceDayForm} requisitionId={requisition?.id} />
				{/if}

				{#each recurrenceDays as recurrenceDay (recurrenceDay.id)}
					<div class="space-y-2">
						<div class="flex justify-between gap-2">
							<p class="text-xl font-semibold">
								{format(new Date(recurrenceDay.date.replace(/-/g, '/')), 'PP')}
							</p>
							<div class="flex gap-2">
								<EditRecurrenceDayDialog form={editecurrenceDayForm} {recurrenceDay} />
								<form use:enhance method="POST" action="?/deleteRecurrenceDay">
									<input type="hidden" bind:value={recurrenceDay.id} name="id" />
									<Button type="submit" class="bg-red-500 hover:bg-red-400 p-2 h-8 w-8"
										><Trash class="text-white" size={12} /></Button
									>
								</form>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-2">
							<div class="col-span-1">
								<p class="text-xs font-semibold">Day Start Time</p>
								<p class="text-base font-light">
									{formatRecurrenceDayTimeString(recurrenceDay.dayStartTime, recurrenceDay.date)}
								</p>
							</div>
							<div class="col-span-1">
								<p class="text-xs font-semibold">Day End Time</p>
								<p class="text-base font-light">
									{formatRecurrenceDayTimeString(recurrenceDay.dayEndTime, recurrenceDay.date)}
								</p>
							</div>
							<div class="col-span-1">
								<p class="text-xs font-semibold">Lunch Start Time</p>
								<p class="text-base font-light">
									{formatRecurrenceDayTimeString(recurrenceDay.lunchStartTime, recurrenceDay.date)}
								</p>
							</div>
							<div class="col-span-1">
								<p class="text-xs font-semibold">Lunch End Time</p>
								<p class="text-base font-light">
									{formatRecurrenceDayTimeString(recurrenceDay.lunchEndTime, recurrenceDay.date)}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
