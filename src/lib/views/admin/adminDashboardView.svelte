<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import {
		AlertCircle,
		FileClock,
		MessageSquare,
		UserPlus,
		Users,
		TicketIcon,
		ArrowRight,
		BellRing,
		Clock,
		LineChart,
		TrendingUp,
		CheckCircle2,
		XCircle,
		Clock3,
		Building
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { formatCurrency, formatDate, formatTicketDate } from '$lib/_helpers';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { format, parse, subDays } from 'date-fns';
	import NotificationsMenu from '$lib/components/notifications-menu.svelte';
	import { onMount } from 'svelte';

	export let user;
	export let data;

	// Stats data
	$: timesheetsDueCount = data.timesheetsDueCount;
	$: supportTicketsCount = data.supportTicketsCount;
	$: timesheetDiscrepancies = data.discrepanciesCount;

	// Table data
	$: supportTickets = data.supportTickets;
	$: timesheetsWithDiscrepancies = data.timesheetsWithDiscrepancies;
	$: recentMessages = data.recentMessages;
	$: newCandidateProfiles = data.newCandidateProfiles;
	$: newClientSignups = data.newClientSignups;

	// Calculate the % change in timesheets due from previous period (dummy data for demo)
	const timesheetsTrendPercent = 12; // 12% increase
	const supportTicketsTrendPercent = -5; // 5% decrease
	const discrepanciesTrendPercent = 8; // 8% increase

	let activeTab = 'timesheets';

	// Simplified activity history for timeline
	const activityTimeline = [
		{
			time: '9:32 AM',
			date: 'Today',
			title: 'New timesheet submitted',
			description: 'Robert Jones submitted a timesheet for review',
			icon: FileClock,
			color: 'bg-blue-500'
		},
		{
			time: '8:15 AM',
			date: 'Today',
			title: 'Support ticket resolved',
			description: 'Amanda Taylor\'s login issue was resolved',
			icon: CheckCircle2,
			color: 'bg-green-500'
		},
		{
			time: '4:45 PM',
			date: 'Yesterday',
			title: 'New client onboarded',
			description: 'Quantum Solutions completed onboarding',
			icon: Building,
			color: 'bg-indigo-500'
		},
		{
			time: '2:30 PM',
			date: 'Yesterday',
			title: 'Timesheet discrepancy flagged',
			description: 'Discrepancy in Emily Davis\'s timesheet',
			icon: AlertCircle,
			color: 'bg-orange-500'
		},
		{
			time: '11:20 AM',
			date: 'Yesterday',
			title: 'New candidate profile',
			description: 'Daniel Clark submitted application',
			icon: UserPlus,
			color: 'bg-purple-500'
		}
	];

	// Demo chart data (for visualization purposes)
	let chartCanvas;

	onMount(() => {
		if (typeof window !== 'undefined' && chartCanvas) {
			// This would be replaced with a proper chart library like Chart.js
			// For now, just drawing a simple line to simulate a chart
			const ctx = chartCanvas.getContext('2d');
			const width = chartCanvas.width;
			const height = chartCanvas.height;

			// Clear canvas
			ctx.clearRect(0, 0, width, height);

			// Draw a line chart
			ctx.beginPath();
			ctx.moveTo(0, height * 0.8);
			ctx.lineTo(width * 0.2, height * 0.6);
			ctx.lineTo(width * 0.4, height * 0.7);
			ctx.lineTo(width * 0.6, height * 0.4);
			ctx.lineTo(width * 0.8, height * 0.5);
			ctx.lineTo(width, height * 0.3);

			// Style the line
			ctx.strokeStyle = '#3b82f6';
			ctx.lineWidth = 2;
			ctx.stroke();

			// Fill area under the line
			ctx.lineTo(width, height);
			ctx.lineTo(0, height);
			ctx.closePath();
			ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
			ctx.fill();
		}
	});

	// Function to determine status color class
	function getStatusColorClass(status) {
		return cn(
			status === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
			status === 'NEW' && 'bg-green-400 hover:bg-green-500',
			status === 'ACTIVE' && 'bg-green-400 hover:bg-green-500',
			status === 'DISCREPANCY' && 'bg-orange-400 hover:bg-orange-500',
			status === 'CLOSED' && 'bg-red-500 hover:bg-red-600',
			status === 'APPROVED' && 'bg-green-400 hover:bg-green-600',
			status === 'VOID' && 'bg-gray-200 hover:bg-gray-300',
			status === 'INACTIVE' && 'bg-gray-200 hover:bg-gray-300',
			status === 'REJECTED' && 'bg-red-500 hover:bg-red-600'
		);
	}

	// Function to format trend value with + or - sign
	function formatTrendValue(value) {
		return value > 0 ? `+${value}%` : `${value}%`;
	}

	// Function to get trend color
	function getTrendColorClass(value) {
		return value > 0 ? 'text-green-500' : 'text-red-500';
	}
</script>

<section class="min-h-screen bg-gray-50">
	<!-- Header area -->
	<div class="px-6 py-4 bg-white shadow-sm border-b border-gray-200">
		<div class="flex justify-between items-center max-w-7xl mx-auto">
			<h1 class="text-2xl font-bold text-gray-900">
				<span class="text-blue-600">Admin</span> Dashboard
			</h1>
			<div class="flex items-center space-x-4">
				<NotificationsMenu notifications={data.notifications || []} />
				<div class="flex items-center space-x-2">
					<div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
						{user?.firstName?.[0]}{user?.lastName?.[0]}
					</div>
					<span class="font-medium text-gray-700 hidden md:inline-block">
						{user?.firstName} {user?.lastName}
					</span>
				</div>
			</div>
		</div>
	</div>

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
		<div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
			<!-- Timesheets due -->
			<Card.Root class="">
				<Card.Content class="p-6">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-gray-500 text-sm font-medium">Timesheets Due</p>
							<div class="flex items-baseline mt-1">
								<p class="text-4xl font-bold text-gray-900">{timesheetsDueCount}</p>
								<span class={`ml-2 ${getTrendColorClass(timesheetsTrendPercent)} text-sm font-medium flex items-center`}>
									{formatTrendValue(timesheetsTrendPercent)}
									{#if timesheetsTrendPercent > 0 }
										<TrendingUp size={16} class="ml-1" />
										{:else}
										<TrendingUp size={16} class="ml-1 transform rotate-180" />
										{/if}
								</span>
							</div>
							<p class="text-gray-400 text-xs mt-1">vs. previous period</p>
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
			<Card.Root class="">
				<Card.Content class="p-6">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-gray-500 text-sm font-medium">Discrepancies</p>
							<div class="flex items-baseline mt-1">
								<p class="text-4xl font-bold text-gray-900">{timesheetDiscrepancies}</p>
								<span class={`ml-2 ${getTrendColorClass(discrepanciesTrendPercent)} text-sm font-medium flex items-center`}>
									{formatTrendValue(discrepanciesTrendPercent)}
									{#if discrepanciesTrendPercent > 0 }
										<TrendingUp size={16} class="ml-1" />
										{:else}
										<TrendingUp size={16} class="ml-1 transform rotate-180" />
										{/if}
								</span>
							</div>
							<p class="text-gray-400 text-xs mt-1">vs. previous period</p>
						</div>
						<div class="bg-orange-100 p-3 rounded-full">
							<AlertCircle size={24} class="text-orange-600" />
						</div>
					</div>
					<div class="mt-4">
						<Button variant="link" class="text-orange-600 p-0 h-auto" href="/timesheets/discrepancies">
							Review discrepancies
							<ArrowRight size={16} class="ml-1" />
						</Button>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Support tickets card -->
			<Card.Root class="">
				<Card.Content class="p-6">
					<div class="flex justify-between items-start">
						<div>
							<p class="text-gray-500 text-sm font-medium">Support Tickets</p>
							<div class="flex items-baseline mt-1">
								<p class="text-4xl font-bold text-gray-900">{supportTicketsCount}</p>
								<span class={`ml-2 ${getTrendColorClass(supportTicketsTrendPercent)} text-sm font-medium flex items-center`}>
									{formatTrendValue(supportTicketsTrendPercent)}
									{#if supportTicketsTrendPercent > 0 }
										<TrendingUp size={16} class="ml-1" />
										{:else}
										<TrendingUp size={16} class="ml-1 transform rotate-180" />
										{/if}
								</span>
							</div>
							<p class="text-gray-400 text-xs mt-1">vs. previous period</p>
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
		</div>

		<!-- Main grid -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left column - Tables section -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Tab navigation -->
				<div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
					<div class="flex border-b border-gray-200">
						<button
							class={`flex-1 py-4 px-4 text-center font-medium ${activeTab === 'timesheets' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
							on:click={() => activeTab = 'timesheets'}
						>
							Timesheets with Issues
						</button>
						<button
							class={`flex-1 py-4 px-4 text-center font-medium ${activeTab === 'tickets' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
							on:click={() => activeTab = 'tickets'}
						>
							Support Tickets
						</button>
						<button
							class={`flex-1 py-4 px-4 text-center font-medium ${activeTab === 'messages' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
							on:click={() => activeTab = 'messages'}
						>
							Recent Messages
						</button>
					</div>

					<div class="p-4">
						{#if activeTab === 'timesheets'}
							<Table.Root class="w-full">
								<Table.Header>
									<Table.Row>
										<Table.Head>Requisition</Table.Head>
										<Table.Head>Candidate</Table.Head>
										<Table.Head>Date</Table.Head>
										<Table.Head class="text-right">Issues</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each timesheetsWithDiscrepancies.slice(0, 5) as timesheet, i (timesheet.id)}
										<Table.Row class="cursor-pointer hover:bg-gray-50" on:click={() => goto(`/timesheets/${timesheet.id}`)}>
											<Table.Cell>
												<span class="font-medium text-gray-900">{timesheet.requisition.title}</span>
											</Table.Cell>
											<Table.Cell>
												{timesheet.candidate?.firstName} {timesheet.candidate?.lastName}
											</Table.Cell>
											<Table.Cell>
												<div class="flex items-center text-gray-500">
													<Clock size={14} class="mr-1" />
													{format(parse(timesheet.weekBeginDate, 'yyyy-MM-dd', new Date()), "MMM d")}
												</div>
											</Table.Cell>
											<Table.Cell class="text-right">
												<Badge
													class="bg-orange-100 text-orange-800 hover:bg-orange-200"
													value={timesheet.discrepancyCount}
												/>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
							<div class="mt-4 flex justify-end">
								<Button variant="outline" class="text-sm" href="/timesheets/discrepancies">
									View all issues
									<ArrowRight size={14} class="ml-1" />
								</Button>
							</div>
						{:else if activeTab === 'tickets'}
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
									{#each supportTickets.slice(0, 5) as ticket, i (ticket.id)}
										<Table.Row class="cursor-pointer hover:bg-gray-50" on:click={() => goto(`/support/ticket/${ticket.id}`)}>
											<Table.Cell>
												<span class="font-medium text-gray-900">{ticket.title}</span>
											</Table.Cell>
											<Table.Cell>
												{ticket.user.firstName} {ticket.user.lastName}
											</Table.Cell>
											<Table.Cell>
												<div class="flex items-center text-gray-500">
													<Clock size={14} class="mr-1" />
													{formatTicketDate(ticket.createdAt)}
												</div>
											</Table.Cell>
											<Table.Cell class="text-right">
												<Badge
													value={ticket.status}
													class={getStatusColorClass(ticket.status)}
												/>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
							<div class="mt-4 flex justify-end">
								<Button variant="outline" class="text-sm" href="/support">
									View all tickets
									<ArrowRight size={14} class="ml-1" />
								</Button>
							</div>
						{:else if activeTab === 'messages'}
							<Table.Root class="w-full">
								<Table.Header>
									<Table.Row>
										<Table.Head>From</Table.Head>
										<Table.Head>Subject</Table.Head>
										<Table.Head>Date</Table.Head>
										<Table.Head class="text-right">Status</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each recentMessages.slice(0, 5) as message, i (message.id)}
										<Table.Row class="cursor-pointer hover:bg-gray-50" on:click={() => goto(`/messages/${message.id}`)}>
											<Table.Cell>
												<span class="font-medium text-gray-900">{message.sender.firstName} {message.sender.lastName}</span>
											</Table.Cell>
											<Table.Cell>
												{message.subject}
											</Table.Cell>
											<Table.Cell>
												<div class="flex items-center text-gray-500">
													<Clock size={14} class="mr-1" />
													{formatDate(message.createdAt)}
												</div>
											</Table.Cell>
											<Table.Cell class="text-right">
												<Badge
													class={message.read ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"}
													value={message.read ? "Read" : "Unread"}
												/>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
							<div class="mt-4 flex justify-end">
								<Button variant="outline" class="text-sm" href="/messages">
									View all messages
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
									New Candidate Profiles
								</Card.Title>
							</div>
						</Card.Header>
						<Card.Content class="pt-4">
							<ul class="space-y-3">
								{#each newCandidateProfiles.slice(0, 4) as profile, i (profile.id)}
									<li class="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer" on:click={() => goto(`/candidates/${profile.id}`)}>
										<div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-3">
											{profile.firstName[0]}{profile.lastName[0]}
										</div>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-gray-900 truncate">
												{profile.firstName} {profile.lastName}
											</p>
											<p class="text-xs text-gray-500 truncate">
												{profile.desiredPosition}
											</p>
										</div>
										<Badge class="bg-yellow-100 text-yellow-800" value="Review"></Badge>
									</li>
								{/each}
							</ul>
							<div class="mt-4 text-center">
								<Button variant="outline" size="sm" class="w-full" href="/candidates/pending">
									View all candidates
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
									New Client Signups
								</Card.Title>
							</div>
						</Card.Header>
						<Card.Content class="pt-4">
							<ul class="space-y-3">
								{#each newClientSignups.slice(0, 4) as client, i (client.id)}
									<li class="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer" on:click={() => goto(`/clients/${client.id}`)}>
										<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium mr-3">
											{client.companyName[0]}
										</div>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-gray-900 truncate">
												{client.companyName}
											</p>
											<p class="text-xs text-gray-500 truncate">
												{client.contactFirstName} {client.contactLastName}
											</p>
										</div>
										<Badge
											class={client.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
												   client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
												   'bg-gray-100 text-gray-800'}
											value={client.status}
										/>
									</li>
								{/each}
							</ul>
							<div class="mt-4 text-center">
								<Button variant="outline" size="sm" class="w-full" href="/clients">
									View all clients
								</Button>
							</div>
						</Card.Content>
					</Card.Root>
				</div>
			</div>

			<!-- Right column - Activity and charts -->
			<div class="space-y-6">
				<!-- Activity timeline -->
				<Card.Root>
					<Card.Header class="pb-2">
						<Card.Title class="flex items-center text-lg font-semibold">
							<Clock size={20} class="mr-2 text-blue-600" />
							Recent Activity
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="relative">
							<!-- Timeline line -->
							<div class="absolute h-full w-0.5 bg-gray-200 left-2.5 top-0 rounded-full"></div>

							<ul class="space-y-4 relative ml-6">
								{#each activityTimeline as activity, i}
									<li class="relative pb-4">
										<!-- Timeline dot -->
										<div class={`absolute -left-6 mt-1.5 w-5 h-5 rounded-full ${activity.color} flex items-center justify-center`}>
											<svelte:component this={activity.icon} size={12} color="white" />
										</div>

										<div class="flex flex-col">
											<div class="flex items-center text-sm">
												<p class="font-medium text-gray-900">{activity.title}</p>
												<span class="ml-auto text-xs text-gray-500">{activity.time}</span>
											</div>
											<p class="text-xs text-gray-500 mt-0.5">{activity.description}</p>
											<p class="text-xs font-medium text-gray-400 mt-1">{activity.date}</p>
										</div>
									</li>
								{/each}
							</ul>
						</div>
						<div class="mt-2 text-center">
							<Button variant="ghost" size="sm" class="text-blue-600 text-xs">
								View all activity
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</section>
