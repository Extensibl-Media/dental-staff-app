<script lang="ts">
	import type { ClientCompanyLocation } from '$lib/server/database/schemas/client';
	import { CANDIDATE_STATUS, STAFF_ROLE_ENUM, USER_ROLES } from '$lib/config/constants';
	import type { PageData } from './$types';
	import convertNameToInitials from '$lib/_helpers/convertNameToInitials';
	import { getDayName } from '$lib/_helpers';

	// ShadcnUI Components
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import {
		Dialog,
		DialogClose,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';

	// Lucide Icons
	import {
		AlertCircle,
		Briefcase,
		Building,
		Calendar as CalendarIcon,
		ChevronRight,
		ChevronLeft,
		Clock,
		ClipboardList,
		CreditCard,
		Edit,
		Eye,
		FilePlus,
		FileText,
		Mail,
		MapPin,
		MessageSquare,
		Phone,
		Plus,
		Receipt,
		User,
		Users,
		CalendarDays,
		UserMinus,
		Trash2
	} from 'lucide-svelte';

	// Table library
	import {
		getCoreRowModel,
		type ColumnDef,
		getSortedRowModel,
		getPaginationRowModel,
		type TableOptions,
		createSvelteTable,
		flexRender
	} from '@tanstack/svelte-table';

	// Other imports
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import Calendar from '$lib/components/calendar/calendar.svelte';
	import { cn } from '$lib/utils';
	import type { CalendarEvent } from '$lib/types';
	import { goto } from '$app/navigation';
	import type {
		InvoiceSelect,
		InvoiceWithRelations
	} from '$lib/server/database/schemas/requisition';
	import { superForm } from 'sveltekit-superforms/client';

	export let data: PageData;
	let initials: string = '';
	let locationTableData: ClientCompanyLocation[] = [];
	let showInvoiceDialog = false;
	let selectedEvent: CalendarEvent | null = null;
	let dialogOpen: boolean = false;
	let detailsDialogOpen: boolean = false;
	let selectedProfile: StaffProfileData | null = null;
	let tableData: StaffProfileData[] = [];
	let invoiceTableData: InvoiceWithRelations[] = [];

	const {
		form: invoiceForm,
		enhance,
		submitting: invoiceFormSubmitting,
		errors: invoiceFormError
	} = superForm(data.invoiceForm, {
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				showInvoiceDialog = false;
				// Reset form to initial state
				$invoiceForm = {
					amount: 0,
					dueDate: '',
					description: '',
					items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
				};
			}
		}
	});

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
		primaryLocation: {
			id: string;
			name: string;
			streetOne: string;
			streetTwo: string;
			city: string;
			state: string;
			zipcode: string;
			isPrimary: boolean;
		} | null;
	};

	type SupportTicket = {
		id: string;
		title: string;
		status: string | null;
		createdAt: string | Date;
		// Add other properties as needed
	};

	const selectEvent = (event: CalendarEvent) => {
		selectedEvent = event;
		dialogOpen = true;
	};

	// Reactive declarations
	$: user = data.user;
	$: isAdmin = user?.role === USER_ROLES.SUPERADMIN;
	$: client = data.client;
	$: locations = data.client?.locations || [];
	$: requisitions = data.requisitions || [];
	$: supportTickets = data.supportTickets || [];
	$: staff = data.staff || [];
	$: invoices = data.invoices || [];

	$: {
		locationTableData = locations;
	}

	$: {
		if (client) {
			initials = convertNameToInitials(client.user.firstName, client.user.lastName);
		}
	}

	$: {
		invoiceTableData = invoices;
	}

	const supportColumns: ColumnDef<SupportTicket>[] = [
		{
			header: 'Title',
			accessorFn: (original) => original.title
		},
		{
			header: 'Status',
			id: 'status',
			accessorFn: (original) => original.status,
			cell: ({ getValue }) => {
				const status = getValue() as string;
				return flexRender(Badge, {
					value: status,
					class: cn(
						status === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
						status === 'NEW' && 'bg-green-400 hover:bg-bg-green-500',
						status === 'CLOSED' && 'bg-red-500 hover:bg-red-600'
					)
				});
			}
		},
		{
			header: 'Created At',
			accessorFn: (original) => new Date(original.createdAt).toLocaleDateString()
		}
	];

	const supportOptions = writable<TableOptions<SupportTicket>>({
		data: supportTickets,
		columns: supportColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 5
			}
		}
	});

	// Table configuration for locations (unchanged)
	const locationColumns: ColumnDef<ClientCompanyLocation>[] = [
		{
			header: 'Name',
			accessorFn: (original) => original.name
		},
		{
			header: 'City',
			accessorFn: (original) => original.city
		},
		{
			header: 'State',
			accessorFn: (original) => original.state
		}
	];

	const locationOptions = writable<TableOptions<ClientCompanyLocation>>({
		data: locationTableData,
		columns: locationColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(), // Add this line
		initialState: {
			pagination: {
				pageSize: 5 // Add this configuration
			}
		}
	});

	// Staff table configuration with pagination
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

	const staffOptions = writable<TableOptions<StaffProfileData>>({
		data: tableData,
		columns: staffColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 5
			}
		}
	});

	// Invoice table configuration with pagination
	const invoiceColumns: ColumnDef<InvoiceWithRelations>[] = [
		{
			header: 'Invoice ID',
			accessorFn: (original) => original.invoice.invoiceNumber
		},
		{
			header: 'Amount',
			accessorFn: (original) => {
				const amount = original.invoice.amountDue || original.invoice.total || 0;
				return `$${(+amount).toFixed(2)}`;
			}
		},
		{
			header: 'Status',
			accessorFn: (original) => original.invoice.status,
			cell: ({ getValue }) => {
				const status = getValue() as string;
				return flexRender(Badge, {
					value: status.toLocaleUpperCase(),
					class: cn(
						status === 'open' && 'bg-blue-500 hover:bg-blue-600',
						status === 'paid' && 'bg-green-400 hover:bg-bg-green-500',
						status === 'void' && 'bg-gray-300 hover:bg-gray-400'
					)
				});
			}
		},
		{
			header: 'Due Date',
			accessorFn: (original) => {
				const dueDate = original.invoice.dueDate;
				return dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date';
			}
		},
		{
			header: 'Created',
			accessorFn: (original) => new Date(original.invoice.createdAt).toLocaleDateString()
		}
	];

	const invoiceOptions = writable<TableOptions<InvoiceWithRelations>>({
		data: invoiceTableData,
		columns: invoiceColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 5
			}
		}
	});

	$: {
		locationTableData = (locations as ClientCompanyLocation[]) ?? [];
		locationOptions.update((o) => ({ ...o, data: locationTableData }));

		tableData = (staff as StaffProfileData[]) || [];
		staffOptions.update((o) => ({ ...o, data: tableData }));

		invoiceTableData = invoices || [];
		invoiceOptions.update((o) => ({ ...o, data: invoiceTableData }));
		supportOptions.update((o) => ({ ...o, data: supportTickets }));
	}

	onMount(() => {
		locationTableData = (locations as ClientCompanyLocation[]) ?? [];
		locationOptions.update((o) => ({ ...o, data: locationTableData }));

		tableData = (staff as StaffProfileData[]) || [];
		staffOptions.update((o) => ({ ...o, data: tableData }));

		invoiceTableData = invoices || [];
		invoiceOptions.update((o) => ({ ...o, data: invoiceTableData }));
		supportOptions.update((o) => ({ ...o, data: supportTickets }));
	});

	const locationTable = createSvelteTable(locationOptions);
	const staffTable = createSvelteTable(staffOptions);
	const invoiceTable = createSvelteTable(invoiceOptions);
	const supportTable = createSvelteTable(supportOptions);

	function addInvoiceItem() {
		items = [...items, { description: '', quantity: 1, rate: 0, amount: 0 }];
	}

	function removeInvoiceItem(index: number) {
		if (items.length > 1) {
			items = items.filter((_, i) => i !== index);
		}
	}

	function updateItemAmount(index: number) {
		const item = items[index];
		if (item) {
			item.amount = (item.quantity || 0) * (item.rate || 0);
			items = [...items];
		}
	}

	const handleViewStaff = (profile: StaffProfileData) => {
		selectedProfile = profile;
		detailsDialogOpen = true;
	};

	const handleCloseDetailsDialog = () => {
		detailsDialogOpen = false;
		selectedProfile = null;
	};

	$: $invoiceForm.amount = items.reduce((total, item) => total + item.amount, 0);
	// Separate reactive variable for items management
	let items = [{ description: '', quantity: 1, rate: 0, amount: 0 }];

	// Sync items to form whenever items change
	$: $invoiceForm.items = JSON.stringify(items);
	$: console.log(selectedProfile);
</script>

{#if client}
	<section class="container mx-auto px-4 py-6">
		<div class="flex flex-col gap-6">
			<!-- Header with client info -->
			<div class="bg-white rounded-lg shadow-sm p-6">
				<div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
					<div class="h-24 w-24 md:h-32 md:w-32 relative">
						{#if client.user.avatarUrl}
							<img
								src={client.user.avatarUrl}
								alt={`${client.user.firstName} ${client.user.lastName}`}
								class="rounded-lg h-full w-full object-cover"
							/>
						{:else}
							<div class="bg-gray-300 rounded-lg h-full w-full flex items-center justify-center">
								<span class="text-4xl md:text-5xl font-semibold">{initials}</span>
							</div>
						{/if}
					</div>

					<div class="flex-1">
						<div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
							<div>
								<h1 class="text-3xl md:text-4xl font-bold">
									{client.user.firstName}
									{client.user.lastName}
								</h1>
								<div class="mt-2 text-xl font-medium text-gray-700">
									{client.company.companyName}
								</div>
							</div>

							<div class="flex gap-2 mt-3 md:mt-0">
								<Button
									variant="outline"
									size="sm"
									class="gap-1"
									on:click={() => (showInvoiceDialog = true)}
								>
									<CreditCard class="h-4 w-4" />
									<span>Create Invoice</span>
								</Button>
							</div>
						</div>

						<div class="mt-4 flex flex-col sm:flex-row gap-4 text-sm">
							<div class="flex items-center gap-2">
								<Mail class="h-4 w-4 text-gray-500" />
								<a href={`mailto:${client.user.email}`} class="text-blue-600 hover:underline"
									>{client.user.email}</a
								>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- One-off Invoice Dialog -->
			<Dialog bind:open={showInvoiceDialog}>
				<DialogContent class="sm:max-w-[600px] max-h-screen overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Create One-Off Invoice</DialogTitle>
						<DialogDescription>
							Create a custom invoice for this client. Fill in all the necessary details below.
						</DialogDescription>
					</DialogHeader>

					<form method="POST" action="?/createInvoice" use:enhance>
						<div class="grid gap-4 py-4">
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="dueDate">Due Date</Label>
									<Input
										id="dueDate"
										name="dueDate"
										type="date"
										bind:value={$invoiceForm.dueDate}
									/>
									{#if $invoiceFormError.dueDate}
										<p class="text-sm text-destructive">{$invoiceFormError.dueDate}</p>
									{/if}
								</div>
							</div>

							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Label>Invoice Items</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										on:click={addInvoiceItem}
										class="gap-1"
									>
										<Plus class="h-4 w-4" />
										<span>Add Item</span>
									</Button>
								</div>

								<div class="border rounded-md">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Description</TableHead>
												<TableHead class="w-20">Qty</TableHead>
												<TableHead class="w-24">Rate</TableHead>
												<TableHead class="w-24">Amount</TableHead>
												<TableHead class="w-12"></TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each items as item, i}
												<TableRow>
													<TableCell>
														<Input bind:value={item.description} placeholder="Item description" />
													</TableCell>
													<TableCell>
														<Input
															type="number"
															bind:value={item.quantity}
															on:change={() => updateItemAmount(i)}
															min="1"
														/>
													</TableCell>
													<TableCell>
														<Input
															type="number"
															bind:value={item.rate}
															on:change={() => updateItemAmount(i)}
															min="0"
															step="0.01"
														/>
													</TableCell>
													<TableCell>
														${(item.amount || 0).toFixed(2)}
													</TableCell>
													<TableCell>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															class="h-8 w-8 p-0 text-destructive hover:text-destructive"
															on:click={() => removeInvoiceItem(i)}
															disabled={items.length <= 1}
														>
															<Trash2 class="h-4 w-4" />
														</Button>
													</TableCell>
												</TableRow>
											{/each}
											<TableRow>
												<TableCell colspan={4} class="text-right font-bold">Total:</TableCell>
												<TableCell class="font-bold"
													>${($invoiceForm.amount || 0).toFixed(2)}</TableCell
												>
											</TableRow>
										</TableBody>
									</Table>
								</div>
								{#if $invoiceFormError.items}
									<p class="text-sm text-destructive">{$invoiceFormError.items}</p>
								{/if}
							</div>

							<div class="space-y-2">
								<Label for="description">Additional Notes</Label>
								<Textarea
									id="description"
									name="description"
									bind:value={$invoiceForm.description}
									placeholder="Add any additional notes or information"
								/>
								{#if $invoiceFormError.description}
									<p class="text-sm text-destructive">{$invoiceFormError.description}</p>
								{/if}
							</div>

							<!-- Hidden fields to sync with form -->
							<input type="hidden" name="items" bind:value={$invoiceForm.items} />
							<input type="hidden" name="amount" bind:value={$invoiceForm.amount} />
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" on:click={() => (showInvoiceDialog = false)}
								>Cancel</Button
							>
							<Button type="submit" disabled={$invoiceFormSubmitting}>
								{#if $invoiceFormSubmitting}
									Creating...
								{:else}
									Create Invoice
								{/if}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<!-- Tabs section -->
			<Tabs class="w-full">
				<TabsList class="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 gap-2 h-fit">
					<TabsTrigger value="profile" class="flex items-center gap-2">
						<Users class="h-4 w-4" />
						<span class="hidden md:inline">Profile</span>
					</TabsTrigger>
					<TabsTrigger value="locations" class="flex items-center gap-2">
						<Building class="h-4 w-4" />
						<span class="hidden md:inline">Locations</span>
					</TabsTrigger>
					<TabsTrigger value="requisitions" class="flex items-center gap-2">
						<ClipboardList class="h-4 w-4" />
						<span class="hidden md:inline">Requisitions</span>
					</TabsTrigger>
					<TabsTrigger value="support" class="flex items-center gap-2">
						<MessageSquare class="h-4 w-4" />
						<span class="hidden md:inline">Support</span>
					</TabsTrigger>
				</TabsList>

				<!-- Profile Tab -->
				<TabsContent value="profile" class="mt-6">
					<div class="grid md:grid-cols-4 gap-6">
						<!-- Personal Details -->
						<Card class="w-full max-w-none col-span-4 md:col-span-2">
							<CardHeader>
								<CardTitle class="flex items-center gap-2">
									<User class="h-5 w-5 text-blue-600" />
									<span>Personal Details</span>
								</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<div>
									<h3 class="text-sm font-medium">Email:</h3>
									<p>{client.user.email}</p>
								</div>

								{#if client.company?.baseLocation}
									<div>
										<h3 class="text-sm font-medium">Base Location:</h3>
										<p>{client.company?.baseLocation}</p>
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Billing Information -->
						<Card class="w-full max-w-none col-span-4 md:col-span-2">
							<CardHeader>
								<CardTitle class="flex items-center gap-2">
									<CreditCard class="h-5 w-5 text-blue-600" />
									<span>Billing Information</span>
								</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<div>
									<h3 class="text-sm font-medium">Billing Contact:</h3>
									<p>{client.user.firstName} {client.user.lastName}</p>
								</div>
								<div>
									<h3 class="text-sm font-medium">Billing Email:</h3>
									<p>{client.user.email}</p>
								</div>
								<div>
									<h3 class="text-sm font-medium">Payment Terms:</h3>
									<p>Net 30</p>
								</div>
							</CardContent>
						</Card>

						<!-- Recent Invoices -->
						<Card class="w-full max-w-none col-span-4">
							<CardHeader class="flex flex-row items-center justify-between">
								<CardTitle class="flex items-center gap-2">
									<Receipt class="h-5 w-5 text-blue-600" />
									<span>Invoices</span>
								</CardTitle>
								<Button
									variant="outline"
									size="sm"
									class="gap-1"
									on:click={() => (showInvoiceDialog = true)}
								>
									<Plus class="h-4 w-4" />
									<span>New Invoice</span>
								</Button>
							</CardHeader>
							<CardContent>
								{#if invoices && invoices.length > 0}
									<div class="rounded-md border">
										<Table>
											<TableHeader>
												{#each $invoiceTable.getHeaderGroups() as headerGroup}
													<TableRow>
														{#each headerGroup.headers as header}
															<TableHead>
																<svelte:component
																	this={flexRender(
																		header.column.columnDef.header,
																		header.getContext()
																	)}
																/>
															</TableHead>
														{/each}
														<TableHead class="text-right">Actions</TableHead>
													</TableRow>
												{/each}
											</TableHeader>
											<TableBody>
												{#each $invoiceTable.getRowModel().rows as row}
													<TableRow>
														{#each row.getVisibleCells() as cell}
															<TableCell>
																<svelte:component
																	this={flexRender(cell.column.columnDef.cell, cell.getContext())}
																/>
															</TableCell>
														{/each}
														<TableCell class="text-right">
															<div class="flex justify-end gap-2">
																<Button
																	href={`/invoices/${row.getAllCells()[0].row.original.invoice.id}`}
																	variant="ghost"
																	size="icon"
																	class="h-8 w-8"
																>
																	<Eye class="h-4 w-4" />
																</Button>
															</div>
														</TableCell>
													</TableRow>
												{/each}
											</TableBody>
										</Table>
									</div>

									<!-- Invoice Pagination Controls -->
									<div class="flex items-center justify-between space-x-2 py-4">
										<div class="flex-1 text-sm text-muted-foreground">
											Showing {$invoiceTable.getState().pagination.pageIndex *
												$invoiceTable.getState().pagination.pageSize +
												1} to {Math.min(
												($invoiceTable.getState().pagination.pageIndex + 1) *
													$invoiceTable.getState().pagination.pageSize,
												$invoiceTable.getFilteredRowModel().rows.length
											)} of {$invoiceTable.getFilteredRowModel().rows.length} invoices
										</div>
										<div class="flex items-center space-x-2">
											<Button
												variant="outline"
												size="sm"
												on:click={() => $invoiceTable.previousPage()}
												disabled={!$invoiceTable.getCanPreviousPage()}
											>
												<ChevronLeft class="h-4 w-4" />
												Previous
											</Button>
											<Button
												variant="outline"
												size="sm"
												on:click={() => $invoiceTable.nextPage()}
												disabled={!$invoiceTable.getCanNextPage()}
											>
												Next
												<ChevronRight class="h-4 w-4" />
											</Button>
										</div>
									</div>
								{:else}
									<div class="flex flex-col items-center justify-center py-6 text-center">
										<Receipt class="h-12 w-12 text-gray-300 mb-2" />
										<h3 class="text-lg font-medium">No Invoices</h3>
										<p class="text-sm text-gray-500 mb-4">
											This client doesn't have any invoices yet.
										</p>
										<Button
											variant="outline"
											size="sm"
											class="gap-1"
											on:click={() => (showInvoiceDialog = true)}
										>
											<Plus class="h-4 w-4" />
											<span>Create First Invoice</span>
										</Button>
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Staff -->
						<Card class="w-full max-w-none col-span-4">
							<CardHeader class="flex flex-row items-center justify-between">
								<CardTitle class="flex items-center gap-2">
									<Users class="h-5 w-5 text-blue-600" />
									<span>Client Staff</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								{#if staff && staff.length > 0}
									<div class="rounded-md border">
										<Table>
											<TableHeader>
												{#each $staffTable.getHeaderGroups() as headerGroup}
													<TableRow>
														{#each headerGroup.headers as header}
															<TableHead>
																<svelte:component
																	this={flexRender(
																		header.column.columnDef.header,
																		header.getContext()
																	)}
																/>
															</TableHead>
														{/each}
														<TableHead class="text-right">Actions</TableHead>
													</TableRow>
												{/each}
											</TableHeader>
											<TableBody>
												{#each $staffTable.getRowModel().rows as row}
													<TableRow>
														{#each row.getVisibleCells() as cell}
															<TableCell>
																<svelte:component
																	this={flexRender(cell.column.columnDef.cell, cell.getContext())}
																/>
															</TableCell>
														{/each}
														<TableCell class="text-right">
															<div class="flex justify-end gap-2">
																<Button
																	on:click={() => handleViewStaff(row.original)}
																	variant="ghost"
																	size="icon"
																	class="h-8 w-8"
																>
																	<Eye class="h-4 w-4" />
																</Button>
															</div>
														</TableCell>
													</TableRow>
												{/each}
											</TableBody>
										</Table>
									</div>

									<!-- Staff Pagination Controls -->
									<div class="flex items-center justify-between space-x-2 py-4">
										<div class="flex-1 text-sm text-muted-foreground">
											Showing {$staffTable.getState().pagination.pageIndex *
												$staffTable.getState().pagination.pageSize +
												1} to {Math.min(
												($staffTable.getState().pagination.pageIndex + 1) *
													$staffTable.getState().pagination.pageSize,
												$staffTable.getFilteredRowModel().rows.length
											)} of {$staffTable.getFilteredRowModel().rows.length} staff members
										</div>
										<div class="flex items-center space-x-2">
											<Button
												variant="outline"
												size="sm"
												on:click={() => $staffTable.previousPage()}
												disabled={!$staffTable.getCanPreviousPage()}
											>
												<ChevronLeft class="h-4 w-4" />
												Previous
											</Button>
											<Button
												variant="outline"
												size="sm"
												on:click={() => $staffTable.nextPage()}
												disabled={!$staffTable.getCanNextPage()}
											>
												Next
												<ChevronRight class="h-4 w-4" />
											</Button>
										</div>
									</div>
								{:else}
									<div class="flex flex-col items-center justify-center py-6 text-center">
										<Users class="h-12 w-12 text-gray-300 mb-2" />
										<h3 class="text-lg font-medium">No Staff</h3>
										<p class="text-sm text-gray-500">
											This client doesn't have any staff members yet.
										</p>
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<!-- Locations Tab -->
				<TabsContent value="locations" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="flex flex-row items-center justify-between">
							<CardTitle>Client Locations</CardTitle>
							{#if isAdmin}
								<Button size="sm" class="gap-1">
									<Plus class="h-4 w-4" />
									<span>Add Location</span>
								</Button>
							{/if}
						</CardHeader>
						<CardContent>
							{#if !locationTableData || locationTableData.length === 0}
								<div class="flex flex-col items-center justify-center py-8 text-center">
									<Building class="h-12 w-12 text-gray-300 mb-2" />
									<h3 class="text-lg font-medium">No Locations</h3>
									<p class="text-sm text-gray-500 mb-4">
										This client doesn't have any locations yet.
									</p>
									{#if isAdmin}
										<Button variant="outline" size="sm" class="gap-1">
											<Plus class="h-4 w-4" />
											<span>Add First Location</span>
										</Button>
									{/if}
								</div>
							{:else}
								<div class="rounded-md border">
									<Table>
										<TableHeader>
											{#each $locationTable.getHeaderGroups() as headerGroup}
												<TableRow>
													{#each headerGroup.headers as header}
														<TableHead>
															<svelte:component
																this={flexRender(
																	header.column.columnDef.header,
																	header.getContext()
																)}
															/>
														</TableHead>
													{/each}
													<TableHead class="text-right">Actions</TableHead>
												</TableRow>
											{/each}
										</TableHeader>
										<TableBody>
											{#each $locationTable.getRowModel().rows as row}
												<TableRow>
													{#each row.getVisibleCells() as cell}
														<TableCell>
															<svelte:component
																this={flexRender(cell.column.columnDef.cell, cell.getContext())}
															/>
														</TableCell>
													{/each}
													<TableCell class="text-right">
														<div class="flex justify-end gap-2">
															<Button
																href={`/clients/${client.profile.id}/locations/${row.getAllCells()[0].row.original.id}`}
																variant="ghost"
																size="icon"
																class="h-8 w-8"
															>
																<Eye class="h-4 w-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</div>

								<!-- Location Pagination Controls -->
								<div class="flex items-center justify-between space-x-2 py-4">
									<div class="flex-1 text-sm text-muted-foreground">
										Showing {$locationTable.getState().pagination.pageIndex *
											$locationTable.getState().pagination.pageSize +
											1} to {Math.min(
											($locationTable.getState().pagination.pageIndex + 1) *
												$locationTable.getState().pagination.pageSize,
											$locationTable.getFilteredRowModel().rows.length
										)} of {$locationTable.getFilteredRowModel().rows.length} locations
									</div>
									<div class="flex items-center space-x-2">
										<Button
											variant="outline"
											size="sm"
											on:click={() => $locationTable.previousPage()}
											disabled={!$locationTable.getCanPreviousPage()}
										>
											<ChevronLeft class="h-4 w-4" />
											Previous
										</Button>
										<Button
											variant="outline"
											size="sm"
											on:click={() => $locationTable.nextPage()}
											disabled={!$locationTable.getCanNextPage()}
										>
											Next
											<ChevronRight class="h-4 w-4" />
										</Button>
									</div>
								</div>
							{/if}
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Requisitions Tab -->
				<TabsContent value="requisitions" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="flex flex-row items-center justify-between">
							<CardTitle>Requisition Calendar</CardTitle>
							{#if isAdmin}
								<Button size="sm" class="gap-1">
									<Plus class="h-4 w-4" />
									<span>New Requisition</span>
								</Button>
							{/if}
						</CardHeader>
						<CardContent>
							<Calendar events={requisitions} {selectEvent} />
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Support Tickets Tab -->
				<TabsContent value="support" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="flex flex-row items-center justify-between">
							<CardTitle>Support Tickets</CardTitle>
						</CardHeader>
						<CardContent>
							{#if supportTickets.length > 0}
								<div class="rounded-md border">
									<Table>
										<TableHeader>
											{#each $supportTable.getHeaderGroups() as headerGroup}
												<TableRow>
													{#each headerGroup.headers as header}
														<TableHead>
															<svelte:component
																this={flexRender(
																	header.column.columnDef.header,
																	header.getContext()
																)}
															/>
														</TableHead>
													{/each}
													<TableHead class="text-right">Actions</TableHead>
												</TableRow>
											{/each}
										</TableHeader>
										<TableBody>
											{#each $supportTable.getRowModel().rows as row}
												<TableRow>
													{#each row.getVisibleCells() as cell}
														<TableCell>
															<svelte:component
																this={flexRender(cell.column.columnDef.cell, cell.getContext())}
															/>
														</TableCell>
													{/each}
													<TableCell class="text-right">
														<div class="flex justify-end gap-2">
															<Button
																variant="ghost"
																size="icon"
																class="h-8 w-8"
																on:click={() => goto(`/support/ticket/${row.original.id}`)}
															>
																<Eye class="h-4 w-4" />
															</Button>
														</div>
													</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</div>

								<!-- Support Pagination Controls -->
								<div class="flex items-center justify-between space-x-2 py-4">
									<div class="flex-1 text-sm text-muted-foreground">
										Showing {$supportTable.getState().pagination.pageIndex *
											$supportTable.getState().pagination.pageSize +
											1} to {Math.min(
											($supportTable.getState().pagination.pageIndex + 1) *
												$supportTable.getState().pagination.pageSize,
											$supportTable.getFilteredRowModel().rows.length
										)} of {$supportTable.getFilteredRowModel().rows.length} tickets
									</div>
									<div class="flex items-center space-x-2">
										<Button
											variant="outline"
											size="sm"
											on:click={() => $supportTable.previousPage()}
											disabled={!$supportTable.getCanPreviousPage()}
										>
											<ChevronLeft class="h-4 w-4" />
											Previous
										</Button>
										<Button
											variant="outline"
											size="sm"
											on:click={() => $supportTable.nextPage()}
											disabled={!$supportTable.getCanNextPage()}
										>
											Next
											<ChevronRight class="h-4 w-4" />
										</Button>
									</div>
								</div>
							{:else}
								<div class="flex flex-col items-center justify-center py-8 text-center">
									<AlertCircle class="h-12 w-12 text-gray-300 mb-2" />
									<h3 class="text-lg font-medium">No Support Tickets</h3>
									<p class="text-sm text-gray-500 mb-4">
										This client doesn't have any support tickets yet.
									</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	</section>
	<Dialog open={dialogOpen} onOpenChange={() => (dialogOpen = !dialogOpen)}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle class="text-xl text-left">{selectedEvent?.title}</DialogTitle>
				<DialogDescription>
					<div class="flex items-center gap-2">
						<img
							src={selectedEvent?.extendedProps.requisition.client.companyLogo}
							class="w-10 h-10 rounded-full shadow-lg"
							alt="company logo"
						/>
						<span>{selectedEvent?.extendedProps.requisition.client.companyName}</span>
					</div>
				</DialogDescription>
			</DialogHeader>

			{#if selectedEvent?.extendedProps.type === 'RECURRENCE_DAY'}
				<p class="font-semibold">Date & Time</p>
				<div class="flex items-center gap-2 text-gray-500">
					<CalendarDays size={18} />
					{new Date(selectedEvent.start).toLocaleDateString()}
				</div>
				<div class="flex items-center gap-2 text-gray-500">
					<Clock size={18} />
					<span
						>{new Date(selectedEvent.start).toLocaleTimeString()} - {new Date(
							selectedEvent.end
						).toLocaleTimeString()}</span
					>
				</div>
				<DialogFooter>
					<a href={`/requisitions/${selectedEvent?.resourceIds?.[0]}`}>
						<Button type="button" class="ml-auto mt-4">View Requisition</Button>
					</a>
				</DialogFooter>
			{/if}
		</DialogContent>
	</Dialog>

	<Dialog bind:open={detailsDialogOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Staff Details</DialogTitle>
			</DialogHeader>
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
						<p>
							<strong>Primary Location:</strong>
							{selectedProfile.primaryLocation?.name || 'None Assigned'}
						</p>
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
			<DialogFooter>
				<DialogClose asChild>
					<Button on:click={handleCloseDetailsDialog} variant="outline" type="button" class="w-full"
						>Close</Button
					>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{:else}
	<section
		class="container mx-auto px-4 py-6 flex flex-col items-center text-center sm:justify-center gap-4 md:gap-6"
	>
		<div class="p-8 bg-gray-50 rounded-lg">
			<AlertCircle class="h-12 w-12 mx-auto text-gray-400 mb-4" />
			<h2 class="text-2xl font-bold mb-2">No Client Found</h2>
			<p class="text-gray-500 mb-6">The requested client could not be found in our system.</p>
			<Button type="button" on:click={() => window.history.back()}>Go Back</Button>
		</div>
	</section>
{/if}
