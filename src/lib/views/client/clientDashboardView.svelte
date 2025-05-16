<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import {
		AlertCircle,
		DollarSign,
		FileClock,
		FileText,
		PlusIcon,
		ScrollText,
		UserPlus
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { formatCurrency, formatDate, formatTicketDate } from '$lib/_helpers';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { format, parse } from 'date-fns';

	export let user;
	export let data;

	$: console.log({ data });
	$: requisitions = data.requisitions;
	$: newApplicationsCount = data.newApplicationsCount;
	$: timesheetsDueCount = data.timesheetsDueCount;
	$: timesheetsDue = data.timesheetsDue;
	$: timesheetDiscrepancies = data.discrepanciesCount;
	$: recentApplications = data.recentApplications;

	// Invoice-related data
	$: invoices = data.invoices || [];
	$: overdueInvoicesCount = data.overdueInvoicesCount || 0;
	$: pendingInvoicesCount = data.pendingInvoicesCount || 0;
	$: totalAmountDue = parseInt(data.totalAmountDue || '0');
</script>

<section class="grow grid grid-cols-1 lg:grid-cols-3">
	<div class="p-6 col-span-1 lg:col-span-2 flex flex-col gap-6">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
			Welcome, {user?.firstName}
			{user?.lastName}
		</h1>
	</div>
	<div class="col-span-3 p-6 grid grid-cols-12 gap-4">
		<!-- Original metric cards -->
		<div class="col-span-12 md:col-span-6 lg:col-span-4">
			<Card.Root>
				<Card.Content class="p-2 md:p-4">
					<div class="flex gap-4 items-center">
						<div class="bg-blue-800 p-2 rounded-full">
							<FileClock size={24} color={'white'} />
						</div>
						<div class="space-y-2">
							<p class="text-slate-500">Timesheets Due</p>
							<p class="font-bold text-2xl md:text-4xl">{timesheetsDueCount}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div class="col-span-12 md:col-span-6 lg:col-span-4">
			<Card.Root>
				<Card.Content class="p-2 md:p-4">
					<div class="flex gap-4 items-center">
						<div class="bg-yellow-400 p-2 rounded-full">
							<AlertCircle size={24} color={'white'} />
						</div>
						<div class="space-y-2">
							<p class="text-slate-500">Timesheet Discrepancies</p>
							<p class="font-bold text-2xl md:text-4xl">{timesheetDiscrepancies}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div class="col-span-12 md:col-span-6 lg:col-span-4">
			<Card.Root>
				<Card.Content class="p-2 md:p-4">
					<div class="flex gap-4 items-center">
						<div class="bg-blue-800 p-2 rounded-full">
							<UserPlus size={24} color={'white'} />
						</div>
						<div class="space-y-2">
							<p class="text-slate-500">New Applications</p>
							<p class="font-bold text-2xl md:text-4xl">{newApplicationsCount}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- New invoice metrics -->
		<div class="col-span-12 md:col-span-6 lg:col-span-4">
			<Card.Root>
				<Card.Content class="p-2 md:p-4">
					<div class="flex gap-4 items-center">
						<div class="bg-green-700 p-2 rounded-full">
							<DollarSign size={24} color={'white'} />
						</div>
						<div class="space-y-2">
							<p class="text-slate-500">Total Amount Due</p>
							<p class="font-bold text-2xl md:text-3xl">{formatCurrency(totalAmountDue)}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div class="col-span-12 md:col-span-6 lg:col-span-4">
			<Card.Root>
				<Card.Content class="p-2 md:p-4">
					<div class="flex gap-4 items-center">
						<div class="bg-yellow-600 p-2 rounded-full">
							<FileText size={24} color={'white'} />
						</div>
						<div class="space-y-2">
							<p class="text-slate-500">Pending Invoices</p>
							<p class="font-bold text-2xl md:text-4xl">{pendingInvoicesCount}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div class="col-span-12 md:col-span-6 lg:col-span-4">
			<Card.Root>
				<Card.Content class="p-2 md:p-4">
					<div class="flex gap-4 items-center">
						<div class="bg-red-600 p-2 rounded-full">
							<AlertCircle size={24} color={'white'} />
						</div>
						<div class="space-y-2">
							<p class="text-slate-500">Overdue Invoices</p>
							<p class="font-bold text-2xl md:text-4xl">{overdueInvoicesCount}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Invoices table -->
		<div class="col-span-12 lg:col-span-8">
			<Card.Root>
				<Card.Header class="flex flex-row justify-between items-center flex-wrap">
					<Card.Title class="text-xl md:text-2xl">Recent Invoices</Card.Title>
					<Button class="bg-blue-900 hover:bg-blue-800" href="/invoices/new">
						<PlusIcon size={20} class="mr-2" /> New Invoice
					</Button>
				</Card.Header>
				<Card.Content class="p-2 md:p-4">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Invoice #</Table.Head>
								<Table.Head>Client</Table.Head>
								<Table.Head>Due Date</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head class="text-right">Amount</Table.Head>
								<Table.Head>Type</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each invoices as invoiceData, i (invoiceData.invoice.id)}
								<Table.Row
									class="cursor-pointer"
									on:click={() => goto(`/invoices/${invoiceData.invoice.id}`)}
								>
									<Table.Cell class="font-medium">{invoiceData.invoice.invoiceNumber}</Table.Cell>
									<Table.Cell>
										<div class="flex flex-col">
											<span class="font-medium">{invoiceData.client.name}</span>
											<span class="text-xs text-gray-500"
												>{invoiceData.clientUser.firstName} {invoiceData.clientUser.lastName}</span
											>
										</div>
									</Table.Cell>
									<Table.Cell>
										{#if invoiceData.invoice.dueDate}
											<span
												class={cn(
													'text-sm',
													new Date(invoiceData.invoice.dueDate) < new Date() &&
														invoiceData.invoice.status !== 'paid' &&
														'text-red-600 font-semibold'
												)}
											>
												{format(invoiceData.invoice.dueDate, 'PP')}
											</span>
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</Table.Cell>
									<Table.Cell>
										<Badge
											class={cn(
												invoiceData.invoice.status === 'draft' && 'bg-gray-400 hover:bg-gray-500',
												invoiceData.invoice.status === 'open' && 'bg-blue-500 hover:bg-blue-600',
												invoiceData.invoice.status === 'paid' && 'bg-green-500 hover:bg-green-600',
												invoiceData.invoice.status === 'uncollectible' &&
													'bg-orange-500 hover:bg-orange-600',
												invoiceData.invoice.status === 'void' && 'bg-gray-600 hover:bg-gray-700'
											)}
											value={invoiceData.invoice.status.toUpperCase()}
										/>
									</Table.Cell>
									<Table.Cell class="text-right font-semibold">
										{formatCurrency(invoiceData.invoice.total)}
									</Table.Cell>
									<Table.Cell>
										<Badge variant="outline" value={invoiceData.invoice.sourceType.toUpperCase()} />
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
				<Card.Footer>
					<Button class="bg-blue-900 hover:bg-blue-800" href="/invoices">See All</Button>
				</Card.Footer>
			</Card.Root>
		</div>

		<!-- Requisitions table (moved to adjust layout) -->
		<div class="col-span-12 lg:col-span-4">
			<Card.Root>
				<Card.Header class="flex flex-row justify-between items-center flex-wrap">
					<Card.Title class="text-xl md:text-2xl">Recent Requisitions</Card.Title>
					<Button
						on:click={() => goto('/requisitions')}
						size="sm"
						class="bg-blue-900 hover:bg-blue-800"
					>
						<PlusIcon size={16} class="mr-1" /> New
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
							{#each requisitions.slice(0, 5) as req, i (req.id)}
								<Table.Row class="cursor-pointer" on:click={() => goto(`/requisitions/${req.id}`)}>
									<Table.Cell>
										<div class="flex flex-col">
											<span class="font-medium truncate max-w-[150px]">{req.title}</span>
											<span class="text-xs text-gray-500">{formatDate(req.createdAt)}</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<Badge
											variant="secondary"
											value={req.status}
											class={cn(
												req.status === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
												req.status === 'OPEN' && 'bg-blue-500 hover:bg-blue-600',
												req.status === 'FILLED' && 'bg-green-400 hover:bg-bg-green-500',
												req.status === 'UNFULFILLED' && 'bg-orange-400 hover:bg-orange-500',
												req.status === 'CANCELED' && 'bg-red-500 hover:bg-red-600',
												'text-white'
											)}
										/>
									</Table.Cell>
									<Table.Cell class="text-right">{formatCurrency(req.hourlyRate)}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
				<Card.Footer>
					<Button size="sm" class="bg-blue-900 hover:bg-blue-800" href="/requisitions"
						>See All</Button
					>
				</Card.Footer>
			</Card.Root>
		</div>
		<!-- Timesheets Due -->
		<div class="col-span-12 lg:col-span-6">
			<Card.Root>
				<Card.Header class="flex flex-row justify-between items-center flex-wrap">
					<Card.Title class="text-xl md:text-2xl">Timesheets Due</Card.Title>
					<Button size="sm" class="bg-blue-900 hover:bg-blue-800" href={'/timesheets'}
						>See All</Button
					>
				</Card.Header>
				<Card.Content class="p-2 md:p-4">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="">Requisition</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head>Hours</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each timesheetsDue.slice(0, 5) as timesheet, i (timesheet.timesheet.id)}
								<Table.Row
									class="cursor-pointer"
									on:click={() => goto(`/timesheets/${timesheet.timesheet.id}`)}
								>
									<Table.Cell>
										<div class="flex flex-col">
											<span class="font-medium truncate max-w-[150px]"
												>{timesheet.requisition.title}</span
											>
											<span class="text-xs text-gray-500">
												{timesheet.candidate?.firstName}
												{timesheet.candidate?.lastName}
											</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<Badge
											variant="secondary"
											class={cn(
												timesheet.timesheet.status === 'PENDING' &&
													'bg-yellow-300 hover:bg-yellow-400',
												timesheet.timesheet.status === 'DISCREPANCY' &&
													'bg-orange-400 hover:bg-bg-orange-500',
												timesheet.timesheet.status === 'APPROVED' &&
													'bg-green-400 hover:bg-green-600',
												timesheet.timesheet.status === 'VOID' && 'bg-gray-200 hover:bg-gray-300',
												timesheet.timesheet.status === 'REJECTED' && 'bg-red-500 hover:bg-red-500'
											)}
											value={timesheet.timesheet.status}
										/>
									</Table.Cell>
									<Table.Cell>
										<span class="text-gray-500">
											{format(
												parse(timesheet.timesheet.weekBeginDate, 'yyyy-MM-dd', new Date()),
												'PP'
											)}
										</span>
									</Table.Cell>
									<Table.Cell>
										<span class="text-gray-500">
											{timesheet.timesheet.totalHoursWorked}
										</span>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Recent Applications -->
		<div class="col-span-12 lg:col-span-6">
			<Card.Root>
				<Card.Header class="flex flex-row justify-between items-center flex-wrap">
					<Card.Title class="text-xl md:text-2xl">Recent Applications</Card.Title>
				</Card.Header>
				<Card.Content class="p-2 md:p-4">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="">Position</Table.Head>
								<Table.Head class="">Applicant</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head>Applied Date</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each recentApplications as { application, user, requisition }, i (application.id)}
								<Table.Row
									class="cursor-pointer"
									on:click={() =>
										goto(`/requisitions/${requisition.id}/application/${application.id}`)}
								>
									<Table.Cell>
										<div class="flex flex-col">
											<span class="font-medium">{requisition.title}</span>
										</div>
									</Table.Cell>

									<Table.Cell>
										<p>{user.firstName} {user.lastName}</p>
									</Table.Cell>
									<Table.Cell>
										<Badge
											value={application.status}
											class={cn(
												application.status === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
												application.status === 'NEW' && 'bg-green-400 hover:bg-bg-green-500',
												application.status === 'CLOSED' && 'bg-red-500 hover:bg-red-600'
											)}
										/>
									</Table.Cell>
									<Table.Cell>
										<span class="text-gray-500">
											{format(application.createdAt, 'PP')}
										</span>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</section>
