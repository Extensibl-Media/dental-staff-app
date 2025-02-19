<script lang="ts">
	import ViewLink from './../../../../lib/components/tables/ViewLink.svelte';
	import { Tabs, TabItem } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import * as Table from '$lib/components/ui/table';
	import { writable } from 'svelte/store';
	import AssignStaffToLocationDrawer from '$lib/components/drawers/assignStaffToLocationDrawer.svelte';

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

	const staffTable = createSvelteTable(staffOptions);
	const requisitionsTable = createSvelteTable(requisitionOptions);
</script>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class=" flex items-center justify-between flex-wrap">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
			Office Location Details
		</h1>
	</div>
	<h2 class="text-2xl font-semibold">{location?.name}</h2>
	<div>
		<Tabs
			class=""
			tabStyle="underline"
			contentClass="py-4"
			inactiveClasses="p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50"
			activeClasses="border-b-2 border-b-blue-500 p-4 text-primary-600 bg-gray-100 rounded-t-lg"
		>
			<TabItem open title="Details" class="">
				<div class="space-y-4">
					<div>
						<p class="text-gray-500 font-semibold">Address:</p>
						<p>{location?.streetOne} {location?.streetTwo}</p>
						<p>{location?.city}, {location?.state}</p>
					</div>
					<div>
						<p class="text-gray-500 font-semibold">Contact Info:</p>
						<p>{location?.companyPhone}</p>
						<p>{location?.email}</p>
					</div>
				</div>
				<Button class="bg-blue-800 hover:bg-blue-900 mt-4">Edit Details</Button>
			</TabItem>
			<TabItem title="Staff" class="">
				<AssignStaffToLocationDrawer {allStaff} {location} {company} {assignForm} />
				<div class="column">
					<Table.Root class="table">
						<Table.TableHeader>
							{#each $staffTable.getHeaderGroups() as headerGroup}
								<Table.TableRow class="bg-white">
									{#each headerGroup.headers as header}
										<Table.TableHead colspan={header.colSpan}>
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
							{#each $staffTable.getRowModel().rows as row}
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
			<TabItem title="Requisitions" class="">
				<div class="column">
					<Table.Root class="table">
						<Table.TableHeader>
							{#each $requisitionsTable.getHeaderGroups() as headerGroup}
								<Table.TableRow class="bg-white">
									{#each headerGroup.headers as header}
										<Table.TableHead colspan={header.colSpan} click={() => {}}>
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
							{#each $requisitionsTable.getRowModel().rows as row}
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
		</Tabs>
	</div>
</section>
