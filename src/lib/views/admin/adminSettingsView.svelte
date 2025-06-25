<script lang="ts">
	import { SETTINGS_MENU_OPTIONS } from '$lib/config/constants';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils';
	import * as Alert from '$lib/components/ui/alert';
	import { AlertCircle } from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';

	export let userProfileForm;
	export let passwordForm;
	export let selectedTab: string;

	$: confirmPasswordError = $passwordErrors.confirmPassword;

	const { form: userFormObj, enhance: userFormEnhance } = superForm(userProfileForm);
	const {
		form: passwordFormObj,
		enhance: passwordFormEnhance,
		errors: passwordErrors
	} = superForm(passwordForm);
</script>

<div class="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-5 md:grow">
	<div
		class="col-span-5 md:col-span-1 md:border-r border-b md:border-b-0 border-gray-200 h-full flex flex-col gap-2 l pr-6"
	>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.ADMIN.PROFILE)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.ADMIN.PROFILE ? 'bg-gray-50 border-gray-100' : ''
			)}>Profile</button
		>
		<!-- <button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.COMPANY)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.COMPANY ? 'bg-gray-50 border-gray-100' : ''
			)}>Company Info</button
		> -->
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.ADMIN.PASSWORD)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.ADMIN.PASSWORD ? 'bg-gray-50 border-gray-100' : ''
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
		<!-- <button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.ADMIN.TEAM)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.STAFF ? 'bg-gray-50 border-gray-100' : ''
			)}
		>
			Team
		</button> -->
		<!-- <button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.BILLING)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.BILLING ? 'bg-gray-50 border-gray-100' : ''
			)}>Billing</button
		> -->
		<!-- <button
			on:click={() => (selectedTab = 'CLIENT-TEAM')}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === 'CLIENT-TEAM' ? 'bg-gray-50 border-gray-100' : ''
			)}>Team</button
		> -->
	</div>
	<div class="col-span-5 md:col-span-4 pl-4 space-y-4">
		{#if selectedTab === SETTINGS_MENU_OPTIONS.ADMIN.PROFILE}
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
		<!-- {#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.COMPANY}
			<h2 class="text-3xl font-semibold">Company Details</h2>
			<form use:companyFormEnhance method="POST" action="?/updateCompany" class="space-y-8">
				<div class="grid grid-cols-2 gap-6">
					<div class="col-span-2 md:col-span-1">
						<Label for="companyName">Company Name</Label>
						<Input name="companyName" bind:value={$companyFormObj.companyName} />
					</div>
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

					<div class="col-span-2">
						<h3 class="text-xl font-semibold mb-4">Operating Hours</h3>

						<div class="space-y-4">
							{#each days as day}
								<div class="grid grid-cols-12 gap-4 items-center">
									<div class="col-span-3">
										<Label>{day.name}</Label>
									</div>
									<div class="col-span-2 flex items-center gap-2">
										<input
											type="checkbox"
											id="closed-{day.id}"
											checked={!JSON.parse($companyFormObj.operatingHours)[day.id].isClosed}
											on:change={(e) => {
												const hours = JSON.parse($companyFormObj.operatingHours);

												hours[day.id].isClosed = !e.target.checked;

												if (hours[day.id].isClosed) {
													hours[day.id].openTime = 'T00:00:00.000Z';
													hours[day.id].closeTime = 'T00:00:00.000Z';
												}

												$companyFormObj.operatingHours = JSON.stringify(hours);
											}}
										/>
										<Label for="closed-{day.id}">Open</Label>
									</div>

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
		{/if} -->
		<!-- {#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.STAFF}
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
		{/if} -->
		{#if selectedTab === SETTINGS_MENU_OPTIONS.ADMIN.PASSWORD}
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
	</div>
</div>

<!-- Staff Details Dialog -->
<!-- <Dialog.Root bind:open={detailsDialogOpen}>
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
							<Badge
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
							</Badge>
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
</Dialog.Root> -->

<!-- Staff Invite Dialog -->
<!-- <Dialog.Root bind:open={inviteDialogOpen}>
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
</Dialog.Root> -->
