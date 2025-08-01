<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import {
		AlertCircle,
		FileClock,
		UserPlus,
		TicketIcon,
		ArrowRight,
		Clock,
		TrendingUp,
		CheckCircle2,
		Building,
		DollarSign,
		PlusIcon
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { formatCurrency, formatDate, formatTicketDate } from '$lib/_helpers';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { format } from 'date-fns';
	import AddRequisitionDrawer from '$lib/components/drawers/addRequisitionDrawer.svelte';

	export let user;
	export let data;
	export let adminForm;
	let drawerExpanded = false;

	// Stats data from actual API response
	$: timesheetsDueCount = data.timesheetsDueCount || 0;
	$: supportTicketsCount = data.openSupportTicketsCount || 0;
	$: discrepanciesCount = data.discrepancies?.length || 0;
	$: invoicesDueCount = data.invoicesDueCount || 0;

	// Table data from actual API response
	$: supportTickets = data.supportTickets || [];
	$: discrepancies = data.discrepancies || [];
	$: newCandidateProfiles = data.newCandidateProfiles || [];
	$: newClientSignups = data.newClientSignups || [];
	$: invoicesDue = data.invoicesDue || [];
	$: requisitions = data.requisitions || [];
	$: console.log(discrepancies);
	// Calculate the % change in timesheets due from previous period (placeholder - you'll need to implement actual trend calculation)
	// const timesheetsTrendPercent = 12; // This should be calculated based on historical data
	// const supportTicketsTrendPercent = -5;
	// const discrepanciesTrendPercent = 8;
	// const invoicesTrendPercent = 15;

	let activeTab = 'timesheets';

	// Function to determine status color class
	function getStatusColorClass(status) {
		return cn(
			status === 'PENDING' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
			status === 'NEW' && 'bg-blue-100 text-blue-800 hover:bg-blue-200',
			status === 'ACTIVE' && 'bg-green-100 text-green-800 hover:bg-green-200',
			status === 'DISCREPANCY' && 'bg-orange-100 text-orange-800 hover:bg-orange-200',
			status === 'CLOSED' && 'bg-gray-100 text-gray-800 hover:bg-gray-200',
			status === 'APPROVED' && 'bg-green-100 text-green-800 hover:bg-green-200',
			status === 'VOID' && 'bg-gray-100 text-gray-800 hover:bg-gray-200',
			status === 'INACTIVE' && 'bg-gray-100 text-gray-800 hover:bg-gray-200',
			status === 'REJECTED' && 'bg-red-100 text-red-800 hover:bg-red-200'
		);
	}

	// Function to format trend value with + or - sign
	// function formatTrendValue(value) {
	// 	return value > 0 ? `+${value}%` : `${value}%`;
	// }

	// Function to get trend color
	// function getTrendColorClass(value) {
	// 	return value > 0 ? 'text-green-500' : 'text-red-500';
	// }

	// Function to get discrepancy type badge color
	function getDiscrepancyTypeColor(type) {
		switch (type) {
			case 'MISSING_HOURS':
				return 'bg-red-100 text-red-800';
			case 'OVERTIME_MISMATCH':
				return 'bg-orange-100 text-orange-800';
			case 'SCHEDULE_MISMATCH':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Function to format discrepancy type for display
	function formatDiscrepancyType(type) {
		return (
			type
				?.replace(/_/g, ' ')
				.toLowerCase()
				.replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown'
		);
	}
</script>

<section class="min-h-screen bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<!-- Welcome and date -->
		<div class="mb-8">
			<h2 class="text-3xl font-extrabold text-gray-900 leading-tight">
				Welcome back, {user?.firstName}
			</h2>
			<p class="text-gray-500 mt-1">
				{format(new Date(), 'EEEE, MMMM d, yyyy')} | Your admin overview
			</p>
		</div>

		<!-- Stat cards row -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
			<!-- Timesheets due -->
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-gray-500 text-sm font-medium">Timesheets Due</p>
							<div class="flex items-baseline mt-1">
								<p class="text-4xl font-bold text-gray-900">{timesheetsDueCount}</p>
								<!-- <span
									class={`ml-2 ${getTrendColorClass(timesheetsTrendPercent)} text-sm font-medium flex items-center`}
								>
									{formatTrendValue(timesheetsTrendPercent)}
									{#if timesheetsTrendPercent > 0}
										<TrendingUp size={16} class="ml-1" />
									{:else}
										<TrendingUp size={16} class="ml-1 transform rotate-180" />
									{/if}
								</span> -->
							</div>
							<!-- <p class="text-gray-400 text-xs mt-1">vs. previous period</p> -->
						</div>
						<div class="bg-blue-100 p-3 rounded-full">
							<FileClock size={24} class="text-blue-600" />
						</div>
					</div>
					<div class="mt-4">
						<Button variant="link" class="text-blue-600 p-0 h-auto" href="/timesheets">
							View all timesheets
							<ArrowRight size={16} class="ml-1" />
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Discrepancies card -->
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-gray-500 text-sm font-medium">Discrepancies</p>
							<div class="flex items-baseline mt-1">
								<p class="text-4xl font-bold text-gray-900">{discrepanciesCount}</p>
								<!-- <span
									class={`ml-2 ${getTrendColorClass(discrepanciesTrendPercent)} text-sm font-medium flex items-center`}
								>
									{formatTrendValue(discrepanciesTrendPercent)}
									{#if discrepanciesTrendPercent > 0}
										<TrendingUp size={16} class="ml-1" />
									{:else}
										<TrendingUp size={16} class="ml-1 transform rotate-180" />
									{/if}
								</span> -->
							</div>
							<!-- <p class="text-gray-400 text-xs mt-1">vs. previous period</p> -->
						</div>
						<div class="bg-orange-100 p-3 rounded-full">
							<AlertCircle size={24} class="text-orange-600" />
						</div>
					</div>
					<div class="mt-4">
						<Button variant="link" class="text-orange-600 p-0 h-auto" href="/timesheets">
							Review discrepancies
							<ArrowRight size={16} class="ml-1" />
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Support tickets card -->
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-gray-500 text-sm font-medium">Support Tickets</p>
							<div class="flex items-baseline mt-1">
								<p class="text-4xl font-bold text-gray-900">{supportTicketsCount}</p>
								<!-- <span
									class={`ml-2 ${getTrendColorClass(supportTicketsTrendPercent)} text-sm font-medium flex items-center`}
								>
									{formatTrendValue(supportTicketsTrendPercent)}
									{#if supportTicketsTrendPercent > 0}
										<TrendingUp size={16} class="ml-1" />
									{:else}
										<TrendingUp size={16} class="ml-1 transform rotate-180" />
									{/if}
								</span> -->
							</div>
							<!-- <p class="text-gray-400 text-xs mt-1">vs. previous period</p> -->
						</div>
						<div class="bg-purple-100 p-3 rounded-full">
							<TicketIcon size={24} class="text-purple-600" />
						</div>
					</div>
					<div class="mt-4">
						<Button variant="link" class="text-purple-600 p-0 h-auto" href="/support">
							Manage tickets
							<ArrowRight size={16} class="ml-1" />
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Invoices due card -->
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-gray-500 text-sm font-medium">Invoices Due</p>
							<div class="flex items-baseline mt-1">
								<p class="text-4xl font-bold text-gray-900">{invoicesDueCount}</p>
								<!-- <span
									class={`ml-2 ${getTrendColorClass(invoicesTrendPercent)} text-sm font-medium flex items-center`}
								>
									{formatTrendValue(invoicesTrendPercent)}
									{#if invoicesTrendPercent > 0}
										<TrendingUp size={16} class="ml-1" />
									{:else}
										<TrendingUp size={16} class="ml-1 transform rotate-180" />
									{/if}
								</span> -->
							</div>
							<!-- <p class="text-gray-400 text-xs mt-1">vs. previous period</p> -->
						</div>
						<div class="bg-green-100 p-3 rounded-full">
							<DollarSign size={24} class="text-green-600" />
						</div>
					</div>
					<div class="mt-4">
						<Button variant="link" class="text-green-600 p-0 h-auto" href="/invoices">
							View invoices
							<ArrowRight size={16} class="ml-1" />
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Main grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left column - Tables section -->
			<div class="lg:col-span-3 space-y-6">
				<div class="col-span-12 lg:col-span-4">
					<Card.Root>
						<Card.Header class="flex flex-row justify-between items-center flex-wrap">
							<Card.Title class="text-xl md:text-2xl">Recent Requisitions</Card.Title>
							<Button
								on:click={() => (drawerExpanded = true)}
								size="sm"
								class="bg-blue-900 hover:bg-blue-800"
							>
								<PlusIcon size={16} class="mr-1" /> New Requisition
							</Button>
						</Card.Header>
						<Card.Content class="p-2 md:p-4">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Title</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head class="text-right">Rate</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each requisitions.slice(0, 5) as req, i (req.requisition.id)}
										<Table.Row
											class="cursor-pointer"
											on:click={() => goto(`/requisitions/${req.requisition.id}`)}
										>
											<Table.Cell>
												<div class="flex flex-col">
													<span class="font-medium truncate max-w-[150px]"
														>{req.requisition.title}</span
													>
													<span class="text-xs text-gray-500">{req.company.companyName}</span>
												</div>
											</Table.Cell>
											<Table.Cell>
												<Badge
													variant="secondary"
													value={req.requisition.status}
													class={cn(
														req.requisition.status === 'PENDING' &&
															'bg-yellow-300 hover:bg-yellow-400',
														req.requisition.status === 'OPEN' && 'bg-blue-500 hover:bg-blue-600',
														req.requisition.status === 'FILLED' &&
															'bg-green-400 hover:bg-bg-green-500',
														req.requisition.status === 'UNFULFILLED' &&
															'bg-orange-400 hover:bg-orange-500',
														req.requisition.status === 'CANCELED' && 'bg-red-500 hover:bg-red-600',
														'text-white'
													)}
												/>
											</Table.Cell>
											<Table.Cell class="text-right"
												>{formatCurrency(req.requisition.hourlyRate)}</Table.Cell
											>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</Card.Content>
						<Card.Footer>
							<div class="w-full flex justify-end">
								<Button variant="outline" class="text-sm" href="/requisitions/">
									View all Requisitions
									<ArrowRight size={14} class="ml-1" />
								</Button>
							</div>
						</Card.Footer>
					</Card.Root>
				</div>
				<!-- Tab navigation -->
				<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
					<div class="flex border-b border-gray-200">
						<button
							class={`flex-1 py-4 px-4 text-center font-medium ${activeTab === 'timesheets' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
							on:click={() => (activeTab = 'timesheets')}
						>
							Timesheet Discrepancies ({discrepanciesCount})
						</button>
						<button
							class={`flex-1 py-4 px-4 text-center font-medium ${activeTab === 'tickets' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
							on:click={() => (activeTab = 'tickets')}
						>
							Support Tickets ({supportTicketsCount})
						</button>
						<button
							class={`flex-1 py-4 px-4 text-center font-medium ${activeTab === 'invoices' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
							on:click={() => (activeTab = 'invoices')}
						>
							Overdue Invoices ({invoicesDueCount})
						</button>
					</div>

					<div class="p-4">
						{#if activeTab === 'timesheets'}
							{#if discrepancies.length > 0}
								<Table.Root class="w-full">
									<Table.Header>
										<Table.Row>
											<Table.Head>Timesheet</Table.Head>
											<Table.Head>Candidate</Table.Head>
											<Table.Head>Type</Table.Head>
											<Table.Head>Description</Table.Head>
											<Table.Head class="text-right">Date</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each discrepancies.slice(0, 5) as discrepancy, i (i)}
											<Table.Row
												class="cursor-pointer hover:bg-gray-50"
												on:click={() => goto(`/timesheets/${discrepancy.timeSheetId}`)}
											>
												<Table.Cell>
													<span class="font-medium text-gray-900"
														>#{discrepancy.timeSheetId?.slice(-8) || 'N/A'}</span
													>
												</Table.Cell>
												<Table.Cell>
													{discrepancy.candidate}
												</Table.Cell>
												<Table.Cell>
													<Badge
														class={getDiscrepancyTypeColor(discrepancy.discrepancyType)}
														value={formatDiscrepancyType(discrepancy.discrepancyType)}
													/>
												</Table.Cell>
												<Table.Cell class="max-w-xs truncate">
													{discrepancy.details || 'No details'}
												</Table.Cell>
												<Table.Cell class="text-right">
													<div class="flex items-center justify-end text-gray-500">
														<Clock size={14} class="mr-1" />
														{discrepancy.weekBeginDate
															? format(new Date(discrepancy.weekBeginDate), 'MMM d')
															: 'N/A'}
													</div>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							{:else}
								<div class="text-center py-8">
									<CheckCircle2 size={48} class="mx-auto text-green-500 mb-4" />
									<p class="text-gray-500">No timesheet discrepancies found</p>
								</div>
							{/if}
							<div class="mt-4 flex justify-end">
								<Button variant="outline" class="text-sm" href="/timesheets/">
									View all discrepancies
									<ArrowRight size={14} class="ml-1" />
								</Button>
							</div>
						{:else if activeTab === 'tickets'}
							{#if supportTickets.length > 0}
								<Table.Root class="w-full">
									<Table.Header>
										<Table.Row>
											<Table.Head>Title</Table.Head>
											<Table.Head>Submitted By</Table.Head>
											<Table.Head>Date</Table.Head>
											<Table.Head class="text-right">Status</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each supportTickets.slice(0, 5) as ticket, i (ticket.supportTicket.id)}
											<Table.Row
												class="cursor-pointer hover:bg-gray-50"
												on:click={() => goto(`/support/ticket/${ticket.supportTicket.id}`)}
											>
												<Table.Cell>
													<span class="font-medium text-gray-900">{ticket.supportTicket.title}</span
													>
												</Table.Cell>
												<Table.Cell>
													{ticket.reportedBy.firstName}
													{ticket.reportedBy.lastName}
												</Table.Cell>
												<Table.Cell>
													<div class="flex items-center text-gray-500">
														<Clock size={14} class="mr-1" />
														{formatTicketDate(ticket.supportTicket.createdAt)}
													</div>
												</Table.Cell>
												<Table.Cell class="text-right">
													<Badge
														value={ticket.supportTicket.status}
														class={getStatusColorClass(ticket.supportTicket.status)}
													/>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							{:else}
								<div class="text-center py-8">
									<CheckCircle2 size={48} class="mx-auto text-green-500 mb-4" />
									<p class="text-gray-500">No support tickets found</p>
								</div>
							{/if}
							<div class="mt-4 flex justify-end">
								<Button variant="outline" class="text-sm" href="/support">
									View all tickets
									<ArrowRight size={14} class="ml-1" />
								</Button>
							</div>
						{:else if activeTab === 'invoices'}
							{#if invoicesDue.length > 0}
								<Table.Root class="w-full">
									<Table.Header>
										<Table.Row>
											<Table.Head>Invoice #</Table.Head>
											<Table.Head>Client</Table.Head>
											<Table.Head>Amount</Table.Head>
											<Table.Head>Due Date</Table.Head>
											<Table.Head class="text-right">Status</Table.Head>
										</Table.Row>
									</Table.Header>
									<Table.Body>
										{#each invoicesDue.slice(0, 5) as invoiceData, i (invoiceData.invoice.id)}
											<Table.Row
												class="cursor-pointer hover:bg-gray-50"
												on:click={() => goto(`/invoices/${invoiceData.invoice.id}`)}
											>
												<Table.Cell>
													<span class="font-medium text-gray-900"
														>#{invoiceData.invoice.invoiceNumber ||
															invoiceData.invoice.id.slice(-8)}</span
													>
												</Table.Cell>
												<Table.Cell>
													{invoiceData.company?.companyName || 'Unknown Client'}
												</Table.Cell>
												<Table.Cell>
													{formatCurrency(invoiceData.invoice.amountDue)}
												</Table.Cell>
												<Table.Cell>
													<div class="flex items-center text-gray-500">
														<Clock size={14} class="mr-1" />
														{formatDate(invoiceData.invoice.dueDate)}
													</div>
												</Table.Cell>
												<Table.Cell class="text-right">
													<Badge
														value={invoiceData.invoice.status}
														class={invoiceData.invoice.status === 'overdue'
															? 'bg-red-100 text-red-800'
															: getStatusColorClass(invoiceData.invoice.status)}
													/>
												</Table.Cell>
											</Table.Row>
										{/each}
									</Table.Body>
								</Table.Root>
							{:else}
								<div class="text-center py-8">
									<CheckCircle2 size={48} class="mx-auto text-green-500 mb-4" />
									<p class="text-gray-500">No overdue invoices found</p>
								</div>
							{/if}
							<div class="mt-4 flex justify-end">
								<Button variant="outline" class="text-sm" href="/invoices?filter=overdue">
									View all overdue invoices
									<ArrowRight size={14} class="ml-1" />
								</Button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Candidate and clients section -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- New candidates -->
					<Card.Root>
						<Card.Header class="pb-0">
							<div class="flex justify-between items-center">
								<Card.Title class="text-lg font-semibold flex items-center">
									<UserPlus size={20} class="mr-2 text-blue-600" />
									New Professional Members
								</Card.Title>
							</div>
						</Card.Header>
						<Card.Content class="pt-4">
							{#if newCandidateProfiles.length > 0}
								<ul class="space-y-3">
									{#each newCandidateProfiles.slice(0, 4) as profileData, i (profileData.profile.id)}
										<li>
											<a
												href={`/professionals/${profileData.profile.id}`}
												class="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer"
											>
												<div
													class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-3"
												>
													{profileData.user.firstName[0]}{profileData.user.lastName[0]}
												</div>
												<div class="flex-1 min-w-0">
													<p class="text-sm font-medium text-gray-900 truncate">
														{profileData.user.firstName}
														{profileData.user.lastName}
													</p>
													<p class="text-xs text-gray-500 truncate">
														{profileData.profile.desiredPosition || 'Position not specified'}
													</p>
												</div>
												<Badge
													class="bg-yellow-100 text-yellow-800"
													value={profileData.profile.status || 'PENDING'}
												></Badge>
											</a>
										</li>
									{/each}
								</ul>
							{:else}
								<div class="text-center py-4">
									<p class="text-gray-500">No new candidate profiles</p>
								</div>
							{/if}
							<div class="mt-4 text-center">
								<Button variant="outline" size="sm" class="w-full" href="/professionals">
									View all professionals
								</Button>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- New clients -->
					<Card.Root>
						<Card.Header class="pb-0">
							<div class="flex justify-between items-center">
								<Card.Title class="text-lg font-semibold flex items-center">
									<Building size={20} class="mr-2 text-indigo-600" />
									New Business Members
								</Card.Title>
							</div>
						</Card.Header>
						<Card.Content class="pt-4">
							{#if newClientSignups.length > 0}
								<ul class="space-y-3">
									{#each newClientSignups.slice(0, 4) as clientData, i (clientData.clientProfile.id)}
										<li>
											<a
												href={`/clients/${clientData.clientProfile.id}`}
												class="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer"
											>
												{#if clientData.company.companyLogo}
													<img
														src={clientData.company.companyLogo}
														alt="Company Logo"
														class="h-8 w-8 rounded-full mr-3 object-cover"
													/>
												{:else}
													<div
														class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-3"
													>
														{clientData.company.companyName[0]}
													</div>
												{/if}
												<div class="flex-1 min-w-0">
													<p class="text-sm font-medium text-gray-900 truncate">
														{clientData.company.companyName}
													</p>
													<p class="text-xs text-gray-500 truncate">
														{clientData.user.firstName}
														{clientData.user.lastName}
													</p>
												</div>
											</a>
										</li>
									{/each}
								</ul>
							{:else}
								<div class="text-center py-4">
									<p class="text-gray-500">No new client signups</p>
								</div>
							{/if}
							<div class="mt-4 text-center">
								<Button variant="outline" size="sm" class="w-full" href="/clients">
									View all business members
								</Button>
							</div>
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		</div>
	</div>
</section>
<AddRequisitionDrawer {user} bind:drawerExpanded {adminForm} />
