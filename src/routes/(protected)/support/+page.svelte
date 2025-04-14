<script lang="ts">
	import {
		getCoreRowModel,
		type ColumnDef,
		getSortedRowModel,
		type TableOptions,
		createSvelteTable,
		flexRender
	} from '@tanstack/svelte-table';
	import type { PageData } from './$types';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { newSupportTicketSchema, type NewSupportTicketSchema } from '$lib/config/zod-schemas';
	import { USER_ROLES } from '$lib/config/constants';
	import type { SupportTicketResult } from '$lib/server/database/queries/support';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import ViewLink from '$lib/components/tables/ViewLink.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import * as Table from '$lib/components/ui/table';
	import { format } from 'date-fns';
	import NewSupportTicketDialog from '$lib/components/dialogs/newSupportTicketDialog.svelte';

	export let data: PageData;
	export let form: SuperValidated<NewSupportTicketSchema>;
	let open = false;

	$: tickets = data.tickets as SupportTicketResult[];
	$: user = data.user;
	$: {
		tableData = (tickets as SupportTicketResult[]) || [];
		options.update((o) => ({ ...o, data: tableData }));
	}

	form = data.form;

	let tableData: SupportTicketResult[] = [];
	const clientColumns: ColumnDef<SupportTicketResult>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.supportTicket.id,
			cell: (original) =>
				flexRender(ViewLink, {
					href: `/support/ticket/${original.getValue()}`
				})
		},
		{
			header: 'Title',
			id: 'title',
			accessorFn: (original) => original.supportTicket.title
		},
		{
			header: 'Date Created',
			id: 'updatedAt',
			accessorFn: (original) => original.supportTicket.updatedAt,
			cell: (original) => format(original.getValue() as Date, 'PPp')
		},
		{
			header: 'Date Created',
			id: 'createdAt',
			accessorFn: (original) => original.supportTicket.createdAt,
			cell: (original) => format(original.getValue() as Date, 'PPp')
		},
		{
			header: 'Status',
			id: 'status',
			accessorFn: (original) => original.supportTicket.status,
			cell: (original) =>
				flexRender(Badge, {
					value: original.getValue(),
					class: cn(
						original.getValue() === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
						original.getValue() === 'NEW' && 'bg-green-400 hover:bg-bg-green-500',
						original.getValue() === 'CLOSED' && 'bg-red-500 hover:bg-red-600'
					)
				})
		}
	];
	const adminColumns: ColumnDef<SupportTicketResult>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.supportTicket.id,
			cell: (original) =>
				flexRender(ViewLink, {
					href: `/support/ticket/${original.getValue()}`
				})
		},
		{
			header: 'Title',
			id: 'title',
			accessorFn: (original) => original.supportTicket.title
		},
		{
			header: 'Opened By',
			id: 'reportedBy',
			accessorFn: (original) => `${original.reportedBy?.lastName}`
		},
		{
			header: 'Date Created',
			id: 'createdAt',
			accessorFn: (original) => original.supportTicket.createdAt,
			cell: (original) => format(original.getValue() as Date, 'PP')
		},
		{
			header: 'Status',
			id: 'status',
			accessorFn: (original) => original.supportTicket.status,
			cell: (original) =>
				flexRender(Badge, {
					value: original.getValue(),
					class: cn(
						original.getValue() === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
						original.getValue() === 'NEW' && 'bg-green-400 hover:bg-bg-green-500',
						original.getValue() === 'CLOSED' && 'bg-red-500 hover:bg-red-600'
					)
				})
		}
	];

	const options = writable<TableOptions<SupportTicketResult>>({
		data: tableData,
		columns: user?.role === USER_ROLES.SUPERADMIN ? adminColumns : clientColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	onMount(() => {
		tableData = (tickets as SupportTicketResult[]) ?? [];
		options.update((o) => ({ ...o, data: tableData }));
	});

	const table = createSvelteTable(options);
</script>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class=" flex items-center justify-between flex-wrap">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Support</h1>
		<NewSupportTicketDialog bind:open {user} bind:form />
	</div>
	<!-- {#if user.role === USER_ROLES.SUPERADMIN}{/if} -->
	{#if user.role === USER_ROLES.CLIENT || user.role === USER_ROLES.CLIENT_STAFF}
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
	{/if}
</section>
