<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import { onMount } from 'svelte';
	import ViewLink from '$lib/components/tables/ViewLink.svelte';
	import {
		getCoreRowModel,
		type ColumnDef,
		getSortedRowModel,
		type TableOptions,
		createSvelteTable,
		flexRender
	} from '@tanstack/svelte-table';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { ClientResults, ClientWithCompanyRaw } from '$lib/server/database/queries/clients';

	export let data: PageData;
	let tableData: ClientResults = [];
	const total = 10;

	$: clients = data.clients;
	$: count = data.count;

	$: sortBy = $page.url.searchParams.get('sortBy');
	$: sortOn = $page.url.searchParams.get('sortOn');
	$: currentPage = Number($page.url.searchParams.get('skip')) || 0;

	$: totalPages = count ? Math.ceil(count / total) : 0;
	$: {
		tableData = (clients as ClientResults) || [];
		options.update((o) => ({ ...o, data: tableData }));
	}

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

	const columns: ColumnDef<ClientWithCompanyRaw>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.id,
			cell: (original) =>
				flexRender(ViewLink, {
					href: `/clients/${original.getValue()}`
				})
		},
		{
			header: 'Name',
			id: 'last_name',
			accessorFn: (original) => `${original.last_name}, ${original.first_name}`
		},
		{
			header: 'Company Name',
			id: 'company_name',
			accessorFn: (original) => original.company_name
		},
		{
			header: 'Email',
			id: 'email',
			accessorFn: (original) => original.email
		}
	];

	const options = writable<TableOptions<ClientWithCompanyRaw>>({
		data: tableData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	onMount(() => {
		tableData = (clients as ClientResults) ?? [];
		options.update((o) => ({ ...o, data: tableData }));
	});

	const table = createSvelteTable(options);
</script>

<section class="grow h-screen overflow-y-auto">
	<div class="p-6 flex flex-col gap-6">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Clients</h1>
	</div>
	<div class="p-4">
		<div class="column">
			<Table.Root class="table">
				<Table.TableHeader>
					{#each $table.getHeaderGroups() as headerGroup}
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
					{#each $table.getRowModel().rows as row}
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
	</div>
	<div class="flex justify-end gap-4 p-4">
		<Button disabled={currentPage === 0} on:click={handlePrev}>prev</Button>
		<Button disabled={currentPage === (totalPages - 1) * total} on:click={handleNext}>next</Button>
	</div>
	<!-- <div class="flex flex-col items-center justify-center gap-2 p-6">
		<div class="text-sm text-gray-700">
			Showing <span class="font-semibold text-gray-900 ">{helper.start}</span>
			to
			<span class="font-semibold text-gray-900 ">{helper.end}</span>
			of
			<span class="font-semibold text-gray-900 ">{helper.total}</span>
			Entries
		</div>
	</div> -->
</section>
