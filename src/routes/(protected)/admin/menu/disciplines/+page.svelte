<script lang="ts">
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
	import * as Form from '$lib/components/ui/form';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';
	import * as Table from '$lib/components/ui/table';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { newDisciplineSchema, type NewDisciplineSchema } from '$lib/config/zod-schemas';
	import { Loader2, AlertCircle, ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { DisciplineResults, DisciplinesRaw } from '$lib/server/database/queries/disciplines';

	export let form: SuperValidated<NewDisciplineSchema>;

	const total = 10;

	export let data: PageData;
	let tableData: DisciplineResults = [];

	$: disciplines = data.disciplines;
	$: count = data.count;

	$: sortBy = $page.url.searchParams.get('sortBy');
	$: sortOn = $page.url.searchParams.get('sortOn');
	$: currentPage = Number($page.url.searchParams.get('skip')) || 0;

	$: totalPages = count ? Math.ceil(count / total) : 0;

	$: {
		tableData = (disciplines as DisciplineResults) || [];
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

	const columns: ColumnDef<DisciplinesRaw>[] = [
		{
			header: 'Name',
			id: 'name',
			accessorKey: 'name'
		},
		{
			header: 'Abbreviation',
			id: 'abbreviation',
			accessorKey: 'abbreviation'
		}
	];

	$: console.log({ totalPages, currentPage, sortBy, sortOn });

	const options = writable<TableOptions<DisciplinesRaw>>({
		data: tableData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	onMount(() => {
		tableData = (disciplines as DisciplineResults) ?? [];
		options.update((o) => ({ ...o, data: tableData }));
	});

	const table = createSvelteTable(options);
</script>

<section class="flex flex-col min-h-screen">
	<div class="p-6 flex justify-between items-center flex-wrap gap-4">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Disciplines</h1>
		<Dialog.Root>
			<Dialog.Trigger>
				<Button>Add New Discipline</Button>
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<Form.Root
					let:submitting
					let:errors
					let:config
					method="POST"
					{form}
					action="?/newDiscipline"
					schema={newDisciplineSchema}
				>
					<Dialog.Header>
						<Dialog.Title>Add New Discipline</Dialog.Title>
					</Dialog.Header>
					<Form.Field {config} name="name">
						<Form.Item>
							<Form.Label>Discipline Name</Form.Label>
							<Form.Input required />
							<Form.Validation />
						</Form.Item>
					</Form.Field>
					<Form.Field {config} name="abbreviation">
						<Form.Item>
							<Form.Label>Discipline Abbreviation</Form.Label>
							<Form.Input required />
							<Form.Validation />
						</Form.Item>
					</Form.Field>
					<Dialog.Footer>
						<Form.Button class="ml-auto mt-4" disabled={submitting}
							>{#if submitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{:else}Add Discipline{/if}
						</Form.Button>
					</Dialog.Footer>
				</Form.Root>
			</Dialog.Content>
		</Dialog.Root>
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
