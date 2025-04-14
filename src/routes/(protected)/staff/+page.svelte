<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { STAFF_ROLE_ENUM } from '$lib/config/constants.js';
	import type {
		ClientStaffResults,
		ClientStaffWithLocationRaw
	} from '$lib/server/database/queries/clients';
	import { cn } from '$lib/utils';
	import NewStaffInviteForm from '$lib/views/client/newStaffInviteForm.svelte';
	import {
		type ColumnDef,
		type TableOptions,
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		getSortedRowModel
	} from '@tanstack/svelte-table';
	import { writable } from 'svelte/store';
	let drawerExpanded: boolean = false;
	import ViewLink from '$lib/components/tables/ViewLink.svelte';
	import * as Table from '$lib/components/ui/table';
	import { onMount } from 'svelte';
	import InviteNewStaffDrawer from '$lib/components/drawers/inviteNewStaffDrawer.svelte';
	import type { PageData } from './$types';

	let tableData: ClientStaffResults = [];

	export let data: PageData;
	$: user = data.user;
	$: staff = data.staff;
	$: console.log({ staff });

	$: {
		tableData = (staff as ClientStaffWithLocationRaw[]) || [];
		options.update((o) => ({ ...o, data: tableData }));
	}

	onMount(() => {});

	const staffColumns: ColumnDef<ClientStaffWithLocationRaw>[] = [
		{
			header: '',
			id: 'id',
			accessorFn: (original) => original.id,
			cell: (original) =>
				flexRender(ViewLink, {
					href: `/staff/${original.getValue()}`
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
			header: 'Role',
			id: 'role',
			accessorFn: (original) => {
				const role = original.staff_role as keyof typeof STAFF_ROLE_ENUM;
				return STAFF_ROLE_ENUM[role];
			}
		}
	];

	const options = writable<TableOptions<ClientStaffWithLocationRaw>>({
		data: tableData,
		columns: staffColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const table = createSvelteTable(options);
</script>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class=" flex items-center justify-between flex-wrap">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Staff</h1>
		<InviteNewStaffDrawer inviteForm={{}} />
	</div>
	<div class="column">
		<Table.Root class="table">
			<Table.TableHeader>
				{#each $table.getHeaderGroups() as headerGroup}
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
</section>
