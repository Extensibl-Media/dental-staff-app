<script lang="ts">
	import {
		getCoreRowModel,
		type ColumnDef,
		getSortedRowModel,
		getPaginationRowModel,
		type TableOptions,
		createSvelteTable,
		flexRender
	} from '@tanstack/svelte-table';
	import * as Form from '$lib/components/ui/form';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { newExperienceLevelSchema, type NewExperienceLevelSchema } from '$lib/config/zod-schemas';
	import {
		Loader2,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		Search,
		ChevronLeft,
		ChevronRight,
		Trophy,
		PlusIcon,
		Trash
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms/client';

	export let data: PageData;

	const {
		submitting,
		enhance,
		form: experienceLevelForm
	} = superForm(data.form, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				dialogOpen = false;
				$experienceLevelForm = {
					value: ''
				};
			}
		}
	});

	type ExperienceLevelData = {
		id: string;
		value: string;
		createdAt: Date;
		updatedAt: Date;
	};

	let tableData: ExperienceLevelData[] = [];
	let searchTerm = '';
	let dialogOpen = false;

	$: experienceLevels = (data.experienceLevels as ExperienceLevelData[]) || [];

	// Column definitions
	const columns: ColumnDef<ExperienceLevelData>[] = [
		{
			header: 'Experience Level',
			id: 'value',
			accessorKey: 'value',
			enableSorting: true,
			sortingFn: (rowA, rowB) => {
				const valueA = rowA.original.value?.toLowerCase() || '';
				const valueB = rowB.original.value?.toLowerCase() || '';
				return valueA.localeCompare(valueB);
			}
		},
		{
			header: 'Created',
			id: 'createdAt',
			accessorKey: 'createdAt',
			enableSorting: true,
			sortingFn: (rowA, rowB) => {
				const dateA = new Date(rowA.original.createdAt).getTime();
				const dateB = new Date(rowB.original.createdAt).getTime();
				return dateA - dateB;
			},
			cell: ({ getValue }) => {
				const date = getValue() as Date;
				return new Date(date).toLocaleDateString();
			}
		},
		{
			header: 'Updated',
			id: 'updatedAt',
			accessorKey: 'updatedAt',
			enableSorting: true,
			sortingFn: (rowA, rowB) => {
				const dateA = new Date(rowA.original.updatedAt).getTime();
				const dateB = new Date(rowB.original.updatedAt).getTime();
				return dateA - dateB;
			},
			cell: ({ getValue }) => {
				const date = getValue() as Date;
				return new Date(date).toLocaleDateString();
			}
		}
	];

	// Table options
	const options = writable<TableOptions<ExperienceLevelData>>({
		data: tableData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10
			}
		}
	});

	// Update table data when experience levels change
	$: {
		tableData = experienceLevels;
		options.update((o) => ({ ...o, data: tableData }));
	}

	onMount(() => {
		tableData = experienceLevels;
		options.update((o) => ({ ...o, data: tableData }));
	});

	const table = createSvelteTable(options);

	function getSortingIcon(header: any) {
		if (!header.column.getCanSort()) return null;

		const sorted = header.column.getIsSorted();
		if (sorted === 'asc') return ArrowUp;
		if (sorted === 'desc') return ArrowDown;
		return ArrowUpDown;
	}

	function handleSearch(searchTerm: string) {
		if (!searchTerm || searchTerm.trim() === '') {
			goto('/admin/menu/experience-levels');
		} else {
			goto(`/admin/menu/experience-levels?search=${encodeURIComponent(searchTerm.trim())}`);
		}
	}
</script>

<section class="flex flex-col h-full p-6 space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Experience Levels</h1>
			<p class="text-muted-foreground">Manage experience level options</p>
		</div>

		<Dialog.Root bind:open={dialogOpen}>
			<Dialog.Trigger asChild>
				<Button on:click={() => (dialogOpen = true)} class="bg-blue-800 hover:bg-blue-900">
					<PlusIcon size={20} class="mr-2" />Add New Experience Level
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[425px]">
				<form use:enhance method="POST" action="?/addExperienceLevel">
					<Dialog.Header>
						<Dialog.Title>Add New Experience Level</Dialog.Title>
						<Dialog.Description>
							Add a new experience level option for professionals
						</Dialog.Description>
					</Dialog.Header>
					<div class="space-y-4 py-4">
						<Form.Field
							config={{ form: superForm(data.form), schema: newExperienceLevelSchema }}
							name="value"
						>
							<Form.Item>
								<Form.Label>Experience Level Value</Form.Label>
								<Form.Input required placeholder="e.g., Entry Level, Mid Level, Senior..." />
								<Form.Validation />
							</Form.Item>
						</Form.Field>
					</div>
					<Dialog.Footer>
						<Button variant="outline" type="button" on:click={() => (dialogOpen = false)}>
							Cancel
						</Button>
						<Form.Button disabled={$submitting}>
							{#if $submitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{/if}
							Add Experience Level
						</Form.Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<!-- Search -->
	<form on:submit|preventDefault={() => handleSearch(searchTerm)} class="flex items-center gap-2">
		<Input
			bind:value={searchTerm}
			placeholder="Search experience levels..."
			class="bg-white max-w-xs"
		/>
		<Button
			size="sm"
			class="bg-blue-800 hover:bg-blue-900"
			on:click={() => handleSearch(searchTerm)}
		>
			Search
		</Button>
	</form>

	<!-- Table -->
	<div class="bg-white rounded-lg shadow-sm flex-1 flex flex-col">
		{#if $table.getRowModel().rows.length > 0}
			<div class="rounded-md border flex-1">
				<Table.Root>
					<Table.Header>
						{#each $table.getHeaderGroups() as headerGroup}
							<Table.Row class="bg-white">
								{#each headerGroup.headers as header}
									<Table.Head>
										{#if header.column.columnDef.header}
											<Button
												variant="ghost"
												on:click={() =>
													header.column.toggleSorting(header.column.getIsSorted() === 'asc')}
												class="hover:bg-gray-50"
											>
												{header.column.columnDef.header}
												{#if header.column.getCanSort()}
													{#if getSortingIcon(header)}
														<svelte:component this={getSortingIcon(header)} class="ml-2 h-4 w-4" />
													{/if}
												{/if}
											</Button>
										{/if}
									</Table.Head>
								{/each}
								<Table.Head>Actions</Table.Head>
							</Table.Row>
						{/each}
					</Table.Header>
					<Table.Body>
						{#each $table.getRowModel().rows as row}
							<Table.Row class="bg-gray-50 hover:bg-gray-100 transition-colors">
								{#each row.getVisibleCells() as cell}
									<Table.Cell>
										<svelte:component
											this={flexRender(cell.column.columnDef.cell, cell.getContext())}
										/>
									</Table.Cell>
								{/each}
								<Table.Cell>
									<form method="POST" use:enhance action="?/deleteExperienceLevel">
										<Button type="submit" variant="destructive" size="sm">
											<Trash size={16} />
										</Button>
										<input type="hidden" name="id" value={row.original.id} />
									</form>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Pagination -->
			<div class="flex items-center justify-between space-x-2 p-4 border-t">
				<div class="flex-1 text-sm text-muted-foreground">
					Showing {$table.getState().pagination.pageIndex * $table.getState().pagination.pageSize +
						1} to {Math.min(
						($table.getState().pagination.pageIndex + 1) * $table.getState().pagination.pageSize,
						$table.getRowModel().rows.length
					)} of {$table.getRowModel().rows.length} experience levels
				</div>
				<div class="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						on:click={() => $table.previousPage()}
						disabled={!$table.getCanPreviousPage()}
					>
						<ChevronLeft class="h-4 w-4" />
						Previous
					</Button>
					<div class="flex items-center space-x-1">
						<span class="text-sm text-muted-foreground">
							Page {$table.getState().pagination.pageIndex + 1} of {$table.getPageCount()}
						</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						on:click={() => $table.nextPage()}
						disabled={!$table.getCanNextPage()}
					>
						Next
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>
			</div>
		{:else}
			<!-- Empty state -->
			<div class="flex flex-col items-center justify-center py-12 text-center flex-1">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
					<Trophy class="w-8 h-8 text-gray-400" />
				</div>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No experience levels found</h3>
				<p class="text-sm text-gray-500 mb-6">
					{#if searchTerm}
						Try adjusting your search terms
					{:else}
						Get started by creating your first experience level
					{/if}
				</p>
				{#if !searchTerm}
					<Button on:click={() => (dialogOpen = true)}>Add Your First Experience Level</Button>
				{/if}
			</div>
		{/if}
	</div>
</section>
