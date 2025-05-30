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
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
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
		UserMinus
	} from 'lucide-svelte';

	// Table library
	import {
		getCoreRowModel,
		type ColumnDef,
		getSortedRowModel,
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

	export let data: PageData;
	let initials: string = '';
	let locationTableData: ClientCompanyLocation[] = [];
	let showInvoiceDialog = false;
	let selectedEvent: CalendarEvent | null = null;
	let dialogOpen: boolean = false;
	let detailsDialogOpen: boolean = false;
	let selectedProfile: StaffProfileData | null = null;
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

	const selectEvent = (event: CalendarEvent) => {
		selectedEvent = event;
		dialogOpen = true;
	};

	// Invoice form state
	let invoiceForm = {
		title: '',
		amount: 0,
		dueDate: '',
		description: '',
		location: '',
		items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
	};

	// Reactive declarations
	$: user = data.user;
	$: isAdmin = user?.role === USER_ROLES.SUPERADMIN;
	$: client = data.client;
	$: locations = data.client?.locations || [];
	$: requisitions = data.requisitions || [];
	$: supportTickets = data.supportTickets || [];
	$: staff = data.staff || [];

	$: {
		locationTableData = locations;
	}

	$: {
		if (client) {
			initials = convertNameToInitials(client.user.firstName, client.user.lastName);
		}
	}

	// Mock data for invoices
	const invoices = [
		{
			id: 'INV-001',
			date: '2025-03-15',
			amount: 1250.0,
			status: 'Paid'
		},
		{
			id: 'INV-002',
			date: '2025-04-01',
			amount: 875.5,
			status: 'Pending'
		},
		{
			id: 'INV-003',
			date: '2025-04-10',
			amount: 2150.75,
			status: 'Overdue'
		}
	];

	// Table configuration
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
		getSortedRowModel: getSortedRowModel()
	});
	$: {
		locationTableData = (locations as ClientCompanyLocation[]) ?? [];
		locationOptions.update((o) => ({ ...o, data: locationTableData }));

		tableData = (staff as StaffProfileData[]) || [];
		options.update((o) => ({ ...o, data: tableData }));
	}

	onMount(() => {
		locationTableData = (locations as ClientCompanyLocation[]) ?? [];
		locationOptions.update((o) => ({ ...o, data: locationTableData }));

		tableData = (staff as StaffProfileData[]) || [];
		options.update((o) => ({ ...o, data: tableData }));
	});

	const locationTable = createSvelteTable(locationOptions);

	function handleCreateInvoice() {
		// Handle invoice creation logic here
		console.log('Creating invoice:', invoiceForm);
		showInvoiceDialog = false;
		// Reset form
		invoiceForm = {
			title: '',
			amount: 0,
			dueDate: '',
			description: '',
			location: '',
			items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
		};
	}

	function addInvoiceItem() {
		invoiceForm.items = [
			...invoiceForm.items,
			{ description: '', quantity: 1, rate: 0, amount: 0 }
		];
	}

	function updateItemAmount(index: number) {
		const item = invoiceForm.items[index];
		item.amount = item.quantity * item.rate;
		invoiceForm.items = [...invoiceForm.items];
		invoiceForm.amount = invoiceForm.items.reduce((total, item) => total + item.amount, 0);
	}

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
	};

	const handleCloseDetailsDialog = () => {
		detailsDialogOpen = false;
		selectedProfile = null;
	};

	const table = createSvelteTable(options);
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
								{#if isAdmin}
									<Button
										variant="outline"
										size="sm"
										class="gap-1"
										href={`${client.profile.id}/edit`}
									>
										<Edit class="h-4 w-4" />
										<span>Edit Profile</span>
									</Button>
								{/if}

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

					<div class="grid gap-4 py-4">
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="title">Invoice Title</Label>
								<Input
									id="title"
									bind:value={invoiceForm.title}
									placeholder="Enter invoice title"
								/>
							</div>
							<div class="space-y-2">
								<Label for="dueDate">Due Date</Label>
								<Input id="dueDate" type="date" bind:value={invoiceForm.dueDate} />
							</div>
						</div>

						<div class="space-y-2">
							<Label for="location">Location</Label>
							<Select>
								<SelectTrigger>
									<SelectValue placeholder="Select location" />
								</SelectTrigger>
								<SelectContent>
									{#each locations as location}
										<SelectItem value={location.id}>{location.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Label>Invoice Items</Label>
								<Button variant="outline" size="sm" on:click={addInvoiceItem} class="gap-1">
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
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each invoiceForm.items as item, i}
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
													${item.amount.toFixed(2)}
												</TableCell>
											</TableRow>
										{/each}
										<TableRow>
											<TableCell colspan={3} class="text-right font-bold">Total:</TableCell>
											<TableCell class="font-bold">${invoiceForm.amount.toFixed(2)}</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="description">Additional Notes</Label>
							<Textarea
								id="description"
								bind:value={invoiceForm.description}
								placeholder="Add any additional notes or information"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" on:click={() => (showInvoiceDialog = false)}>Cancel</Button>
						<Button on:click={handleCreateInvoice}>Create Invoice</Button>
					</DialogFooter>
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
									<span>Recent Invoices</span>
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
									<div class="space-y-3">
										{#each invoices as invoice}
											<div
												class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
											>
												<div>
													<p class="font-medium">{invoice.id}</p>
													<p class="text-sm text-gray-500">{invoice.date}</p>
												</div>
												<div class="text-right">
													<p class="font-medium">${invoice.amount.toFixed(2)}</p>
													<Badge
														class={cn(
															'text-white',
															invoice.status.toLowerCase() === 'paid' && 'bg-green-400',
															invoice.status.toLowerCase() === 'overdue' && 'bg-red-500',
															invoice.status.toLowerCase() === 'pending' &&
																'bg-yellow-300 text-gray-700'
														)}
														variant={invoice.status.toLowerCase() === 'paid'
															? 'default'
															: invoice.status.toLowerCase() === 'overdue'
																? 'destructive'
																: 'secondary'}
														value={invoice.status}
													/>
												</div>
											</div>
										{/each}
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
							{#if invoices && invoices.length > 0}
								<CardFooter>
									<Button variant="ghost" size="sm" class="gap-1 ml-auto">
										View All <ChevronRight class="h-4 w-4" />
									</Button>
								</CardFooter>
							{/if}
						</Card>

						<!-- Staff -->
						<Card class="w-full max-w-none col-span-4">
							<CardHeader class="flex flex-row items-center justify-between">
								<CardTitle class="flex items-center gap-2">
									<Receipt class="h-5 w-5 text-blue-600" />
									<span>Client Staff</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
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
													</div>
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
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
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Title</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Created At</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each supportTickets as ticket}
											<TableRow
												class="cursor-pointer"
												on:click={() => goto(`/support/ticket/${ticket.id}`)}
											>
												<TableCell>{ticket.title}</TableCell>
												<TableCell>
													<Badge
														variant="default"
														value={ticket.status}
														class={cn(
															ticket.status === 'NEW' && 'bg-yellow-300',
															ticket.status === 'PENDING' && 'bg-green-500',
															ticket.status === 'CLOSED' && 'bg-gray-400',
															'text-white'
														)}
													/>
												</TableCell>
												<TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
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
