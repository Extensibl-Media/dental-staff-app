<script lang="ts">
	import AdminRequisitionForm from '$lib/views/admin/requisitions/newRequisitionFormAdmin.svelte';
	import CompanyRequisitionForm from '$lib/views/client/companyRequisitionForm.svelte';
	import { Tabs, TabItem } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import type { SuperValidated } from 'sveltekit-superforms';
	import Button from '$lib/components/ui/button/button.svelte';
	import { cn } from '$lib/utils';
	import { USER_ROLES } from '$lib/config/constants';
	import {
		adminRequisitionSchema,
		// clientRequisitionSchema,
		type AdminRequisitionSchema,
		type ClientRequisitionSchema
	} from '$lib/config/zod-schemas';
	import { ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		getCoreRowModel,
		type ColumnDef,
		getSortedRowModel,
		type TableOptions,
		createSvelteTable,
		flexRender
	} from '@tanstack/svelte-table';
	import { writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import { onMount } from 'svelte';
	import ViewLink from '$lib/components/tables/ViewLink.svelte';
	import type {
		RequisitionDetailsRaw,
		RequisitionResults
	} from '$lib/server/database/queries/requisitions';

	export let data: PageData;
	export let adminForm: SuperValidated<AdminRequisitionSchema>;
	export let clientForm: SuperValidated<ClientRequisitionSchema>;
	const total = 10;

	let drawerExpanded: boolean = false;
	let tableData: RequisitionResults = [];

	$: user = data.user;
	$: requisitions = data.requisitions;

	$: count = data.count;
	$: sortOn = $page.url.searchParams.get('sortOn');
	$: sortBy = $page.url.searchParams.get('sortBy');
	$: currentPage = Number($page.url.searchParams.get('skip')) || 0;
	$: totalPages = count ? Math.ceil(count / total) : 0;

	$: {
		tableData = (requisitions as RequisitionResults) ?? [];
		pendingOptions.update((o) => ({
			...o,
			data: tableData.filter((req) => req.status === 'PENDING')
		}));
		filledOptions.update((o) => ({
			...o,
			data: tableData.filter((req) => req.status === 'FILLED')
		}));
		unfulfilledOptions.update((o) => ({
			...o,
			data: tableData.filter((req) => req.status === 'UNFULFILLED')
		}));
		openOptions.update((o) => ({ ...o, data: tableData.filter((req) => req.status === 'OPEN') }));
		canceledOptions.update((o) => ({
			...o,
			data: tableData.filter((req) => req.status === 'CANCELED')
		}));
	}

	const resetQueryParams = (clearAll = false) => {
		const query = new URLSearchParams($page.url.searchParams.toString());
		const thisPage = window.location.pathname;
		query.delete('sortBy');
		query.delete('sortOn');
		clearAll && query.delete('skip');
		goto(thisPage);
	};

	const handlePrev = () => {
		if (currentPage < 1) {
			return;
		}
		const query = new URLSearchParams($page.url.searchParams.toString());
		if (currentPage <= totalPages * total) {
			const newPage = Math.ceil(currentPage - 1 * total);
			query.set('skip', String(newPage));
			goto(`?${query.toString()}`);
		}
	};
	const handleNext = () => {
		const query = new URLSearchParams($page.url.searchParams.toString());
		if (currentPage < totalPages * total) {
			const newPage = Math.ceil(currentPage + 1 * total);
			query.set('skip', String(newPage));
			goto(`?${query.toString()}`);
		}
	};

	const handleColumnSort = (columnId: string) => {
		if (columnId === 'id') return;
		const query = new URLSearchParams($page.url.searchParams.toString());

		// Get current sort parameters
		const currentSortOn = query.get('sortOn');
		const currentSortBy = query.get('sortBy');

		// Determine the new sorting state
		if (currentSortOn === columnId) {
			// Cycle through sorting states: asc -> desc -> none
			if (currentSortBy === 'asc') {
				query.set('sortBy', 'desc');
			} else if (currentSortBy === 'desc') {
				query.delete('sortBy');
				query.delete('sortOn');
			} else {
				query.set('sortBy', 'asc');
			}
		} else {
			// If the column changes, reset to ascending sort
			query.set('sortOn', columnId);
			query.set('sortBy', 'asc');
		}

		// Navigate to the new URL with updated query parameters
		goto(`?${query.toString()}`);
	};

	const adminColumns: ColumnDef<RequisitionDetailsRaw>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.id,
			cell: (original) =>
				flexRender(ViewLink, {
					value: original.getValue(),
					href: `/requisitions/${original.getValue()}`
				})
		},
		{ header: 'Title', id: 'name', accessorKey: 'name' },
		{
			header: 'Client',
			id: 'last_name',
			accessorFn: (original) => `${original.last_name}, Dr. ${original.first_name}`
		},
		{ header: 'Office', id: 'location_name', accessorKey: 'location_name' },
		{ header: 'Region', id: 'region_abbreviation', accessorKey: 'region_abbreviation' }
	];

	const clientColumns: ColumnDef<RequisitionDetailsRaw>[] = [
		{
			header: 'Req #',
			id: 'id',
			accessorFn: (original) => original.id,
			cell: (original) =>
				flexRender(ViewLink, {
					value: original.getValue(),
					href: `/requisitions/${original.getValue()}`
				})
		},
		{ header: 'Title', id: 'name', accessorKey: 'name' },
		{ header: 'Office', id: 'location_name', accessorKey: 'location_name' },
		{ header: 'Region', id: 'region_abbreviation', accessorKey: 'region_abbreviation' },
		{
			header: 'Type',
			id: 'permanent_position',
			accessorFn: (original) => (original.permanent_position ? 'Permanent' : 'Temporary')
		}
	];

	const pendingOptions = writable<TableOptions<RequisitionDetailsRaw>>({
		data: tableData.filter((req) => req.status === 'PENDING'),
		columns: user?.role === USER_ROLES.SUPERADMIN ? adminColumns : clientColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const filledOptions = writable<TableOptions<RequisitionDetailsRaw>>({
		data: tableData.filter((req) => req.status === 'FILLED'),
		columns: user?.role === USER_ROLES.SUPERADMIN ? adminColumns : clientColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const unfulfilledOptions = writable<TableOptions<RequisitionDetailsRaw>>({
		data: tableData.filter((req) => req.status === 'UNFULFILLED'),
		columns: user?.role === USER_ROLES.SUPERADMIN ? adminColumns : clientColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const canceledOptions = writable<TableOptions<RequisitionDetailsRaw>>({
		data: tableData.filter((req) => req.status === 'CANCELED'),
		columns: user?.role === USER_ROLES.SUPERADMIN ? adminColumns : clientColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const openOptions = writable<TableOptions<RequisitionDetailsRaw>>({
		data: tableData.filter((req) => req.status === 'OPEN'),
		columns: user?.role === USER_ROLES.SUPERADMIN ? adminColumns : clientColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	onMount(() => {
		tableData = (requisitions as RequisitionResults) ?? [];
		pendingOptions.update((o) => ({
			...o,
			data: tableData.filter((req) => req.status === 'PENDING')
		}));
		filledOptions.update((o) => ({
			...o,
			data: tableData.filter((req) => req.status === 'FILLED')
		}));
		unfulfilledOptions.update((o) => ({
			...o,
			data: tableData.filter((req) => req.status === 'UNFULFILLED')
		}));
		openOptions.update((o) => ({ ...o, data: tableData.filter((req) => req.status === 'OPEN') }));
		canceledOptions.update((o) => ({
			...o,
			data: tableData.filter((req) => req.status === 'CANCELED')
		}));
	});

	const pendingTable = createSvelteTable(pendingOptions);
	const filledTable = createSvelteTable(filledOptions);
	const unfulfilledTable = createSvelteTable(unfulfilledOptions);
	const openTable = createSvelteTable(openOptions);
	const canceledTable = createSvelteTable(canceledOptions);
</script>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class=" flex items-center justify-between flex-wrap">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Requisitions</h1>
		<Button class="bg-blue-900 hover:bg-blue-800" on:click={() => (drawerExpanded = true)}
			>New Requisition</Button
		>
	</div>
	<div class="">
		<Tabs
			tabStyle="underline"
			contentClass="py-4"
			inactiveClasses="p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50"
			activeClasses="border-b-2 border-b-blue-500 p-4 text-primary-600 bg-gray-100 rounded-t-lg"
		>
			<TabItem open title="Pending" on:click={() => resetQueryParams(true)}>
				<div class="p-4">
					<div class="column">
						{#if user?.role === USER_ROLES.SUPERADMIN}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $pendingTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $pendingTable.getRowModel().rows as row}
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
						{/if}
						{#if user?.role === USER_ROLES.CLIENT || user?.role === USER_ROLES.CLIENT_STAFF}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $pendingTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $pendingTable.getRowModel().rows as row}
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
						{/if}
					</div>
				</div>
				<div class="flex justify-end gap-4 p-4">
					<Button disabled={currentPage === 0} on:click={handlePrev}>prev</Button>
					<Button disabled={currentPage === (totalPages - 1) * total} on:click={handleNext}
						>next</Button
					>
				</div>
			</TabItem>
			<TabItem title="Open" on:click={() => resetQueryParams(true)}>
				<div class="p-4">
					<div class="column">
						{#if user?.role === USER_ROLES.SUPERADMIN}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $openTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $openTable.getRowModel().rows as row}
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
						{/if}
						{#if user?.role === USER_ROLES.CLIENT || user?.role === USER_ROLES.CLIENT_STAFF}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $openTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $openTable.getRowModel().rows as row}
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
						{/if}
					</div>
				</div>
				<div class="flex justify-end gap-4 p-4">
					<Button disabled={currentPage === 0} on:click={handlePrev}>prev</Button>
					<Button disabled={currentPage === (totalPages - 1) * total} on:click={handleNext}
						>next</Button
					>
				</div>
			</TabItem>
			<TabItem title="Filled" on:click={() => resetQueryParams(true)}>
				<div class="p-4">
					<div class="column">
						{#if user?.role === USER_ROLES.SUPERADMIN}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $filledTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $filledTable.getRowModel().rows as row}
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
						{/if}
						{#if user?.role === USER_ROLES.CLIENT || user?.role === USER_ROLES.CLIENT_STAFF}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $filledTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $filledTable.getRowModel().rows as row}
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
						{/if}
					</div>
				</div>
				<div class="flex justify-end gap-4 p-4">
					<Button disabled={currentPage === 0} on:click={handlePrev}>prev</Button>
					<Button disabled={currentPage === (totalPages - 1) * total} on:click={handleNext}
						>next</Button
					>
				</div>
			</TabItem>
			<TabItem title="Canceled" on:click={() => resetQueryParams(true)}>
				<div class="p-4">
					<div class="column">
						{#if user?.role === USER_ROLES.SUPERADMIN}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $canceledTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $canceledTable.getRowModel().rows as row}
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
						{/if}
						{#if user?.role === USER_ROLES.CLIENT || user?.role === USER_ROLES.CLIENT_STAFF}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $canceledTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $canceledTable.getRowModel().rows as row}
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
						{/if}
					</div>
				</div>
				<div class="flex justify-end gap-4 p-4">
					<Button disabled={currentPage === 0} on:click={handlePrev}>prev</Button>
					<Button disabled={currentPage === (totalPages - 1) * total} on:click={handleNext}
						>next</Button
					>
				</div>
			</TabItem>
			<TabItem title="Unfullfilled" on:click={() => resetQueryParams(true)}>
				<div class="p-4">
					<div class="column">
						{#if user?.role === USER_ROLES.SUPERADMIN}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $unfulfilledTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $unfulfilledTable.getRowModel().rows as row}
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
						{/if}
						{#if user?.role === USER_ROLES.CLIENT || user?.role === USER_ROLES.CLIENT_STAFF}
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $unfulfilledTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead
													class="hover:bg-white cursor-pointer relative"
													colspan={header.colSpan}
													click={() => handleColumnSort(header.getContext().header.id)}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													{#if sortBy && sortOn && header.getContext().header.id === sortOn}
														{#if sortBy === 'asc'}
															<ArrowUpNarrowWide class="absolute right-0 top-[25%]" size={18} />
														{:else}
															<ArrowDownWideNarrow class="absolute right-0 top-[25%]" size={18} />
														{/if}
													{/if}
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $unfulfilledTable.getRowModel().rows as row}
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
						{/if}
					</div>
				</div>
				<div class="flex justify-end gap-4 p-4">
					<Button disabled={currentPage === 0} on:click={handlePrev}>prev</Button>
					<Button disabled={currentPage === (totalPages - 1) * total} on:click={handleNext}
						>next</Button
					>
				</div>
			</TabItem>
		</Tabs>
	</div>
</section>

<!-- TODO: Need to ensure that if drawer is not open, then anything in the drawer is not able to have positive tabIndex -->
<div
	class={cn(
		'transition-all duration-300 absolute w-full max-w-[500px] top-0 bottom-0 z-30 bg-white shadow-lg h-screen overflow-hidden flex flex-col',
		drawerExpanded ? 'right-0' : '-right-[500px]'
	)}
>
	<div class="p-4 border-b border-b-gray-200">
		<p class="text-xl font-bold">Create New Requisition</p>
	</div>
	{#if drawerExpanded}
		{#if user?.role === USER_ROLES.SUPERADMIN}
			<AdminRequisitionForm form={adminForm} schema={adminRequisitionSchema} bind:drawerExpanded />
		{/if}
		{#if user?.role === USER_ROLES.CLIENT || user?.role === USER_ROLES.CLIENT_STAFF}
			<CompanyRequisitionForm form={clientForm} bind:drawerExpanded />
		{/if}
	{:else}
		<div></div>
	{/if}
</div>
