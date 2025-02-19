<script lang="ts">
	import DonutChart from '$lib/components/dashboard/admin/donut-chart.svelte';
	import EntityCard from '$lib/components/dashboard/admin/entity-card.svelte';
	import EventSummaryChart from '$lib/components/dashboard/admin/event-summary-chart.svelte';
	import NotificationsMenu from '$lib/components/notifications-menu.svelte';
	import { BarChart, CalendarClock, Search } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import type { User } from 'lucia';

	export let user: User;
	export let data;
</script>

<section class="grow grid grid-cols-1 lg:grid-cols-3">
	<div class="p-6 col-span-1 lg:col-span-2 flex flex-col gap-6">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
			Welcome, {user?.firstName}
			{user?.lastName}
		</h1>

		<div class="flex gap-4 lg:gap-0 rounded-lg flex-col lg:flex-row">
			<div
				class="w-full lg:w-1/3 py-4 px-6 rounded-[inherit] lg:rounded-l-[inherit] lg:rounded-r-none bg-gray-200 flex flex-col items-center gap-8"
			>
				<p class="text-2xl font-semibold">Sales Reports</p>
				<div class="w-full h-full">
					<DonutChart data={[23, 45, 65, 78]} />
				</div>
			</div>
			<div
				class="w-full lg:w-2/3 py-4 px-6 grow bg-blue-400 rounded-[inherit] lg:rounded-r-[inherit] lg:rounded-l-none"
			>
				<BarChart />
			</div>
		</div>
		<div class="flex gap-6 grow max-h-60 flex-wrap">
			<EntityCard name="TimeSheets Due" value={20}>
				<CalendarClock class="h-16 w-16" slot="icon" />
			</EntityCard>
			<EntityCard name="TimeSheets Due" value={10}>
				<CalendarClock class="h-16 w-16" slot="icon" />
			</EntityCard>
			<EntityCard name="TimeSheets Due" value={45}>
				<CalendarClock class="h-16 w-16" slot="icon" />
			</EntityCard>
			<EntityCard name="TimeSheets Due" value={150}>
				<CalendarClock class="h-16 w-16" slot="icon" />
			</EntityCard>
			<EntityCard name="TimeSheets Due" value={80}>
				<CalendarClock class="h-16 w-16" slot="icon" />
			</EntityCard>
		</div>
	</div>
	<div class="col-span-1 bg-white p-6 flex flex-col gap-6">
		<div class="flex gap-4 items-center">
			<div class="relative grow">
				<Search class="absolute left-3 top-2.5" size={20} />
				<Input type="text" class="bg-white pl-10" placeholder="Search" />
			</div>
			<NotificationsMenu notifications={[1, 2, 2, 2, 2, 2, 2]} />
		</div>
		<div class="p-4 bg-gray-100 rounded-lg flex flex-col gap-8 items-center">
			<p class="text-2xl text-center font-semibold">Daily Event Summary</p>
			<EventSummaryChart />
		</div>
		<div class="flex flex-col grow bg-gray-100 rounded-lg">
			<div class="p-4 flex items-center justify-center">
				<p class="text-2xl font-semibold">Recent Messages</p>
			</div>
		</div>
	</div>
</section>
