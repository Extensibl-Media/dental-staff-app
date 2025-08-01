<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button as FBButton, Dropdown, DropdownItem, Card } from 'flowbite-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		Briefcase,
		CalendarClock,
		ChevronDown,
		MapPin,
		// Trash,
		CircleDollarSign,
		AlertCircle,
		Building,
		ClipboardList,
		Plus,
		Users,
		Loader2
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type {
		NewRecurrenceDaySchema,
		// DeleteRecurrenceDaySchema,
		// EditRecurrenceDaySchema,
		ChangeStatusSchema
	} from '$lib/config/zod-schemas';
	import { format, parse } from 'date-fns';
	import { cn } from '$lib/utils';
	// import { USER_ROLES } from '$lib/config/constants';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
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
	import type {
		ApplicationResults,
		TimeSheetResults
	} from '$lib/server/database/queries/requisitions';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import type { RecurrenceDaySelect } from '$lib/server/database/schemas/requisition';
	import { formatTimeRange } from '$lib/_helpers/formatTimeRange';
	import WorkDayActionMenu from '$lib/components/dashboard/shared/workday-action-menu.svelte';
	import AddRecurrenceDaysDrawer from '$lib/components/drawers/addRecurrenceDaysDrawer.svelte';
	import TimesheetActionMenu from './timesheet-table-actions.svelte';
	import { CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem
	} from '$lib/components/ui/dropdown-menu';
	import TableBody from '$lib/components/ui/table/table-body.svelte';
	import TableCell from '$lib/components/ui/table/table-cell.svelte';
	import TableHead from '$lib/components/ui/table/table-head.svelte';
	import TableHeader from '$lib/components/ui/table/table-header.svelte';
	import TableRow from '$lib/components/ui/table/table-row.svelte';

	export let data: PageData;

	$: user = data.user;
	$: company = data.company;
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
			accessorFn: (original) =>
				new Date(original.date).toLocaleDateString('en-US', { timeZone: 'UTC' })
		},
		{
			header: 'Working Hours',
			accessorFn: (original) =>
				`${format(original.dayStart, 'h:mm a')} - ${format(original.dayEnd, 'h:mm a')}`
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
			accessorFn: (original) =>
				format(parse(original.timeSheet.weekBeginDate, 'yyyy-MM-dd', new Date()), 'PP')
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
			accessorFn: (original) => original.timeSheet.status,
			cell: (original) =>
				flexRender(Badge, {
					value: original.getValue(),
					class: cn(
						original.getValue() === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
						original.getValue() === 'APPROVED' && 'bg-green-400 hover:bg-green-500',
						original.getValue() === 'DISCREPANCY' && 'bg-red-500 hover:bg-red-600'
					)
				})
		},
		{
			header: 'Actions',
			id: 'actions',
			cell: (info) =>
				flexRender(TimesheetActionMenu, {
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
	const { enhance: statusEnhance, submitting: statusSubmitting } = superForm(changeStatusForm);
</script>

{#if requisition}
	<section class="container mx-auto px-4 py-6">
		<div class="flex flex-col gap-6">
			<!-- Header with requisition info -->
			<div class="bg-white rounded-lg shadow-sm p-6">
				<div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
					<!-- Company Logo -->
					<div class="h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden border bg-white">
						{#if company?.companyLogo}
							<img
								src={company.companyLogo}
								alt="{company.companyName} logo"
								class="h-full w-full object-contain"
							/>
						{:else}
							<div class="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
								<Building class="h-12 w-12" />
							</div>
						{/if}
					</div>

					<!-- Requisition Information -->
					<div class="flex-1">
						<div class="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
							<div>
								<h1 class="text-3xl md:text-4xl font-bold">
									{requisition.title}
								</h1>
								<p class="text-lg font-medium text-gray-700 mt-1">{company?.companyName}</p>
							</div>

							<!-- Status Section (Desktop) -->
							<div class="hidden md:block">
								<div class="flex flex-col flex-wrap gap-2">
									{#if hasRequisitionRights}
										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button variant="outline" size="sm" class="gap-1 ">
													{#if $statusSubmitting}
														Updating...
														<Loader2 class="mr-2 h-4 w-4 animate-spin" />
													{:else}
														Update Status
													{/if}
													<ChevronDown class="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<form method="POST" action="?/changeStatus" use:statusEnhance>
													<input type="hidden" name="requisitionId" value={requisition.id} />
													<DropdownMenuItem>
														<button
															type="submit"
															name="status"
															value="OPEN"
															class="w-full text-left"
														>
															Open
														</button>
													</DropdownMenuItem>
													<DropdownMenuItem>
														<button
															type="submit"
															name="status"
															value="FILLED"
															class="w-full text-left"
														>
															Filled
														</button>
													</DropdownMenuItem>
													<DropdownMenuItem>
														<button
															type="submit"
															name="status"
															value="UNFULFILLED"
															class="w-full text-left"
														>
															Unfulfilled
														</button>
													</DropdownMenuItem>
													<DropdownMenuItem>
														<button
															type="submit"
															name="status"
															value="CANCELED"
															class="w-full text-left"
														>
															Canceled
														</button>
													</DropdownMenuItem>
												</form>
											</DropdownMenuContent>
										</DropdownMenu>
									{/if}
									<div
										class="py-2.5 px-3 text-sm font-medium border border-gray-300 rounded-md flex items-center gap-2 bg-white"
									>
										<span
											class={cn(
												'h-3 w-3 rounded-full',
												status === 'OPEN' && 'bg-blue-500',
												status === 'FILLED' && 'bg-green-400',
												status === 'UNFULFILLED' && 'bg-orange-400',
												status === 'CANCELED' && 'bg-red-500'
											)}
										></span>
										{requisition.status}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Status Section (Mobile) -->
				<div class="md:hidden mt-4">
					<div class="flex flex-wrap gap-2 items-center">
						<div
							class="py-2.5 px-3 text-sm font-medium border border-gray-300 rounded-md flex items-center gap-2 bg-white"
						>
							<span
								class={cn(
									'h-3 w-3 rounded-full',
									status === 'OPEN' && 'bg-blue-500',
									status === 'FILLED' && 'bg-green-400',
									status === 'UNFULFILLED' && 'bg-orange-400',
									status === 'CANCELED' && 'bg-red-500'
								)}
							></span>
							{requisition.status}
						</div>

						{#if hasRequisitionRights}
							<DropdownMenu>
								<DropdownMenuTrigger>
									<Button variant="outline" size="sm" class="gap-1">
										Update Status
										<ChevronDown class="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<form method="POST" action="?/changeStatus" use:statusEnhance>
										<input type="hidden" name="requisitionId" value={requisition.id} />
										<DropdownMenuItem asChild>
											<button type="submit" name="status" value="OPEN" class="w-full text-left">
												Open
											</button>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<button type="submit" name="status" value="FILLED" class="w-full text-left">
												Filled
											</button>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<button
												type="submit"
												name="status"
												value="UNFULFILLED"
												class="w-full text-left"
											>
												Unfulfilled
											</button>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<button type="submit" name="status" value="CANCELED" class="w-full text-left">
												Canceled
											</button>
										</DropdownMenuItem>
									</form>
								</DropdownMenuContent>
							</DropdownMenu>
						{/if}
					</div>
				</div>

				<!-- Key Details Summary -->
				<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-blue-50 rounded-md">
							<MapPin class="h-5 w-5 text-blue-500" />
						</div>
						<div>
							<p class="text-gray-500 font-medium">Location</p>
							<p>{requisition.location?.city}, {requisition.location?.state}</p>
						</div>
					</div>

					<div class="flex items-center gap-3">
						<div class="p-2 bg-purple-50 rounded-md">
							<CalendarClock class="h-5 w-5 text-purple-500" />
						</div>
						<div>
							<p class="text-gray-500 font-medium">Position Type</p>
							<p>{requisition.permanentPosition ? 'Permanent' : 'Temporary'}</p>
						</div>
					</div>

					<div class="flex items-center gap-3">
						<div class="p-2 bg-amber-50 rounded-md">
							<Briefcase class="h-5 w-5 text-amber-500" />
						</div>
						<div>
							<p class="text-gray-500 font-medium">Experience</p>
							<p>{requisition.experienceLevel?.value}</p>
						</div>
					</div>

					<div class="flex items-center gap-3">
						<div class="p-2 bg-green-50 rounded-md">
							<CircleDollarSign class="h-5 w-5 text-green-500" />
						</div>
						<div>
							<p class="text-gray-500 font-medium">Hourly Rate</p>
							<p>${requisition.hourlyRate}/hr</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Tabs section -->
			<Tabs class="w-full">
				<TabsList class="grid grid-cols-1 md:grid-cols-3 lg:w-fit bg-muted w-full h-fit">
					<TabsTrigger value="details" class="data-[state=active]:bg-background">
						Details
					</TabsTrigger>

					{#if requisition.permanentPosition}
						<TabsTrigger value="applications" class="data-[state=active]:bg-background">
							Applications
						</TabsTrigger>
					{:else}
						<TabsTrigger value="workdays" class="data-[state=active]:bg-background">
							Work Days
						</TabsTrigger>
						<TabsTrigger value="timesheets" class="data-[state=active]:bg-background">
							Timesheets
						</TabsTrigger>
					{/if}
				</TabsList>

				<!-- Details Tab -->
				<TabsContent value="details" class="mt-6">
					<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<!-- Job Description -->
						<div class="col-span-2 space-y-6">
							<Card class="max-w-none">
								<CardHeader>
									<CardTitle>Job Description</CardTitle>
								</CardHeader>
								<CardContent>
									<div class="prose max-w-none">
										<div class="whitespace-pre-wrap">
											{requisition.jobDescription}
										</div>
									</div>
								</CardContent>
							</Card>

							{#if requisition.specialInstructions}
								<Card class="max-w-none">
									<CardHeader>
										<CardTitle>Special Instructions</CardTitle>
									</CardHeader>
									<CardContent>
										<div class="prose max-w-none">
											<div class="whitespace-pre-wrap">
												{requisition.specialInstructions}
											</div>
										</div>
									</CardContent>
								</Card>
							{/if}
						</div>

						<!-- Details Sidebar -->
						<div class="col-span-1 space-y-6">
							<!-- Location Details -->
							<Card class="max-w-none">
								<CardHeader class="pb-3">
									<CardTitle class="text-lg flex items-center gap-2">
										<MapPin class="h-5 w-5 text-gray-500" />
										Location Details
									</CardTitle>
								</CardHeader>
								<CardContent>
									<address class="not-italic">
										{requisition.location?.streetOne}<br />
										{#if requisition.location?.streetTwo}
											{requisition.location.streetTwo}<br />
										{/if}
										{requisition.location?.city}, {requisition.location?.state}
										{requisition.location?.zipcode}
									</address>
								</CardContent>
							</Card>

							<!-- Position Details -->
							<Card class="max-w-none">
								<CardHeader class="pb-3">
									<CardTitle class="text-lg flex items-center gap-2">
										<Briefcase class="h-5 w-5 text-gray-500" />
										Position Details
									</CardTitle>
								</CardHeader>
								<CardContent class="space-y-3">
									<div class="flex justify-between items-center border-b pb-2">
										<span class="text-gray-600">Position Type</span>
										<span class="font-medium"
											>{requisition.permanentPosition ? 'Permanent' : 'Temporary'}</span
										>
									</div>
									<div class="flex justify-between items-center border-b pb-2">
										<span class="text-gray-600">Discipline</span>
										<span class="font-medium">{requisition.discipline.name}</span>
									</div>
									<div class="flex justify-between items-center border-b pb-2">
										<span class="text-gray-600">Experience Level</span>
										<span class="font-medium">{requisition.experienceLevel?.value}</span>
									</div>
									<div class="flex justify-between items-center border-b pb-2">
										<span class="text-gray-600">Hourly Rate</span>
										<span class="font-medium">${requisition.hourlyRate}/hr</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-gray-600">Status</span>
										<Badge
											class={cn(
												status === 'OPEN' && 'bg-blue-100 text-blue-800 hover:bg-blue-100',
												status === 'FILLED' && 'bg-green-100 text-green-800 hover:bg-green-100',
												status === 'UNFULFILLED' &&
													'bg-orange-100 text-orange-800 hover:bg-orange-100',
												status === 'CANCELED' && 'bg-red-100 text-red-800 hover:bg-red-100'
											)}
											value={requisition.status}
										/>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<!-- Applications Tab -->
				{#if requisition.permanentPosition}
					<TabsContent value="applications" class="mt-6">
						<Card class="max-w-none">
							<CardHeader>
								<CardTitle>Applications</CardTitle>
								<CardDescription>Manage applications for this requisition</CardDescription>
							</CardHeader>
							<CardContent>
								{#if applicationTableData.length === 0}
									<div class="text-center py-10">
										<Users class="h-12 w-12 mx-auto text-gray-300" />
										<h3 class="mt-4 text-lg font-medium">No Applications</h3>
										<p class="mt-2 text-sm text-gray-500">
											There are no applications for this requisition yet.
										</p>
									</div>
								{:else}
									<div class="rounded-md border">
										<Table.Root>
											<TableHeader>
												{#each $applicationsTable.getHeaderGroups() as headerGroup}
													<TableRow>
														{#each headerGroup.headers as header}
															<TableHead>
																<svelte:component
																	this={flexRender(
																		header.column.columnDef.header,
																		header.getContext()
																	)}
																/>
															</TableHead>
														{/each}
													</TableRow>
												{/each}
											</TableHeader>
											<TableBody>
												{#each $applicationsTable.getRowModel().rows as row}
													<TableRow>
														{#each row.getVisibleCells() as cell}
															<TableCell>
																<svelte:component
																	this={flexRender(cell.column.columnDef.cell, cell.getContext())}
																/>
															</TableCell>
														{/each}
													</TableRow>
												{/each}
											</TableBody>
										</Table.Root>
									</div>
								{/if}
							</CardContent>
						</Card>
					</TabsContent>
				{/if}

				<!-- Work Days Tab -->
				{#if !requisition.permanentPosition}
					<TabsContent value="workdays" class="mt-6">
						<Card class="max-w-none">
							<CardHeader class="flex flex-row items-center justify-between">
								<div>
									<CardTitle>Work Days</CardTitle>
									<CardDescription>Manage work days for this requisition</CardDescription>
								</div>
								{#if hasRequisitionRights}
									<AddRecurrenceDaysDrawer form={recurrenceDayForm} {company} {requisition} />
								{/if}
							</CardHeader>
							<CardContent>
								{#if recurrenceDaysTableData.length === 0}
									<div class="text-center">
										<CalendarClock class="h-12 w-12 mx-auto text-gray-300" />
										<h3 class="mt-4 text-lg font-medium">No Work Days</h3>
										<p class="mt-2 text-sm text-gray-500">
											There are no work days scheduled for this requisition yet.
										</p>
									</div>
								{:else}
									<div class="rounded-md border">
										<Table.Root>
											<TableHeader>
												{#each $recurrenceDaysTable.getHeaderGroups() as headerGroup}
													<TableRow>
														{#each headerGroup.headers as header}
															<TableHead>
																<svelte:component
																	this={flexRender(
																		header.column.columnDef.header,
																		header.getContext()
																	)}
																/>
															</TableHead>
														{/each}
													</TableRow>
												{/each}
											</TableHeader>
											<TableBody>
												{#each $recurrenceDaysTable.getRowModel().rows as row}
													<TableRow>
														{#each row.getVisibleCells() as cell}
															<TableCell>
																<svelte:component
																	this={flexRender(cell.column.columnDef.cell, cell.getContext())}
																/>
															</TableCell>
														{/each}
													</TableRow>
												{/each}
											</TableBody>
										</Table.Root>
									</div>
								{/if}
							</CardContent>
						</Card>
					</TabsContent>

					<!-- Timesheets Tab -->
					<TabsContent value="timesheets" class="mt-6">
						<Card class="max-w-none">
							<CardHeader>
								<CardTitle>Timesheets</CardTitle>
								<CardDescription>Manage timesheets for this requisition</CardDescription>
							</CardHeader>
							<CardContent>
								{#if timesheetTableData.length === 0}
									<div class="text-center py-10">
										<ClipboardList class="h-12 w-12 mx-auto text-gray-300" />
										<h3 class="mt-4 text-lg font-medium">No Timesheets</h3>
										<p class="mt-2 text-sm text-gray-500">
											There are no timesheets for this requisition yet.
										</p>
									</div>
								{:else}
									<div class="rounded-md border">
										<Table.Root>
											<TableHeader>
												{#each $timesheetTable.getHeaderGroups() as headerGroup}
													<TableRow>
														{#each headerGroup.headers as header}
															<TableHead>
																<svelte:component
																	this={flexRender(
																		header.column.columnDef.header,
																		header.getContext()
																	)}
																/>
															</TableHead>
														{/each}
													</TableRow>
												{/each}
											</TableHeader>
											<TableBody>
												{#each $timesheetTable.getRowModel().rows as row}
													<TableRow>
														{#each row.getVisibleCells() as cell}
															<TableCell>
																<svelte:component
																	this={flexRender(cell.column.columnDef.cell, cell.getContext())}
																/>
															</TableCell>
														{/each}
													</TableRow>
												{/each}
											</TableBody>
										</Table.Root>
									</div>
								{/if}
							</CardContent>
						</Card>
					</TabsContent>
				{/if}
			</Tabs>
		</div>
	</section>
{:else}
	<section
		class="container mx-auto px-4 py-6 flex flex-col items-center text-center sm:justify-center gap-4 md:gap-6"
	>
		<div class="p-8 bg-gray-50 rounded-lg">
			<AlertCircle class="h-12 w-12 mx-auto text-gray-400 mb-4" />
			<h2 class="text-2xl font-bold mb-2">No Requisition Found</h2>
			<p class="text-gray-500 mb-6">The requested requisition could not be found in our system.</p>
			<Button type="button" on:click={() => window.history.back()}>Go Back</Button>
		</div>
	</section>
{/if}
