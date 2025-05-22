<script lang="ts">
	import type { ClientCompanyLocation } from '$lib/server/database/schemas/client';
	import { CANDIDATE_STATUS, USER_ROLES } from '$lib/config/constants';
	import type { PageData } from './$types';
	import convertNameToInitials from '$lib/_helpers/convertNameToInitials';
	import { getDayName } from '$lib/_helpers';

	// ShadcnUI Components
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import {
		Dialog,
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
		Users
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

	export let data: PageData;
	let initials: string = '';
	let locationTableData: ClientCompanyLocation[] = [];
	let showInvoiceDialog = false;

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

	onMount(() => {
		locationTableData = (locations as ClientCompanyLocation[]) ?? [];
		locationOptions.update((o) => ({ ...o, data: locationTableData }));
	});

	const locationTable = createSvelteTable(locationOptions);

	// Helper functions
	const formatTime = (time: string): string => {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		const date = new Date();
		date.setHours(parseInt(hours), parseInt(minutes));
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	};

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

							{#if client.profile?.cellPhone}
								<div class="flex items-center gap-2">
									<Phone class="h-4 w-4 text-gray-500" />
									<span>{client.profile.cellPhone}</span>
								</div>
							{/if}

							{#if client.profile?.address && client.profile?.city && client.profile?.state}
								<div class="flex items-center gap-2">
									<MapPin class="h-4 w-4 text-gray-500" />
									<span
										>{client.profile.address}, {client.profile.city}, {client.profile.state}</span
									>
								</div>
							{/if}
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
				<TabsList class="w-full md:w-auto grid grid-cols-2 md:grid-cols-5 gap-2">
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
					<TabsTrigger value="documents" class="flex items-center gap-2">
						<FileText class="h-4 w-4" />
						<span class="hidden md:inline">Documents</span>
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

						<!-- Hours of Operation -->
						{#if client.company?.operatingHours}
							<Card class="w-full max-w-none col-span-4 md:col-span-2">
								<CardHeader>
									<CardTitle class="flex items-center gap-2">
										<Clock class="h-5 w-5 text-blue-600" />
										<span>Hours of Operation</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div class="space-y-1">
										{#each Array.from({ length: 7 }, (_, i) => i) as dayIndex}
											<div
												class="flex justify-between py-1 text-sm border-b border-gray-100 last:border-0"
											>
												<span class="font-medium text-gray-700">
													{getDayName(dayIndex)}
												</span>
												<span class="text-gray-600">
													{#if client?.company?.operatingHours?.[dayIndex]?.isClosed}
														<span class="text-gray-500">Closed</span>
													{:else}
														{formatTime(client?.company?.operatingHours?.[dayIndex]?.openTime)} - {formatTime(
															client?.company?.operatingHours?.[dayIndex]?.closeTime
														)}
													{/if}
												</span>
											</div>
										{/each}
										{#if client?.company?.operatingHours?.[1]?.timezone}
											<div class="mt-1 text-xs text-gray-500">
												All times shown in {client?.company?.operatingHours?.[1].timezone.replace(
													'_',
													' '
												)}
											</div>
										{/if}
									</div>
								</CardContent>
							</Card>
						{/if}

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
						<Card class="w-full max-w-none col-span-4 md:col-span-2">
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
															<Button variant="ghost" size="icon" class="h-8 w-8">
																<Eye class="h-4 w-4" />
															</Button>
															<Button variant="ghost" size="icon" class="h-8 w-8">
																<Edit class="h-4 w-4" />
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
							<Calendar events={[]} selectEvent={() => {}} />
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Documents Tab -->
				<TabsContent value="documents" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="flex flex-row items-center justify-between">
							<CardTitle>Client Documents</CardTitle>
							{#if isAdmin}
								<Button size="sm" class="gap-1">
									<FilePlus class="h-4 w-4" />
									<span>Upload Document</span>
								</Button>
							{/if}
						</CardHeader>
						<CardContent>
							<div class="flex flex-col items-center justify-center py-8 text-center">
								<FileText class="h-12 w-12 text-gray-300 mb-2" />
								<h3 class="text-lg font-medium">No Documents</h3>
								<p class="text-sm text-gray-500 mb-4">
									This client doesn't have any documents yet.
								</p>
								{#if isAdmin}
									<Button variant="outline" size="sm" class="gap-1">
										<FilePlus class="h-4 w-4" />
										<span>Upload First Document</span>
									</Button>
								{/if}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Support Tickets Tab -->
				<TabsContent value="support" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="flex flex-row items-center justify-between">
							<CardTitle>Support Tickets</CardTitle>
							<Button size="sm" class="gap-1">
								<Plus class="h-4 w-4" />
								<span>New Ticket</span>
							</Button>
						</CardHeader>
						<CardContent>
							<div class="flex flex-col items-center justify-center py-8 text-center">
								<MessageSquare class="h-12 w-12 text-gray-300 mb-2" />
								<h3 class="text-lg font-medium">No Support Tickets</h3>
								<p class="text-sm text-gray-500 mb-4">
									This client doesn't have any support tickets.
								</p>
								<Button variant="outline" size="sm" class="gap-1">
									<Plus class="h-4 w-4" />
									<span>Create First Ticket</span>
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	</section>
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
