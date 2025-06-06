<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		type ColumnDef,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		createSvelteTable
	} from '@tanstack/svelte-table';
	import * as Table from '$lib/components/ui/table';
	import { ArrowUpDown } from 'lucide-svelte';
	import type { InvoiceWithRelations } from '$lib/server/database/schemas/requisition';
	import DataTableActions from './data-table-actions.svelte';
	import { writable } from 'svelte/store';

	export let data: InvoiceWithRelations[];

	// Define columns
	const columns: ColumnDef<InvoiceWithRelations>[] = [
		{
			header: 'Invoice #',
			accessorFn: (row) => row.invoice.invoiceNumber
		},
		{
			header: 'Requisition',
			accessorFn: (row) => row.requisition?.id
		},
		{
			header: 'Candidate',
			accessorFn: (row) => `${row.candidate?.user.firstName} ${row.candidate?.user.lastName}`
		},
		{
			header: 'Status',
			accessorFn: (row) => row.invoice.status,
			cell: ({ getValue }) => getValue()
		},
		{
			header: 'Amount',
			accessorFn: (row) => row.invoice.total,
			cell: ({ getValue }) => {
				const amount = Number(getValue());
				return new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD'
				}).format(amount);
			}
		},
		{
			header: 'Due Date',
			accessorFn: (row) => row.invoice.dueDate,
			cell: ({ getValue }) =>
				getValue() ? new Date(getValue() as string).toLocaleDateString() : '-'
		},
		{
			id: 'actions',
			header: '',
			cell: ({ row }) => ({
				component: DataTableActions,
				props: { row: row.original }
			})
		}
	];

	// Create table options
	const tableOptions = writable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			pagination: {
				pageSize: 10,
				pageIndex: 0
			}
		}
	});

	// Create table
	const table = createSvelteTable(tableOptions);
</script>

<div>
	<div class="rounded-md border bg-white">
		<Table.Root>
			<Table.Header>
				{#each $table.getHeaderGroups() as headerGroup}
					<Table.Row>
						{#each headerGroup.headers as header}
							<Table.Head>
								{#if header.column.columnDef.header}
									<Button
										variant="ghost"
										on:click={() =>
											header.column.toggleSorting(header.column.getIsSorted() === 'asc')}
									>
										{header.column.columnDef.header}
										{#if header.column.getCanSort()}
											<ArrowUpDown class="ml-2 h-4 w-4" />
										{/if}
									</Button>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each $table.getRowModel().rows as row}
					<Table.Row>
						{#each row.getVisibleCells() as cell}
							<Table.Cell>
								{#if cell.column.columnDef.cell && typeof cell.column.columnDef.cell === 'function'}
									{#if cell.column.columnDef.id === 'actions'}
										<svelte:component this={DataTableActions} row={row.original} />
									{:else}
										{cell.column.columnDef.cell(cell.getContext())}
									{/if}
								{:else}
									{cell.getValue()}
								{/if}
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="flex items-center justify-end space-x-2 py-4">
		<Button
			variant="outline"
			size="sm"
			on:click={() => $table.previousPage()}
			disabled={!$table.getCanPreviousPage()}
		>
			Previous
		</Button>
		<Button
			variant="outline"
			size="sm"
			on:click={() => $table.nextPage()}
			disabled={!$table.getCanNextPage()}
		>
			Next
		</Button>
	</div>
</div>
