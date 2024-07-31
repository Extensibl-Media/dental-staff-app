<script lang="ts">
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
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import { getContext, onMount } from 'svelte';
	import ViewLink from '$lib/components/tables/ViewLink.svelte';
	import type {
		CandidateWithProfileRaw,
		CandidatesResult
	} from '$lib/server/database/queries/candidates';
	import Button from '$lib/components/ui/button/button.svelte';

	export let data: PageData;
	let tableData: CandidatesResult = [];
	const total = 10;

	$: candidates = data.candidates;
	$: count = data.count;
	$: sortOn = $page.url.searchParams.get('sortOn');
	$: sortBy = $page.url.searchParams.get('sortBy');
	$: currentPage = Number($page.url.searchParams.get('skip')) || 0;
	$: totalPages = count ? Math.ceil(count / total) : 0;

	$: {
		tableData = (candidates as CandidatesResult) || [];
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

	const columns: ColumnDef<CandidateWithProfileRaw>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.id,
			cell: (original) =>
				flexRender(ViewLink, {
					href: `/candidates/${original.getValue()}`
				})
		},
		{
			header: 'Name',
			id: 'last_name',
			accessorFn: (original) => `${original.last_name}, ${original.first_name}`
		},
		{
			header: 'Email',
			id: 'email',
			accessorFn: (original) => original.email
		},
		{
			header: 'Discipline',
			id: 'discipline_name',
			accessorFn: (original) => original.discipline_name
		},
		{
			header: 'City',
			id: 'city',
			accessorFn: (original) => original.city
		},
		{
			header: 'State',
			id: 'state',
			accessorFn: (original) => original.state
		},
		{
			header: 'Zipcode',
			id: 'zipcode',
			accessorFn: (original) => original.zipcode
		}
	];

	const options = writable<TableOptions<CandidateWithProfileRaw>>({
		data: tableData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	onMount(() => {
		tableData = (candidates as CandidatesResult) ?? [];
		options.update((o) => ({ ...o, data: tableData }));
	});

	const table = createSvelteTable(options);
</script>

<section class="flex flex-col min-h-screen">
	<div class="p-6">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Candidates</h1>
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
</section>

<!-- TODO: Need to ensure that if drawer is not open, then anything in the drawer is not able to have positive tabIndex -->
<!-- <div
	class={cn(
		'transition-all duration-300 absolute w-full max-w-[500px] top-0 bottom-0 z-30 bg-white shadow-lg h-screen overflow-hidden flex flex-col',
		drawerExpanded ? 'right-0' : '-right-[500px]'
	)}
>
	<div class="p-4 border-b border-b-gray-200">
		<p class="text-xl font-bold">Create New Requisition</p>
	</div>
	<Form.Root
		class="grow flex flex-col"
		let:submitting
		let:errors
		method="POST"
		{form}
		schema={{}}
		let:config
	>
		<div class="grow p-4 overflow-y-auto">
			<Form.Field {config} name="requisitionTitle">
				<Form.Item>
					<Form.Label>Title</Form.Label>
					<Form.Input />
					<Form.Validation />
				</Form.Item>
			</Form.Field>
			<Form.Field {config} name="firstName">
				<Form.Item>
					<Form.Label>Associated Client</Form.Label>
					<Form.Select>
						<Form.SelectTrigger placeholder="Select Client"></Form.SelectTrigger>
					</Form.Select>
					<Form.Validation />
				</Form.Item>
			</Form.Field>
		</div>
		<div class="flex justify-end gap-4 p-4 border-t border-t-gray-200">
			<Button
				type="button"
				on:click={() => (drawerExpanded = false)}
				class="bg-white hover:bg-red-500 hover:text-white border border-red-500 text-red-500 rounded-md"
				>Cancel</Button
			>
			<Button
				class="px-4 py-2 border border-green-400 bg-green-400 hover:bg-green-400 text-white rounded-md"
				>Submit</Button
			>
		</div>
	</Form.Root>
</div> -->
