<script lang="ts">
	import {
		CLIENT_STAFF_ROLES,
		SETTINGS_MENU_OPTIONS,
		STAFF_ROLE_ENUM
	} from '$lib/config/constants';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils';
	import * as Alert from '$lib/components/ui/alert';
	import {
		AlertCircle,
		ArrowDown,
		ArrowUp,
		ArrowUpDown,
		ChevronLeft,
		ChevronRight,
		Loader,
		Loader2,
		PlusIcon,
		Shield,
		TrashIcon,
		User,
		Users
	} from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { getLocalTimeZone } from '@internationalized/date';
	import { onMount } from 'svelte';
	import {
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type ColumnDef,
		type TableOptions
	} from '@tanstack/svelte-table';
	import { Badge } from '$lib/components/ui/badge';
	import { writable } from 'svelte/store';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import { goto } from '$app/navigation';
	import { Select } from 'flowbite-svelte';

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

	export let userProfileForm;
	export let passwordForm;
	export let companyForm;
	export let billingInfo;
	export let selectedTab: string;
	export let staff;
	export let searchTerm = '';
	export let staffInviteForm;

	$: confirmPasswordError = $passwordErrors.confirmPassword;
	$: localTimeZone = getLocalTimeZone();
	let inviteDialogOpen: boolean = false;
	let detailsDialogOpen: boolean = false;
	let selectedProfile: StaffProfileData | null = null;
	let activeTab = 'all';
	let inviteEmail = '';
	let inviteRole = '';
	let submitting = false;

	const { form: userFormObj, enhance: userFormEnhance } = superForm(userProfileForm);
	const {
		form: companyFormObj,
		enhance: companyFormEnhance,
		submitting: companyFormSubmitting
	} = superForm(companyForm);
	const {
		form: passwordFormObj,
		enhance: passwordFormEnhance,
		errors: passwordErrors
	} = superForm(passwordForm);

	type StaffInvite = {
		email: string;
		staffRole: keyof typeof CLIENT_STAFF_ROLES;
	};

	const StaffRoleMap = [
		{
			name: 'Admin',
			value: CLIENT_STAFF_ROLES.CLIENT_ADMIN
		},
		{
			name: 'Manager',
			value: CLIENT_STAFF_ROLES.CLIENT_MANAGER
		},
		{
			name: 'Employee',
			value: CLIENT_STAFF_ROLES.CLIENT_EMPLOYEE
		}
	];

	const {
		form: inviteForm,
		errors: inviteErrors,
		enhance: inviteEnhance,
		submitting: inviteSubmitting
	} = superForm(staffInviteForm, {
		resetForm: false,
		onSubmit: ({ formData }) => {
			// Log what's being sent
			console.log('Current form invitees:', $inviteForm.invitees);

			// Add the invitees array as JSON to the formData
			formData.set('invitees', JSON.stringify($inviteForm.invitees));

			submitting = true;
			return true;
		},
		onResult: () => {
			submitting = false;
		}
	});

	// Initialize form.invitees if it doesn't exist
	$: if (!$inviteForm.invitees) {
		$inviteForm.invitees = [];
	}

	const handleAddInvite = (email: string) => {
		const emailExpression = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
		const includes = $inviteForm.invitees.find((invite) => invite.email === email);
		const isEmail = emailExpression.test(email);

		if (!includes && isEmail && inviteRole) {
			$inviteForm.invitees = [
				{
					email,
					staffRole: inviteRole as keyof typeof CLIENT_STAFF_ROLES
				},
				...$inviteForm.invitees
			];
			inviteEmail = '';
			inviteRole = '';
		}
	};

	const handleRemoveInvite = (email: string) => {
		$inviteForm.invitees = $inviteForm.invitees.filter((invite) => invite.email !== email);
	};

	const handleSelectRole = (email: string, role: string) => {
		const inviteeIndex = $inviteForm.invitees.findIndex((invitee) => invitee.email === email);
		if (inviteeIndex !== -1) {
			$inviteForm.invitees[inviteeIndex] = {
				...$inviteForm.invitees[inviteeIndex],
				staffRole: role as keyof typeof CLIENT_STAFF_ROLES
			};
			// Trigger reactivity
			$inviteForm.invitees = [...$inviteForm.invitees];
		}
	};

	const days = [
		{ id: '0', name: 'Sunday' },
		{ id: '1', name: 'Monday' },
		{ id: '2', name: 'Tuesday' },
		{ id: '3', name: 'Wednesday' },
		{ id: '4', name: 'Thursday' },
		{ id: '5', name: 'Friday' },
		{ id: '6', name: 'Saturday' }
	];
	// Filter staff by role
	const filterByRole = (staff: StaffProfileData[], role: string) => {
		switch (role) {
			case 'admin':
				return staff.filter((s) => s.profile.staffRole === 'CLIENT_ADMIN');
			case 'manager':
				return staff.filter((s) => s.profile.staffRole === 'CLIENT_MANAGER');
			case 'employee':
				return staff.filter((s) => s.profile.staffRole === 'CLIENT_EMPLOYEE');
			default:
				return staff;
		}
	};

	// Column definitions
	const columns: ColumnDef<StaffProfileData>[] = [
		// {
		// 	header: '',
		// 	id: 'actions',
		// 	enableSorting: false,
		// 	cell: ({ row }) => (
		// 		<Button
		// 			variant="ghost"
		// 			size="icon"
		// 			class="h-8 w-8"
		// 			on:click={() => handleViewStaff(row.original)}
		// 		>
		// 			<Eye class="h-4 w-4" />
		// 		</Button>
		// 	)
		// },
		{
			header: 'Name',
			id: 'name',
			accessorFn: (row) => `${row.user.lastName}, ${row.user.firstName}`,
			enableSorting: true,
			sortingFn: (rowA, rowB) => {
				const nameA =
					`${rowA.original.user.lastName}, ${rowA.original.user.firstName}`.toLowerCase();
				const nameB =
					`${rowB.original.user.lastName}, ${rowB.original.user.firstName}`.toLowerCase();
				return nameA.localeCompare(nameB);
			}
		},
		{
			header: 'Email',
			id: 'email',
			accessorKey: 'user.email',
			enableSorting: true
		},
		{
			header: 'Role',
			id: 'role',
			accessorFn: (row) => {
				const role = row.profile.staffRole as keyof typeof STAFF_ROLE_ENUM;
				return STAFF_ROLE_ENUM[role] || 'N/A';
			},
			enableSorting: true,
			cell: ({ getValue, row }) => {
				const roleText = getValue() as string;
				const staffRole = row.original.profile.staffRole;

				return flexRender(Badge, {
					value: roleText,
					class: cn(
						'text-xs',
						staffRole === 'CLIENT_ADMIN' && 'bg-purple-100 text-purple-800',
						staffRole === 'CLIENT_MANAGER' && 'bg-blue-100 text-blue-800',
						staffRole === 'CLIENT_EMPLOYEE' && 'bg-gray-100 text-gray-800'
					)
				});
			}
		},
		{
			header: 'Joined',
			id: 'createdAt',
			accessorKey: 'profile.createdAt',
			enableSorting: true,
			sortingFn: (rowA, rowB) => {
				const dateA = new Date(rowA.original.profile.createdAt).getTime();
				const dateB = new Date(rowB.original.profile.createdAt).getTime();
				return dateA - dateB;
			},
			cell: ({ getValue }) => {
				const date = getValue() as Date;
				return new Date(date).toLocaleDateString();
			}
		}
		// {
		// 	id: 'remove',
		// 	header: '',
		// 	enableSorting: false,
		// 	cell: ({ row }) => (
		// 		<Button
		// 			variant="ghost"
		// 			size="icon"
		// 			class="h-8 w-8 text-red-500 hover:text-red-700"
		// 			on:click={() => handleRemoveStaff(row.original)}
		// 		>
		// 			<UserMinus class="h-4 w-4" />
		// 		</Button>
		// 	)
		// }
	];

	// Create separate table instances for each tab
	const createTableOptions = (data: StaffProfileData[]): TableOptions<StaffProfileData> => ({
		data,
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

	// Table options for each tab
	const allOptions = writable<TableOptions<StaffProfileData>>(createTableOptions([]));
	const adminOptions = writable<TableOptions<StaffProfileData>>(createTableOptions([]));
	const managerOptions = writable<TableOptions<StaffProfileData>>(createTableOptions([]));
	const employeeOptions = writable<TableOptions<StaffProfileData>>(createTableOptions([]));

	// Create table instances
	const allTable = createSvelteTable(allOptions);
	const adminTable = createSvelteTable(adminOptions);
	const managerTable = createSvelteTable(managerOptions);
	const employeeTable = createSvelteTable(employeeOptions);

	// Get current active table
	$: currentTable =
		activeTab === 'all'
			? allTable
			: activeTab === 'admin'
				? adminTable
				: activeTab === 'manager'
					? managerTable
					: employeeTable;

	// Update table data when staff changes
	$: {
		const allData = staff;
		const adminData = filterByRole(staff, 'admin');
		const managerData = filterByRole(staff, 'manager');
		const employeeData = filterByRole(staff, 'employee');

		allOptions.update((opts) => ({ ...opts, data: allData, columns }));
		adminOptions.update((opts) => ({ ...opts, data: adminData, columns }));
		managerOptions.update((opts) => ({ ...opts, data: managerData, columns }));
		employeeOptions.update((opts) => ({ ...opts, data: employeeData, columns }));
	}

	onMount(() => {
		const allData = staff;
		const adminData = filterByRole(staff, 'admin');
		const managerData = filterByRole(staff, 'manager');
		const employeeData = filterByRole(staff, 'employee');

		allOptions.update((opts) => ({ ...opts, data: allData, columns }));
		adminOptions.update((opts) => ({ ...opts, data: adminData, columns }));
		managerOptions.update((opts) => ({ ...opts, data: managerData, columns }));
		employeeOptions.update((opts) => ({ ...opts, data: employeeData, columns }));
	});

	// Get tab counts
	$: tabCounts = {
		all: staff.length,
		admin: filterByRole(staff, 'admin').length,
		manager: filterByRole(staff, 'manager').length,
		employee: filterByRole(staff, 'employee').length
	};

	function getSortingIcon(header: any) {
		if (!header.column.getCanSort()) return null;

		const sorted = header.column.getIsSorted();
		if (sorted === 'asc') return ArrowUp;
		if (sorted === 'desc') return ArrowDown;
		return ArrowUpDown;
	}

	function handleSearch(searchTerm: string) {
		if (!searchTerm || searchTerm.trim() === '') {
			goto('/staff');
		} else {
			goto(`/staff?search=${encodeURIComponent(searchTerm.trim())}`);
		}
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch(searchTerm);
		}
	}

	const handleViewStaff = (profile: StaffProfileData) => {
		selectedProfile = profile;
		detailsDialogOpen = true;
		inviteDialogOpen = false;
	};

	const handleCloseDetailsDialog = () => {
		detailsDialogOpen = false;
		selectedProfile = null;
	};
</script>

<div class="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-5 md:grow">
	<div
		class="col-span-5 md:col-span-1 md:border-r border-b md:border-b-0 border-gray-200 h-full flex flex-col gap-2 l pr-6"
	>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.PROFILE)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.PROFILE ? 'bg-gray-50 border-gray-100' : ''
			)}>Profile</button
		>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.COMPANY)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.COMPANY ? 'bg-gray-50 border-gray-100' : ''
			)}>Company Info</button
		>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.PASSWORD)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.PASSWORD ? 'bg-gray-50 border-gray-100' : ''
			)}>Password</button
		>
		<!-- <button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.NOTIFICATIONS)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.NOTIFICATIONS
					? 'bg-gray-50 border-gray-100'
					: ''
			)}>Notifications</button
		> -->
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.STAFF)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.STAFF ? 'bg-gray-50 border-gray-100' : ''
			)}
		>
			Team
		</button>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.BILLING)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.BILLING ? 'bg-gray-50 border-gray-100' : ''
			)}>Billing</button
		>
		<!-- <button
			on:click={() => (selectedTab = 'CLIENT-TEAM')}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === 'CLIENT-TEAM' ? 'bg-gray-50 border-gray-100' : ''
			)}>Team</button
		> -->
	</div>
	<div class="col-span-5 md:col-span-4 pl-4 space-y-4">
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.PROFILE}
			<h2 class="text-3xl font-semibold">Profile Details</h2>
			<form use:userFormEnhance method="POST" action="?/updateUser">
				<div class="grid grid-cols-2 gap-6">
					<!-- {#if errors?._errors?.length}
						<div class="col-span-2">
							<Alert.Root variant="destructive">
								<AlertCircle class="h-4 w-4" />
								<Alert.Title>Error</Alert.Title>
								<Alert.Description>
									{#each errors._errors as error}
										{error}
									{/each}
								</Alert.Description>
							</Alert.Root>
						</div>
					{/if} -->
					<div class="col-span-2 md:col-span-1">
						<Label for="firstName">First Name</Label>
						<Input name="firstName" bind:value={$userFormObj.firstName} />
					</div>
					<div class="col-span-2 md:col-span-1">
						<Label for="lastName">Last Name</Label>
						<Input name="lastName" bind:value={$userFormObj.lastName} />
					</div>
					<div class="col-span-2 md:col-span-1">
						<Label for="email">Email Address</Label>
						<Input name="email" bind:value={$userFormObj.email} />
					</div>
				</div>
				<div class="mt-8">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		{/if}
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.COMPANY}
			<h2 class="text-3xl font-semibold">Company Details</h2>
			<form use:companyFormEnhance method="POST" action="?/updateCompany" class="space-y-8">
				<div class="grid grid-cols-2 gap-6">
					<div class="col-span-2 md:col-span-1">
						<Label for="companyName">Company Name</Label>
						<Input name="companyName" bind:value={$companyFormObj.companyName} />
					</div>

					<!-- <div class="col-span-2 md:col-span-1">
						<Label for="companyLogo">Company Logo</Label>
						<Input name="companyLogo" type="file" accept="image/*" />
					</div> -->

					<div class="col-span-2">
						<Label for="companyDescription">Company Description</Label>
						<Textarea
							name="companyDescription"
							bind:value={$companyFormObj.companyDescription}
							rows={4}
						/>
					</div>

					<div class="col-span-2">
						<Label for="baseLocation">Base Location</Label>
						<Input name="baseLocation" bind:value={$companyFormObj.baseLocation} />
					</div>

					<!-- Operating Hours Section -->
					<div class="col-span-2">
						<h3 class="text-xl font-semibold mb-4">Operating Hours</h3>

						<!-- Replace your current operating hours logic with this -->
						<div class="space-y-4">
							{#each days as day}
								<div class="grid grid-cols-12 gap-4 items-center">
									<div class="col-span-3">
										<Label>{day.name}</Label>
									</div>

									<!-- Just use a regular checkbox instead of the Switch component -->
									<div class="col-span-2 flex items-center gap-2">
										<input
											type="checkbox"
											id="closed-{day.id}"
											checked={!JSON.parse($companyFormObj.operatingHours)[day.id].isClosed}
											on:change={(e) => {
												// Get current hours
												const hours = JSON.parse($companyFormObj.operatingHours);

												// Set isClosed to opposite of checkbox (checkbox represents "open")
												hours[day.id].isClosed = !e.target.checked;

												// If day is closed, reset times to midnight
												if (hours[day.id].isClosed) {
													hours[day.id].openTime = 'T00:00:00.000Z';
													hours[day.id].closeTime = 'T00:00:00.000Z';
												}

												// Update the form data
												$companyFormObj.operatingHours = JSON.stringify(hours);
											}}
										/>
										<Label for="closed-{day.id}">Open</Label>
									</div>

									<!-- Time inputs, only show if day is open -->
									<div class="col-span-3">
										<Input
											disabled={JSON.parse($companyFormObj.operatingHours)[day.id].isClosed}
											type="time"
											value={JSON.parse($companyFormObj.operatingHours)[day.id].openTime.substring(
												0,
												5
											)}
											on:change={(e) => {
												const hours = JSON.parse($companyFormObj.operatingHours);
												hours[day.id].openTime = e.currentTarget.value + ':00-05';
												$companyFormObj.operatingHours = JSON.stringify(hours);
											}}
										/>
									</div>

									<div class="col-span-3">
										<Input
											disabled={JSON.parse($companyFormObj.operatingHours)[day.id].isClosed}
											type="time"
											value={JSON.parse($companyFormObj.operatingHours)[day.id].closeTime.substring(
												0,
												5
											)}
											on:change={(e) => {
												const hours = JSON.parse($companyFormObj.operatingHours);
												hours[day.id].closeTime = e.currentTarget.value + ':00-05';
												$companyFormObj.operatingHours = JSON.stringify(hours);
											}}
										/>
									</div>
								</div>
							{/each}
						</div>

						<input
							type="hidden"
							name="operatingHours"
							bind:value={$companyFormObj.operatingHours}
						/>
					</div>
				</div>
				<div class="mt-8">
					<Button type="submit">
						{#if $companyFormSubmitting}
							<Loader class="mr-2 h-4 w-4 animate-spin" />
						{:else}
							Save Changes
						{/if}
					</Button>
				</div>
			</form>
		{/if}
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.STAFF}
			<h2 class="text-3xl font-semibold">Team Management</h2>
			<p class="text-gray-500">Manage your team members and their roles here.</p>
			<Button class="bg-blue-800 hover:bg-blue-900" on:click={() => (inviteDialogOpen = true)}
				><PlusIcon class="mr-2" size={16} /> Invite Staff</Button
			>
			<div class="mt-4">
				<Tabs.Root bind:value={activeTab} class="">
					<Tabs.List class="grid w-full grid-cols-4">
						<Tabs.Trigger value="all" class="relative">
							All Staff
							{#if tabCounts.all > 0}
								<Badge variant="secondary" class="ml-2 h-5 min-w-5 text-xs" value={tabCounts.all}
								></Badge>
							{/if}
						</Tabs.Trigger>
						<Tabs.Trigger value="admin" class="relative">
							<Shield class="h-4 w-4 mr-1" />
							Admins
							{#if tabCounts.admin > 0}
								<Badge
									variant="secondary"
									class="ml-2 h-5 min-w-5 text-xs bg-purple-100 text-purple-800"
									value={tabCounts.admin}
								></Badge>
							{/if}
						</Tabs.Trigger>
						<Tabs.Trigger value="manager" class="relative">
							<Users class="h-4 w-4 mr-1" />
							Managers
							{#if tabCounts.manager > 0}
								<Badge
									variant="secondary"
									class="ml-2 h-5 min-w-5 text-xs bg-blue-100 text-blue-800"
									value={tabCounts.manager}
								></Badge>
							{/if}
						</Tabs.Trigger>
						<Tabs.Trigger value="employee" class="relative">
							<User class="h-4 w-4 mr-1" />
							Employees
							{#if tabCounts.employee > 0}
								<Badge
									variant="secondary"
									class="ml-2 h-5 min-w-5 text-xs bg-gray-100 text-gray-800"
									value={tabCounts.employee}
								></Badge>
							{/if}
						</Tabs.Trigger>
					</Tabs.List>

					<!-- Tab Contents -->
					{#each ['all', 'admin', 'manager', 'employee'] as tabValue}
						<Tabs.Content value={tabValue} class="">
							{#if activeTab === tabValue}
								<div class="bg-white rounded-lg shadow-sm">
									{#if $currentTable.getRowModel().rows.length > 0}
										<div class="rounded-md border">
											<Table.Root>
												<Table.Header>
													{#each $currentTable.getHeaderGroups() as headerGroup}
														<Table.Row>
															{#each headerGroup.headers as header}
																<Table.Head>
																	{#if header.column.columnDef.header}
																		<Button
																			variant="ghost"
																			on:click={() =>
																				header.column.toggleSorting(
																					header.column.getIsSorted() === 'asc'
																				)}
																			class="hover:bg-gray-50"
																		>
																			{header.column.columnDef.header}
																			{#if header.column.getCanSort()}
																				{#if getSortingIcon(header)}
																					<svelte:component
																						this={getSortingIcon(header)}
																						class="ml-2 h-4 w-4"
																					/>
																				{/if}
																			{/if}
																		</Button>
																	{/if}
																</Table.Head>
															{/each}
														</Table.Row>
													{/each}
												</Table.Header>
												<Table.Body>
													{#each $currentTable.getRowModel().rows as row}
														<Table.Row
															on:click={() => handleViewStaff(row.original)}
															class="hover:bg-muted/50"
														>
															{#each row.getVisibleCells() as cell}
																<Table.Cell>
																	<svelte:component
																		this={flexRender(cell.column.columnDef.cell, cell.getContext())}
																	/>
																</Table.Cell>
															{/each}
														</Table.Row>
													{/each}
												</Table.Body>
											</Table.Root>
										</div>

										<!-- Pagination -->
										<div class="flex items-center justify-between space-x-2 p-4 border-t">
											<div class="flex-1 text-sm text-muted-foreground">
												Showing {$currentTable.getState().pagination.pageIndex *
													$currentTable.getState().pagination.pageSize +
													1} to {Math.min(
													($currentTable.getState().pagination.pageIndex + 1) *
														$currentTable.getState().pagination.pageSize,
													$currentTable.getRowModel().rows.length
												)} of {$currentTable.getRowModel().rows.length} staff members
											</div>
											<div class="flex items-center space-x-2">
												<Button
													variant="outline"
													size="sm"
													on:click={() => $currentTable.previousPage()}
													disabled={!$currentTable.getCanPreviousPage()}
												>
													<ChevronLeft class="h-4 w-4" />
													Previous
												</Button>
												<div class="flex items-center space-x-1">
													<span class="text-sm text-muted-foreground">
														Page {$currentTable.getState().pagination.pageIndex + 1} of {$currentTable.getPageCount()}
													</span>
												</div>
												<Button
													variant="outline"
													size="sm"
													on:click={() => $currentTable.nextPage()}
													disabled={!$currentTable.getCanNextPage()}
												>
													Next
													<ChevronRight class="h-4 w-4" />
												</Button>
											</div>
										</div>
									{:else}
										<!-- Empty state for specific tab -->
										<div class="flex flex-col items-center justify-center py-12 text-center">
											<div
												class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
											>
												{#if activeTab === 'admin'}
													<Shield class="w-8 h-8 text-purple-500" />
												{:else if activeTab === 'manager'}
													<Users class="w-8 h-8 text-blue-500" />
												{:else if activeTab === 'employee'}
													<User class="w-8 h-8 text-gray-500" />
												{:else}
													<Users class="w-8 h-8 text-gray-400" />
												{/if}
											</div>
											<h3 class="text-lg font-medium text-gray-900 mb-2">
												No {activeTab === 'all'
													? 'staff members'
													: activeTab === 'admin'
														? 'admins'
														: activeTab === 'manager'
															? 'managers'
															: 'employees'} found
											</h3>
											<p class="text-sm text-gray-500">
												{#if searchTerm}
													Try adjusting your search terms
												{:else}
													No {activeTab === 'all' ? 'staff members' : `${activeTab}s`} in this category
													yet.
												{/if}
											</p>
										</div>
									{/if}
								</div>
							{/if}
						</Tabs.Content>
					{/each}
				</Tabs.Root>
			</div>
		{/if}
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.PASSWORD}
			<h2 class="text-3xl font-semibold">Change Password</h2>
			<form use:passwordFormEnhance method="POST" action="?/updatePassword">
				<div class="grid grid-cols-2 gap-6">
					{#if confirmPasswordError}
						<div class="col-span-2">
							<Alert.Root variant="destructive">
								<AlertCircle class="h-4 w-4" />
								<Alert.Title>Error</Alert.Title>
								<Alert.Description>
									{confirmPasswordError}
								</Alert.Description>
							</Alert.Root>
						</div>
					{/if}
					<div class="col-span-2 md:col-span-1">
						<Label for="password">Current Password</Label>
						<Input type="password" name="password" bind:value={$passwordFormObj.password} />
					</div>
					<div class="col-span-2 md:col-span-1"></div>
					<div class="col-span-2 md:col-span-1">
						<Label for="newPassword">New Password</Label>
						<Input type="password" name="newPassword" bind:value={$passwordFormObj.newPassword} />
					</div>
					<div class="col-span-2 md:col-span-1"></div>
					<div class="col-span-2 md:col-span-1">
						<Label for="confirmPassword">Confirm New Password</Label>
						<Input
							type="password"
							name="confirmPassword"
							bind:value={$passwordFormObj.confirmPassword}
						/>
					</div>
				</div>
				<div class="mt-8">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		{/if}
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.BILLING}
			<div class="space-y-6">
				<h2 class="text-3xl font-semibold">Billing & Subscription</h2>

				<!-- Current Plan/Subscription Card -->
				<div class="border rounded-lg p-6 space-y-4">
					<div class="flex justify-between items-start">
						<div>
							<h3 class="text-xl font-semibold">Current Plan</h3>
							{#if billingInfo?.clientSubscription?.stripeCustomerId}
								<p class="text-sm text-gray-500">
									Next billing date: {new Date(
										billingInfo.subscription?.currentPeriodEnd
									).toLocaleDateString()}
								</p>
							{:else}
								<p class="text-sm text-gray-500">No active subscription</p>
							{/if}
						</div>
						{#if billingInfo?.subscription}
							<div class="text-right">
								<p class="text-2xl font-bold">${billingInfo.subscription.amount}</p>
								<p class="text-sm text-gray-500">per {billingInfo.subscription.interval}</p>
							</div>
						{/if}
					</div>

					<!-- Payment Method if exists -->
					{#if billingInfo?.paymentMethod}
						<div class="border-t pt-4 mt-4">
							<h4 class="font-medium mb-3">Payment Method</h4>
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
								<div class="flex items-center gap-3">
									<div class="p-2 bg-white rounded border">
										<svg
											class="w-6 h-6"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
											<line x1="1" y1="10" x2="23" y2="10"></line>
										</svg>
									</div>
									<div>
										<p class="font-medium">•••• {billingInfo.paymentMethod.last4}</p>
										<p class="text-sm text-gray-500">
											Expires {billingInfo.paymentMethod.expiryMonth}/{billingInfo.paymentMethod
												.expiryYear}
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Action Button -->
					<div class="pt-4 mt-4 border-t">
						{#if billingInfo?.clientSubscription?.stripeCustomerId}
							<Button
								class="w-fit bg-blue-600 hover:bg-blue-700"
								on:click={async () => {
									try {
										const response = await fetch('/api/stripe/create-portal-session', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											}
										});

										if (!response.ok) throw new Error('Failed to create portal session');

										const { url } = await response.json();
										window.location.href = url;
									} catch (error) {
										console.error('Error creating portal session:', error);
									}
								}}
							>
								Manage Subscription in Stripe
							</Button>
						{:else}
							<Button
								class="w-full md:w-fit bg-blue-600 hover:bg-blue-700"
								on:click={async () => {
									try {
										const response = await fetch('/api/stripe/create-checkout-session', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											},
											body: JSON.stringify({
												priceId: 'price_1RDtHDRdAMZLgbMga3fTw2vq' // Replace with your price ID
											})
										});

										if (!response.ok) throw new Error('Failed to create checkout session');

										const { url } = await response.json();
										window.location.href = url;
									} catch (error) {
										console.error('Error creating checkout session:', error);
									}
								}}
							>
								Subscribe Now
							</Button>
						{/if}
					</div>
				</div>

				<!-- Billing History -->
				{#if billingInfo?.invoices?.length}
					<div class="border rounded-lg p-6">
						<h3 class="text-xl font-semibold mb-4">Billing History</h3>
						<div class="space-y-3">
							{#each billingInfo.invoices as invoice}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
									<div>
										<p class="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
										<p class="text-sm text-gray-500">${invoice.amount}</p>
									</div>
									<div class="flex items-center gap-3">
										<span
											class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
										>
											{invoice.status}
										</span>
										{#if invoice.pdfUrl}
											<a
												href={invoice.pdfUrl}
												class="text-sm text-blue-600 hover:text-blue-800"
												target="_blank"
												rel="noopener noreferrer"
											>
												Download
											</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Staff Details Dialog -->
<Dialog.Root bind:open={detailsDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Staff Details</Dialog.Title>
		</Dialog.Header>
		<div>
			{#if selectedProfile}
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
							<User class="h-6 w-6 text-blue-600" />
						</div>
						<div>
							<p class="font-semibold">
								{selectedProfile.user.firstName}
								{selectedProfile.user.lastName}
							</p>
							<p class="text-sm text-muted-foreground">{selectedProfile.user.email}</p>
						</div>
					</div>

					{#if selectedProfile.profile.staffRole}
						<div class="flex items-center gap-2">
							<strong>Role:</strong>
							<!-- <Badge
								variant="secondary"
								class={cn(
									'text-xs',
									selectedProfile.profile.staffRole === 'CLIENT_ADMIN' && 'bg-purple-100 text-purple-800',
									selectedProfile.profile.staffRole === 'CLIENT_MANAGER' && 'bg-blue-100 text-blue-800',
									selectedProfile.profile.staffRole === 'CLIENT_EMPLOYEE' && 'bg-gray-100 text-gray-800'
								)}
							>
								{selectedProfile.profile.staffRole === 'CLIENT_ADMIN' && <Shield class="h-3 w-3 mr-1" />}
								{selectedProfile.profile.staffRole === 'CLIENT_MANAGER' && <Users class="h-3 w-3 mr-1" />}
								{selectedProfile.profile.staffRole === 'CLIENT_EMPLOYEE' && <User class="h-3 w-3 mr-1" />}
								{STAFF_ROLE_ENUM[selectedProfile.profile.staffRole]}
							</Badge> -->
						</div>
					{/if}

					<p><strong>Birthday:</strong> {selectedProfile.profile.birthday || 'N/A'}</p>
					<p>
						<strong>Joined:</strong>
						{new Date(selectedProfile.profile.createdAt).toLocaleDateString()}
					</p>
				</div>
			{:else}
				<p>No staff profile selected.</p>
			{/if}
		</div>
		<Dialog.Footer>
			<Dialog.Close asChild>
				<Button on:click={handleCloseDetailsDialog} variant="outline" type="button" class="w-full">
					Close
				</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Staff Invite Dialog -->
<Dialog.Root bind:open={inviteDialogOpen}>
	<Dialog.Content>
		<form class="w-full" method="POST" use:inviteEnhance action="?/sendClientStaffInvites">
			<Dialog.Header>
				<Dialog.Title>Invite New Staff Members</Dialog.Title>
				<Dialog.Description>
					Add your staff emails to send them invites to sign up with their own accounts.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid grid-cols-12 gap-4">
				<Input
					name="email"
					bind:value={inviteEmail}
					class="col-span-12 md:col-span-6"
					placeholder="Email address"
				/>
				<Select class="col-span-12 md:col-span-4" bind:value={inviteRole} placeholder="Select Role">
					{#each StaffRoleMap as role}
						<option value={role.value}>{role.name}</option>
					{/each}
				</Select>
				<Button
					class="col-span-12 md:col-span-2 bg-green-400 hover:bg-green-500"
					type="button"
					disabled={!inviteEmail || !inviteRole}
					on:click={() => handleAddInvite(inviteEmail)}
				>
					Add
				</Button>
			</div>

			<div class="mt-8 flex flex-col divide-y">
				{#each $inviteForm.invitees as invitee}
					<div class="flex justify-between gap-4 py-4">
						<p>{invitee.email}</p>
						<div class="flex gap-2 items-center">
							<Select
								value={invitee.staffRole}
								on:change={(e) => handleSelectRole(invitee.email, e.target?.value)}
							>
								{#each StaffRoleMap as role}
									<option value={role.value}>{role.name}</option>
								{/each}
							</Select>
							<Button on:click={() => handleRemoveInvite(invitee.email)} variant="destructive">
								<TrashIcon />
							</Button>
						</div>
					</div>
				{/each}
			</div>
			{#each $inviteForm.invitees as invitee, i}
				<input type="hidden" name={`invitees[${i}][email]`} value={invitee.email} />
				<input type="hidden" name={`invitees[${i}][staffRole]`} value={invitee.staffRole} />
			{/each}

			<Dialog.Footer>
				<Button
					type="submit"
					class="ml-auto bg-blue-800 hover:bg-blue-900"
					disabled={submitting || $inviteForm.invitees.length === 0}
				>
					{#if submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Sending Invites...
					{:else}
						Send Invites
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
