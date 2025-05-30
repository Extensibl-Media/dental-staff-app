<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { STAFF_ROLE_ENUM } from '$lib/config/constants.js';
	import {
		type ColumnDef,
		type TableOptions,
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		getSortedRowModel
	} from '@tanstack/svelte-table';
	import { writable } from 'svelte/store';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { Eye, UserMinus } from 'lucide-svelte';
	import InviteNewStaffDialog from '$lib/components/dialogs/inviteNewStaffDialog.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let tableData: StaffProfileData[] = [];

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

	export let data: PageData;
	let open: boolean = false;
	let detailsDialogOpen: boolean = false;
	let selectedProfile: StaffProfileData | null = null;

	$: user = data.user;
	$: staff = data.staff;
	$: locations = data.locations;
	$: company = data.company;
	$: inviteForm = data.inviteForm;
	$: console.log({ staff });

	$: {
		tableData = (staff as StaffProfileData[]) || [];
		options.update((o) => ({ ...o, data: tableData }));
	}

	onMount(() => {
		tableData = (staff as StaffProfileData[]) || [];
		options.update((o) => ({ ...o, data: tableData }));
	});

	const staffColumns: ColumnDef<StaffProfileData>[] = [
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

	const options = writable<TableOptions<StaffProfileData>>({
		data: tableData,
		columns: staffColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const handleViewStaff = (profile: StaffProfileData) => {
		selectedProfile = profile;
		detailsDialogOpen = true;
		open = false; // Close the invite dialog if open
	};

	const handleCloseDetailsDialog = () => {
		detailsDialogOpen = false;
		selectedProfile = null;
	};

	const table = createSvelteTable(options);
</script>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class=" flex items-center justify-between flex-wrap">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Staff</h1>
		<InviteNewStaffDialog {open} {inviteForm} {locations} {company} />
	</div>
	<div class="column">
		<Table class="bg-white">
			<TableHeader>
				{#each $table.getHeaderGroups() as headerGroup}
					<TableRow>
						{#each headerGroup.headers as header}
							<TableHead>
								<svelte:component
									this={flexRender(header.column.columnDef.header, header.getContext())}
								/>
							</TableHead>
						{/each}
					</TableRow>
				{/each}
			</TableHeader>
			<TableBody>
				{#each $table.getRowModel().rows as row}
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
								<Button
									on:click={() => handleViewStaff(row.getAllCells()[0].row.original)}
									variant="ghost"
									size="icon"
									class="h-8 w-8"
								>
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
</section>

<Dialog.Root bind:open={detailsDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Staff Details</Dialog.Title>
		</Dialog.Header>
		<div>
			{#if selectedProfile}
				<div class="space-y-4">
					<p>
						<strong>Name:</strong>
						{selectedProfile.user.firstName}
						{selectedProfile.user.lastName}
					</p>
					<p><strong>Email:</strong> {selectedProfile.user.email}</p>
					{#if selectedProfile.profile.staffRole}
						<p>
							<strong>Role:</strong>
							{STAFF_ROLE_ENUM[selectedProfile.profile.staffRole]}
						</p>
					{/if}
					<p><strong>Birthday:</strong> {selectedProfile.profile.birthday || 'N/A'}</p>
					<p>
						<strong>Created At:</strong>
						{new Date(selectedProfile.profile.createdAt).toLocaleDateString()}
					</p>
				</div>
			{:else}
				<p>No staff profile selected.</p>
			{/if}
		</div>
		<Dialog.Footer>
			<Dialog.Close asChild>
				<Button on:click={handleCloseDetailsDialog} variant="outline" type="button" class="w-full"
					>Close</Button
				>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
