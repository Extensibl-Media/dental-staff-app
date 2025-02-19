<script lang="ts">
	import { format } from 'date-fns';
	import * as Avatar from '$lib/components/ui/avatar';
	import type { PageData } from './$types';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';

	export let data: PageData;
	$: user = data.user;
	$: ticket = data.ticket;
</script>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<Avatar.Root>
			<Avatar.Image src={ticket.details.reportedBy?.avatarUrl} class="h-12 w-12" />
		</Avatar.Root>
		<div>
			<p class="text-xl font-semibold">
				{ticket.details.reportedBy?.firstName}
				{ticket.details.reportedBy?.lastName}
			</p>
			<p class="bg-gray-200 text-black rounded-full w-fit px-2 py-.5 text-xs">
				{ticket.details.reportedBy?.role.replace('_', ' ')}
			</p>
		</div>
	</div>
	<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
		{ticket.details.ticket.title}
	</h1>
	<div>
		<p>Submitted on: {format(ticket.details.ticket.createdAt, 'PPp')}</p>
		<div class="flex items-center gap-2">
			<span>Status: </span>
			<Badge
				value={ticket.details.ticket.status}
				class={cn(
					ticket.details.ticket.status === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
					ticket.details.ticket.status === 'NEW' && 'bg-green-400 hover:bg-bg-green-500',
					ticket.details.ticket.status === 'CLOSED' && 'bg-red-500 hover:bg-red-600'
				)}
			/>
		</div>
	</div>
	<div class="space-y-4">
		<div>
			<p class="font-semibold">Actual Results:</p>
			<p class="text-sm">{ticket.details.ticket.actualResults}</p>
		</div>
		<div>
			<p class="font-semibold">Expected Results:</p>
			<p class="text-sm">{ticket.details.ticket.expectedResult}</p>
		</div>
		<div>
			<p class="font-semibold">Steps to Reproduce:</p>
			<p class="text-sm">{ticket.details.ticket.stepsToReproduce}</p>
		</div>
	</div>
	<div class="space-y-6">
		<p class="text-2xl font-semibold">Comments:</p>
	</div>
</section>
