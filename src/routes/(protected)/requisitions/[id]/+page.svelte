<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button as FBButton, Dropdown, DropdownItem } from 'flowbite-svelte';
	import {
		Briefcase,
		CalendarClock,
		ChevronDown,
		MapPin,
		// Trash,
		CircleDollarSign
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type {
		NewRecurrenceDaySchema,
		// DeleteRecurrenceDaySchema,
		// EditRecurrenceDaySchema,
		ChangeStatusSchema
	} from '$lib/config/zod-schemas';
	import { format } from 'date-fns';
	import { cn } from '$lib/utils';
	// import { USER_ROLES } from '$lib/config/constants';
	import { Tabs, TabItem } from 'flowbite-svelte';
	import {
		getCoreRowModel,
		type ColumnDef,
		getSortedRowModel,
		type TableOptions,
		createSvelteTable,
		flexRender
	} from '@tanstack/svelte-table';
	import ViewLink from '$lib/components/tables/ViewLink.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import type { ApplicationResults, TimeSheetResults } from '$lib/server/database/queries/requisitions';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import type { RecurrenceDaySelect } from '$lib/server/database/schemas/requisition';
	import { formatTimeRange } from '$lib/_helpers/formatTimeRange';
	import WorkDayActionMenu from '$lib/components/dashboard/shared/workday-action-menu.svelte';
	import AddRecurrenceDaysDrawer from '$lib/components/drawers/addRecurrenceDaysDrawer.svelte';
	import TimesheetActionMenu from "./timesheet-table-actions.svelte"

	export let data: PageData;

	// $: user = data.user;
	$: company = data.company
	$: requisition = data.requisition;
	$: recurrenceDays = data.recurrenceDays;

	// $: {
	// 	console.log(recurrenceDays);
	// }
	// $: timesheets =  data.timesheets;
	$: applications = data.applications;
	$: status = requisition?.status;
	$: hasRequisitionRights = data.hasRequisitionRights;
	$: {
		applicationTableData = (applications as ApplicationResults[]) || [];
		applicationsOptions.update((o) => ({ ...o, data: applicationTableData }));
		recurrenceDaysTableData = (recurrenceDays as RecurrenceDaySelect[]) ?? [];
		recurrenceDaysOptions.update((o) => ({ ...o, data: recurrenceDaysTableData }));
	}

	let applicationTableData: ApplicationResults[] = [];
	let recurrenceDaysTableData: RecurrenceDaySelect[] = [];
	let timesheetTableData: TimeSheetResults[] = [];

	export let changeStatusForm: SuperValidated<ChangeStatusSchema>;
	export let recurrenceDayForm: SuperValidated<NewRecurrenceDaySchema>;
	// export let deleteRecurrenceDayForm: SuperValidated<DeleteRecurrenceDaySchema>;

	const recurrenceDaysColumns: ColumnDef<RecurrenceDaySelect>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.id,
			cell: (original) =>
				flexRender(ViewLink, {
					href: `/requisitions/${requisition.id}/workday/${original.getValue()}`
				})
		},
		{
			header: 'Date',
			accessorFn: (original) => new Date(original.date).toLocaleDateString("en-US", {timeZone: "UTC"})
		},
		{
			header: 'Working Hours',
			accessorFn: (original) =>
				formatTimeRange({ startTime: original.dayStartTime, endTime: original.dayEndTime })
		},
		{
			header: 'Status',
			accessorKey: 'status',
			cell: (original) =>
				flexRender(Badge, {
					value: original.getValue(),
					class: cn(
						original.getValue() === 'OPEN' && 'bg-blue-400 hover:bg-blue-500',
						original.getValue() === 'FILLED' && 'bg-green-400 hover:bg-bg-green-500',
						original.getValue() === 'UNFULFILLED' && 'bg-orange-400 hover:bg-bg-orange-500',
						original.getValue() === 'CANCELLED' && 'bg-red-500 hover:bg-red-600'
					)
				})
		},
		{
			header: 'Actions',
			id: 'actions',
			cell: () => flexRender(WorkDayActionMenu, { href: '' })
		}
	];

	const applicationColumns: ColumnDef<ApplicationResults>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.application.id,
			cell: (original) =>
				flexRender(ViewLink, {
					href: `/requisitions/${requisition.id}/application/${original.getValue()}`
				})
		},
		{
			header: 'Applicant Name',
			id: 'title',
			accessorFn: (original) => `${original.user.lastName}, ${original.user.firstName}`
		},
		{
			header: 'Date Submitted',
			id: 'createdAt',
			accessorFn: (original) => original.application.createdAt,
			cell: (original) => format(original.getValue() as Date, 'PPp')
		},
		{
			header: 'Status',
			id: 'status',
			accessorFn: (original) => original.application.status,
			cell: (original) =>
				flexRender(Badge, {
					value: original.getValue(),
					class: cn(
						original.getValue() === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
						original.getValue() === 'APPROVED' && 'bg-green-400 hover:bg-bg-green-500',
						original.getValue() === 'DENIED' && 'bg-red-500 hover:bg-red-600'
					)
				})
		}
	];

	const timesheetColumns: ColumnDef<TimeSheetResults>[] = [
    {
        header: '',
        id: 'id',
        accessorFn: (original) => original.timeSheet.id,
        cell: (original) =>
            flexRender(ViewLink, {
                href: `/timesheets/${original.getValue()}`
            })
    },
    {
        header: 'Candidate',
        id: 'employee',
        accessorFn: (original) => `${original.user.lastName}, ${original.user.firstName}`
    },
    {
        header: 'Week Beginning',
        id: 'weekBegin',
        accessorFn: (original) => new Date(original.timeSheet.weekBeginDate).toLocaleDateString("en-US", {timeZone: "UTC"})
    },
    {
        header: 'Hours Worked',
        id: 'hoursWorked',
        accessorFn: (original) => original.timeSheet.totalHoursWorked
    },
    {
        header: 'Hours Billed',
        id: 'hoursBilled',
        accessorFn: (original) => original.timeSheet.totalHoursBilled
    },
    {
        header: 'Status',
        id: 'status',
        accessorFn: (original) => original.timeSheet.validated ? 'Validated' : 'Pending',
        cell: (original) =>
            flexRender(Badge, {
                value: original.getValue(),
                class: cn(
                    original.getValue() === 'Pending' && 'bg-yellow-300 hover:bg-yellow-400',
                    original.getValue() === 'Validated' && 'bg-green-400 hover:bg-green-500'
                )
            })
    },
    {
            header: 'Actions',
            id: 'actions',
            cell: (info) => flexRender(TimesheetActionMenu, {
                timesheetId: info.row.original.timeSheet.id,
                isValidated: info.row.original.timeSheet.validated
            })
        }
];
	const applicationsOptions = writable<TableOptions<ApplicationResults>>({
		data: applicationTableData,
		columns: applicationColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});
	const recurrenceDaysOptions = writable<TableOptions<RecurrenceDaySelect>>({
		data: recurrenceDaysTableData,
		columns: recurrenceDaysColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});
	const timesheetOptions = writable<TableOptions<TimeSheetResults>>({
    data: timesheetTableData,
    columns: timesheetColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
});

	onMount(() => {
		applicationTableData = (applications as ApplicationResults[]) ?? [];
		applicationsOptions.update((o) => ({ ...o, data: applicationTableData }));
		recurrenceDaysTableData = (recurrenceDays as RecurrenceDaySelect[]) ?? [];
		recurrenceDaysOptions.update((o) => ({ ...o, data: recurrenceDaysTableData }));
  timesheetTableData = (data.timesheets as TimeSheetResults[]) ?? [];
    timesheetOptions.update((o) => ({ ...o, data: timesheetTableData }));
	});

	const applicationsTable = createSvelteTable(applicationsOptions);
	const recurrenceDaysTable = createSvelteTable(recurrenceDaysOptions);
	const timesheetTable = createSvelteTable(timesheetOptions);

	// const { enhance } = superForm(deleteRecurrenceDayForm);
	const { enhance: statusEnhance } = superForm(changeStatusForm);
</script>

<section class="grow h-screen overflow-y-auto p-6 grid grid-cols-3 gap-6">
	<div class="col-span-3 space-y-8">
		<div class="space-y-1">
			<div class="flex justify-between items-center">
				<img
					class="h-20 w-20 rounded-md mb-2"
					src={requisition?.company?.companyLogo}
					alt="company logo"
				/>
				<div class="space-y-2 hidden md:block">
                    <p class="text-sm font-semibold text-gray-500">Requisition Status</p>
                    <div class="flex flex-wrap gap-2 grow-0 items-center">
					<div
						class="py-2.5 px-3 text-sm w-fit border border-gray-300 bg-white rounded-md flex items-center gap-2"
					>
						<span
							class={cn(
								'h-3 w-3 rounded-full',
								// status === 'PENDING' && 'bg-yellow-300',
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
								<!-- <DropdownItem type="submit" name="status" value="PENDING">Pending</DropdownItem> -->
								<DropdownItem type="submit" name="status" value="OPEN">Open</DropdownItem>
								<DropdownItem type="submit" name="status" value="FILLED">Filled</DropdownItem>
								<DropdownItem type="submit" name="status" value="UNFULFILLED"
									>Unfulfilled</DropdownItem
								>
								<DropdownItem type="submit" name="status" value="CANCELED">Canceled</DropdownItem>
							</form>
						</Dropdown>
					{/if}
				</div>
				</div>
			</div>
			<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
				{requisition?.title}
			</h1>
			<p class="text-lg font-semibold text-gray-500">{requisition?.company.companyName}</p>
		</div>
		<div class="md:hidden space-y-2">
    		<p class="text-sm font-semibold text-gray-500">Requisition Status</p>

    		<div class="flex flex-wrap gap-2 grow-0 items-center">
    			<div
    				class="py-2.5 px-3 text-sm w-fit border border-gray-300 bg-white rounded-md flex items-center gap-2"
    			>
    				<span
    					class={cn(
    						'h-3 w-3 rounded-full',
    						// status === 'PENDING' && 'bg-yellow-300',
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
    						<!-- <DropdownItem type="submit" name="status" value="PENDING">Pending</DropdownItem> -->
    						<DropdownItem type="submit" name="status" value="OPEN">Open</DropdownItem>
    						<DropdownItem type="submit" name="status" value="FILLED">Filled</DropdownItem>
    						<DropdownItem type="submit" name="status" value="UNFULFILLED">Unfulfilled</DropdownItem>
    						<DropdownItem type="submit" name="status" value="CANCELED">Canceled</DropdownItem>
    					</form>
    				</Dropdown>
    			{/if}
    		</div>
		</div>
		<Tabs
			class=""
			tabStyle="underline"
			contentClass="py-0"
			inactiveClasses="p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50"
			activeClasses="border-b-2 border-b-blue-500 p-4 text-primary-600 bg-gray-100 rounded-t-lg"
		>
			<TabItem open title="Details">
				<div class="space-y-8">
					<div class="space-y-4">
						<p class="text-lg font-semibold">Details</p>
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
							<p>{requisition.permanentPosition ? 'Permanent' : 'Temporary'} Position</p>
						</div>
						<div class="flex items-center gap-2">
							<Briefcase class="shrink-0 text-gray-400" />
							<p>{requisition?.experienceLevel?.value} Experience</p>
						</div>
						<div class="flex items-center gap-2">
							<CircleDollarSign class="shrink-0 text-gray-400" />
							<p>${requisition?.hourlyRate}/hr</p>
						</div>
					</div>
					<div class="space-y-6">
						<div>
							<p class="text-lg font-semibold">Job Description</p>
							<div class="text-sm whitespace-pre-wrap">
								{requisition?.jobDescription}
							</div>
						</div>
						<div class="">
							<p class="text-lg font-semibold">Special Instructions</p>
							<p class="text-sm whitespace-pre-wrap">
								{requisition?.specialInstructions || 'None'}
							</p>
						</div>
					</div>
				</div>
			</TabItem>
			{#if requisition.permanentPosition}
				<TabItem title="Applications">
					<div class="column">
						<Table.Root class="table">
							<Table.TableHeader>
								{#each $applicationsTable.getHeaderGroups() as headerGroup}
									<Table.TableRow class="bg-white">
										{#each headerGroup.headers as header}
											<Table.TableHead
												class="hover:bg-white cursor-pointer relative"
												colspan={header.colSpan}
											>
												<svelte:component
													this={flexRender(header.column.columnDef.header, header.getContext())}
												/>
												<!-- {#if sortBy && sortOn && header.getContext().header.id === sortOn}
    										{#if sortBy === 'asc'}
    											<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
    										{:else}
    											<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
    										{/if}
    									{/if} -->
											</Table.TableHead>
										{/each}
									</Table.TableRow>
								{/each}
							</Table.TableHeader>
							<Table.TableBody>
								{#each $applicationsTable.getRowModel().rows as row}
									<Table.TableRow class="bg-gray-50">
										{#each row.getVisibleCells() as cell}
											<Table.TableCell>
												<svelte:component
													this={flexRender(cell.column.columnDef.cell, cell.getContext())}
												/>
											</Table.TableCell>
										{/each}
									</Table.TableRow>
								{/each}
							</Table.TableBody>
						</Table.Root>
					</div>
				</TabItem>
			{/if}
			{#if !requisition.permanentPosition}
			    <TabItem title="Timesheets">
                    <div class="column">
                        <Table.Root class="table">
                            <Table.TableHeader>
                                {#each $timesheetTable.getHeaderGroups() as headerGroup}
                                    <Table.TableRow class="bg-white">
                                        {#each headerGroup.headers as header}
                                            <Table.TableHead
                                                class="hover:bg-white cursor-pointer relative"
                                                colspan={header.colSpan}
                                            >
                                                <svelte:component
                                                    this={flexRender(header.column.columnDef.header, header.getContext())}
                                                />
                                            </Table.TableHead>
                                        {/each}
                                    </Table.TableRow>
                                {/each}
                            </Table.TableHeader>
                            <Table.TableBody>
                                {#each $timesheetTable.getRowModel().rows as row}
                                    <Table.TableRow class="bg-gray-50">
                                        {#each row.getVisibleCells() as cell}
                                            <Table.TableCell>
                                                <svelte:component
                                                    this={flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                />
                                            </Table.TableCell>
                                        {/each}
                                    </Table.TableRow>
                                {/each}
                            </Table.TableBody>
                        </Table.Root>
                    </div>
                </TabItem>
				<TabItem title="Work Days">
					{#if hasRequisitionRights}
						<div class="flex justify-end mb-8">
							<AddRecurrenceDaysDrawer form={recurrenceDayForm} {company} {requisition}/>
						</div>
					{/if}
					<div class="column">
						<Table.Root class="table">
							<Table.TableHeader>
								{#each $recurrenceDaysTable.getHeaderGroups() as headerGroup}
									<Table.TableRow class="bg-white">
										{#each headerGroup.headers as header}
											<Table.TableHead
												class="hover:bg-white cursor-pointer relative"
												colspan={header.colSpan}
											>
												<svelte:component
													this={flexRender(header.column.columnDef.header, header.getContext())}
												/>
												<!-- {#if sortBy && sortOn && header.getContext().header.id === sortOn}
										{#if sortBy === 'asc'}
											<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
										{:else}
											<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
										{/if}
									{/if} -->
											</Table.TableHead>
										{/each}
									</Table.TableRow>
								{/each}
							</Table.TableHeader>
							<Table.TableBody>
								{#each $recurrenceDaysTable.getRowModel().rows as row}
									<Table.TableRow class="bg-gray-50">
										{#each row.getVisibleCells() as cell}
											<Table.TableCell>
												<svelte:component
													this={flexRender(cell.column.columnDef.cell, cell.getContext())}
												/>
											</Table.TableCell>
										{/each}
									</Table.TableRow>
								{/each}
							</Table.TableBody>
						</Table.Root>
					</div>
				</TabItem>
			{/if}
		</Tabs>
	</div>
</section>
