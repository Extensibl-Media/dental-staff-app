<script lang="ts">
	import ViewLink from './../../../../lib/components/tables/ViewLink.svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import {
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		getSortedRowModel,
		type ColumnDef,
		type TableOptions
	} from '@tanstack/svelte-table';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { cn } from '$lib/utils';
	import { STAFF_ROLE_ENUM } from '$lib/config/constants';
	import { Button } from '$lib/components/ui/button';
	import type { PageData } from './$types';
	import InviteStaffToLocationDialog from '$lib/components/dialogs/inviteStaffToLocationDialog.svelte';
	import { CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { Card } from 'flowbite-svelte';
	import {
		Edit,
		Info,
		Users,
		ClipboardList,
		Building,
		Phone,
		Mail,
		MapPin,
		ExternalLink,
		Clock,
		UserPlus,
		Eye,
		UserMinus,
		Plus,
		AlertCircle
	} from 'lucide-svelte';
	import { getDayName } from '$lib/_helpers';

	type StaffProfileData = {
		profile: {
			id: string;
			userId: string;
			createdAt: Date;
			updatedAt: Date;
			birthday: string | null;
			clientId: string;
			companyId: string;
			staffRole: 'CLIENT_ADMIN' | 'CLIENT_MANAGER' | 'CLIENT_EMPLOYEE' | null;
		};
		user: {
			id: string;
			firstName: string;
			lastName: string;
			email: string;
			avatarUrl: string;
		};
	};

	type RequisitionData = {
		id: number;
		status: 'PENDING' | 'OPEN' | 'FILLED' | 'UNFULFILLED' | 'CANCELED';
		title: string;
		experienceLevel: string | null;
		discipline: string | null;
	};

	export let data: PageData;

	// $: user = data.user;
	$: location = data.location;
	// $: client = data.client;
	$: company = data.company;
	$: requisitions = data.requisitions;
	$: locationStaff = data.locationStaff;
	$: allStaff = data.allStaff;
	$: assignForm = data.assignForm;
	$: staffDialogOpen = false;

	let staffTableData: StaffProfileData[] = [];
	let requisitionTableData: RequisitionData[] = [];

	const staffColumns: ColumnDef<StaffProfileData>[] = [
		// {
		// 	header: '',
		// 	id: 'id',
		// 	accessorFn: (original) => original.id,
		// 	cell: (original) =>
		// 		flexRender(ViewLink, {
		// 			href: `/admin/menu/admins/${original.getValue()}`
		// 		})
		// },
		{
			header: 'Name',
			id: 'last_name',
			accessorFn: (original) => `${original.user.lastName}, ${original.user.firstName}`
		},
		{
			header: 'Email',
			id: 'email',
			accessorFn: (original) => original.user.email
		},
		{
			header: 'Role',
			id: 'role',
			accessorFn: (original) => {
				const role = original.profile.staffRole as keyof typeof STAFF_ROLE_ENUM;
				return STAFF_ROLE_ENUM[role];
			}
		}
	];
	const requisitionColumns: ColumnDef<RequisitionData>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.id,
			cell: (original) =>
				flexRender(ViewLink, {
					href: `/requisitions/${original.getValue()}`
				})
		},
		{
			header: 'Title',
			id: 'title',
			accessorKey: 'title'
		},
		{
			header: 'Status',
			id: 'status',
			accessorKey: 'status',
			cell: (original) =>
				flexRender(Badge, {
					value: original.getValue(),
					class: cn(
						original.getValue() === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
						original.getValue() === 'OPEN' && 'bg-blue-500 hover:bg-blue-600',
						original.getValue() === 'FILLED' && 'bg-green-400 hover:bg-bg-green-500',
						original.getValue() === 'UNFULFILLED' && 'bg-orange-400 hover:bg-orange-500',
						original.getValue() === 'CANCELED' && 'bg-red-500 hover:bg-red-600'
					)
				})
		},
		{
			header: 'Discipline',
			id: 'discipline',
			accessorKey: 'discipline'
		},
		{
			header: 'Experience Level',
			id: 'experienceLevel',
			accessorKey: 'experienceLevel'
		}
	];

	const staffOptions = writable<TableOptions<StaffProfileData>>({
		data: staffTableData,
		columns: staffColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});
	const requisitionOptions = writable<TableOptions<RequisitionData>>({
		data: requisitionTableData,
		columns: requisitionColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	$: {
		staffTableData = (locationStaff as StaffProfileData[]) || [];
		staffOptions.update((o) => ({ ...o, data: staffTableData }));
		requisitionTableData = (requisitions as RequisitionData[]) || [];
		requisitionOptions.update((o) => ({ ...o, data: requisitionTableData }));
	}

	onMount(() => {
		staffTableData = (locationStaff as StaffProfileData[]) || [];
		staffOptions.update((o) => ({ ...o, data: staffTableData }));
		requisitionTableData = (requisitions as RequisitionData[]) || [];
		requisitionOptions.update((o) => ({ ...o, data: requisitionTableData }));
	});
	const formatTime = (time: string): string => {
		const [hours, minutes] = time.split(':');
		const date = new Date();
		date.setHours(parseInt(hours), parseInt(minutes));
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	};
	const staffTable = createSvelteTable(staffOptions);
	const requisitionsTable = createSvelteTable(requisitionOptions);
</script>

{#if location}
	<section class="container mx-auto px-4 py-6">
		<div class="flex flex-col gap-6">
			<!-- Header with location info -->
			<div class="py-6">
				<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div>
						<h1 class="text-3xl font-bold">Office Location Details</h1>
						<h2 class="text-xl font-medium text-gray-700 mt-2">{location?.name}</h2>
					</div>
				</div>
			</div>

			<!-- Tabs section -->
			<Tabs class="w-full">
				<TabsList class="grid grid-cols-3 lg:w-fit">
					<TabsTrigger value="details" class="gap-2">
						<Info class="h-4 w-4" />
						<span class="hidden md:inline">Details</span>
					</TabsTrigger>
					<TabsTrigger value="staff" class="gap-2">
						<Users class="h-4 w-4" />
						<span class="hidden md:inline">Staff</span>
					</TabsTrigger>
					<TabsTrigger value="requisitions" class="gap-2">
						<ClipboardList class="h-4 w-4" />
						<span class="hidden md:inline">Requisitions</span>
					</TabsTrigger>
				</TabsList>

				<!-- Details Tab -->
				<TabsContent value="details" class="mt-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Location Information -->
						<Card class="w-full max-w-none">
							<CardHeader>
								<CardTitle class="text-blue-600 flex items-center gap-2">
									<Building class="h-5 w-5" />
									Location Information
								</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<div>
									<h3 class="text-sm font-medium">Address:</h3>
									<p>{location?.streetOne} {location?.streetTwo || ''}</p>
									<p>{location?.city}, {location?.state}</p>
								</div>

								<div>
									<h3 class="text-sm font-medium">Contact Information:</h3>
									<div class="flex items-center gap-2 mt-1">
										<Phone class="h-4 w-4 text-gray-500" />
										<span>{location?.companyPhone || 'No phone number'}</span>
									</div>
									<div class="flex items-center gap-2 mt-1">
										<Mail class="h-4 w-4 text-gray-500" />
										<a href={`mailto:${location?.email}`} class="text-blue-600 hover:underline">
											{location?.email || 'No email address'}
										</a>
									</div>
								</div>

								<div>
									<h3 class="text-sm font-medium">Company:</h3>
									<p>{company?.companyName || 'Unknown'}</p>
								</div>
							</CardContent>
							<CardFooter>
								<Button variant="default" class="gap-1">
									<Edit class="h-4 w-4" />
									Edit Details
								</Button>
							</CardFooter>
						</Card>

						<!-- Map Preview -->
						<Card class="w-full max-w-none">
							<CardHeader>
								<CardTitle class="text-blue-600 flex items-center gap-2">
									<MapPin class="h-5 w-5" />
									Map Location
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div class="bg-gray-100 h-48 rounded-md flex items-center justify-center">
									<div class="text-center">
										<MapPin class="h-12 w-12 mx-auto text-gray-400 mb-2" />
										<p class="text-sm text-gray-500">Map preview not available</p>
									</div>
								</div>
							</CardContent>
							<CardFooter>
								<Button variant="outline" size="sm" class="gap-1">
									<ExternalLink class="h-4 w-4" />
									Open in Maps
								</Button>
							</CardFooter>
						</Card>

						<!-- Hours of Operation (if available) -->
						{#if company?.operatingHours}
							<Card class="w-full max-w-none">
								<CardHeader>
									<CardTitle class="text-blue-600 flex items-center gap-2">
										<Clock class="h-5 w-5" />
										Hours of Operation
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div class="space-y-1">
										{#each Object.entries(company.operatingHours) as [day, hours]}
											<div
												class="flex justify-between py-1 text-sm border-b border-gray-100 last:border-0"
											>
												<span class="font-medium text-gray-700">
													{getDayName(+day)}
												</span>
												<span class="text-gray-600">
													{#if hours.isClosed}
														<span class="text-gray-500">Closed</span>
													{:else if company?.operatingHours?.[+day].isClosed}
														<span class="text-gray-500">Closed</span>
													{:else}
														{formatTime(company?.operatingHours?.[+day].openTime)} - {formatTime(
															company?.operatingHours?.[+day].closeTime
														)}
													{/if}
												</span>
											</div>
										{/each}
									</div>
								</CardContent>
							</Card>
						{/if}
					</div>
				</TabsContent>

				<!-- Staff Tab -->
				<TabsContent value="staff" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="flex flex-row items-center justify-between">
							<CardTitle>Location Staff</CardTitle>
							<div class="flex gap-2">
								<InviteStaffToLocationDialog
									bind:open={staffDialogOpen}
									{allStaff}
									{location}
									{company}
									{assignForm}
								/>
							</div>
						</CardHeader>
						<CardContent>
							{#if staffTableData.length === 0}
								<div class="text-center py-8">
									<Users class="h-12 w-12 mx-auto text-gray-300" />
									<h3 class="mt-4 text-lg font-medium">No Staff Assigned</h3>
									<p class="mt-2 text-sm text-gray-500">
										This location doesn't have any staff assigned yet.
									</p>
									<InviteStaffToLocationDialog
										bind:open={staffDialogOpen}
										{allStaff}
										{location}
										{company}
										{assignForm}
									/>
								</div>
							{:else}
								<div class="rounded-md border">
									<Table>
										<TableHeader>
											{#each $staffTable.getHeaderGroups() as headerGroup}
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
											{#each $staffTable.getRowModel().rows as row}
												<TableRow>
													{#each row.getVisibleCells() as cell}
														<TableCell>
															<svelte:component
																this={flexRender(cell.column.columnDef.cell, cell.getContext())}
															/>
														</TableCell>
													{/each}
													<!-- Add Actions column -->
													<TableCell>
														<div class="flex justify-end gap-2">
															<Button variant="ghost" size="icon" class="h-8 w-8">
																<Eye class="h-4 w-4" />
															</Button>
															<Button variant="ghost" size="icon" class="h-8 w-8 text-red-500">
																<UserMinus class="h-4 w-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</div>
							{/if}
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Requisitions Tab -->
				<TabsContent value="requisitions" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="flex flex-row items-center justify-between">
							<CardTitle>Location Requisitions</CardTitle>
							<Button size="sm" class="gap-1">
								<Plus class="h-4 w-4" />
								<span>New Requisition</span>
							</Button>
						</CardHeader>
						<CardContent>
							{#if requisitionTableData.length === 0}
								<div class="text-center py-8">
									<ClipboardList class="h-12 w-12 mx-auto text-gray-300" />
									<h3 class="mt-4 text-lg font-medium">No Requisitions</h3>
									<p class="mt-2 text-sm text-gray-500">
										This location doesn't have any requisitions yet.
									</p>
									<Button variant="outline" class="mt-4 gap-1">
										<Plus class="h-4 w-4" />
										Create First Requisition
									</Button>
								</div>
							{:else}
								<div class="rounded-md border">
									<Table>
										<TableHeader>
											{#each $requisitionsTable.getHeaderGroups() as headerGroup}
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
											{#each $requisitionsTable.getRowModel().rows as row}
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
									</Table>
								</div>
							{/if}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	</section>
{:else}
	<section
		class="container mx-auto px-4 py-6 flex flex-col items-center text-center sm:justify-center gap-4 md:gap-6"
	>
		<div class="p-8 bg-gray-50 rounded-lg">
			<AlertCircle class="h-12 w-12 mx-auto text-gray-400 mb-4" />
			<h2 class="text-2xl font-bold mb-2">No Location Found</h2>
			<p class="text-gray-500 mb-6">The requested location could not be found in our system.</p>
			<Button type="button" on:click={() => window.history.back()}>Go Back</Button>
		</div>
	</section>
{/if}
