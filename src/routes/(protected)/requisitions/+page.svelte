<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import {
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		Plus,
		Search,
		Filter,
		Eye,
		MoreHorizontal,
		ChevronLeft,
		ChevronRight
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import type { PageData } from './$types';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { USER_ROLES } from '$lib/config/constants';
	import {
		type AdminRequisitionSchema,
		type ClientRequisitionSchema
	} from '$lib/config/zod-schemas';
	import type {
		RequisitionDetailsRaw,
		RequisitionResults
	} from '$lib/server/database/queries/requisitions';
	import AddRequisitionDrawer from '$lib/components/drawers/addRequisitionDrawer.svelte';

	export let data: PageData;
	export let adminForm: SuperValidated<AdminRequisitionSchema> | null = null;

	const ITEMS_PER_PAGE = 10;

	let drawerExpanded = false;
	let searchTerm = '';
	let activeTab = 'open';

	$: user = data.user;
	$: requisitions = data.requisitions as RequisitionResults;
	$: clientForm = data.clientForm as SuperValidated<ClientRequisitionSchema>;
	$: count = data.count;
	$: sortOn = $page.url.searchParams.get('sortOn');
	$: sortBy = $page.url.searchParams.get('sortBy');
	$: currentPage = Number($page.url.searchParams.get('skip')) || 0;
	$: totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0;

	// Group requisitions by status
	$: groupedRequisitions = {
		open: (requisitions || []).filter((req) => req.status === 'OPEN'),
		filled: (requisitions || []).filter((req) => req.status === 'FILLED'),
		unfulfilled: (requisitions || []).filter((req) => req.status === 'UNFULFILLED'),
		canceled: (requisitions || []).filter((req) => req.status === 'CANCELED')
	};

	// Apply search filter
	$: filteredRequisitions = Object.fromEntries(
		Object.entries(groupedRequisitions || {}).map(([status, reqs]) => [
			status,
			(reqs || []).filter(
				(req) =>
					req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					req.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					`${req.first_name} ${req.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
			)
		])
	);

	// Column definitions
	const getColumns = (isAdmin: boolean) => {
		const baseColumns = [
			{
				id: 'id',
				header: 'Req #',
				accessorKey: 'id',
				sortable: false
			},
			{
				id: 'name',
				header: 'Title',
				accessorKey: 'name',
				sortable: true
			}
		];

		if (isAdmin) {
			baseColumns.push({
				id: 'client',
				header: 'Client',
				accessorKey: 'client',
				sortable: true
			});
		}

		baseColumns.push(
			{
				id: 'location_name',
				header: 'Office',
				accessorKey: 'location_name',
				sortable: true
			},
			{
				id: 'region_abbreviation',
				header: 'Region',
				accessorKey: 'region_abbreviation',
				sortable: true
			}
		);

		if (!isAdmin) {
			baseColumns.push({
				id: 'permanent_position',
				header: 'Type',
				accessorKey: 'permanent_position',
				sortable: true
			});
		}

		return baseColumns;
	};

	$: columns = getColumns(user?.role === USER_ROLES.SUPERADMIN);
	$: isAdmin = user?.role === USER_ROLES.SUPERADMIN;

	function handleSort(columnId: string) {
		if (!columns.find((col) => col.id === columnId)?.sortable) return;

		const query = new URLSearchParams($page.url.searchParams.toString());
		const currentSortOn = query.get('sortOn');
		const currentSortBy = query.get('sortBy');

		if (currentSortOn === columnId) {
			if (currentSortBy === 'asc') {
				query.set('sortBy', 'desc');
			} else if (currentSortBy === 'desc') {
				query.delete('sortBy');
				query.delete('sortOn');
			} else {
				query.set('sortBy', 'asc');
				query.set('sortOn', columnId);
			}
		} else {
			query.set('sortOn', columnId);
			query.set('sortBy', 'asc');
		}

		goto(`?${query.toString()}`);
	}

	function handlePagination(direction: 'prev' | 'next') {
		const query = new URLSearchParams($page.url.searchParams.toString());

		if (direction === 'prev' && currentPage > 0) {
			const newPage = currentPage - ITEMS_PER_PAGE;
			query.set('skip', String(newPage));
		} else if (direction === 'next' && currentPage < (totalPages - 1) * ITEMS_PER_PAGE) {
			const newPage = currentPage + ITEMS_PER_PAGE;
			query.set('skip', String(newPage));
		}

		goto(`?${query.toString()}`);
	}

	function resetQuery() {
		const query = new URLSearchParams();
		goto(`?${query.toString()}`);
	}

	function getSortIcon(columnId: string) {
		if (sortOn !== columnId) return ArrowUpDown;
		return sortBy === 'asc' ? ArrowUp : ArrowDown;
	}

	function formatClientName(req: RequisitionDetailsRaw) {
		return `${req.last_name}, Dr. ${req.first_name}`;
	}

	function getTabCounts() {
		if (!groupedRequisitions) {
			return {
				open: 0,
				filled: 0,
				unfulfilled: 0,
				canceled: 0
			};
		}
		return {
			open: groupedRequisitions.open?.length || 0,
			filled: groupedRequisitions.filled?.length || 0,
			unfulfilled: groupedRequisitions.unfulfilled?.length || 0,
			canceled: groupedRequisitions.canceled?.length || 0
		};
	}

	$: tabCounts = getTabCounts();

	// Get current tab data
	$: currentTabData = (filteredRequisitions && filteredRequisitions[activeTab]) || [];
	$: currentTabCount = currentTabData.length;
</script>

<section class="flex flex-col h-full p-6 space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Requisitions</h1>
			<p class="text-muted-foreground">Manage and track job requisitions</p>
		</div>

		<div class="flex items-center gap-3">
			{#if !isAdmin}
				<Button on:click={() => (drawerExpanded = true)}>
					<Plus class="h-4 w-4 mr-2" />
					New Requisition
				</Button>
			{/if}
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="relative flex-1 max-w-sm">
			<Search
				class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
			/>
			<Input bind:value={searchTerm} placeholder="Search requisitions..." class="pl-9" />
		</div>

		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" on:click={resetQuery}>Reset Filters</Button>
		</div>
	</div>

	<!-- Tabs with Tables -->
	<Tabs.Root bind:value={activeTab} class="flex-1 flex flex-col">
		<Tabs.List class="grid w-full grid-cols-4">
			<Tabs.Trigger value="open" class="relative">
				Open
				{#if tabCounts.open > 0}
					<Badge variant="secondary" class="ml-2 h-5 min-w-5 text-xs" value={tabCounts.open} />
				{/if}
			</Tabs.Trigger>
			<Tabs.Trigger value="filled" class="relative">
				Filled
				{#if tabCounts.filled > 0}
					<Badge variant="secondary" class="ml-2 h-5 min-w-5 text-xs" value={tabCounts.filled} />
				{/if}
			</Tabs.Trigger>
			<Tabs.Trigger value="unfulfilled" class="relative">
				Unfulfilled
				{#if tabCounts.unfulfilled > 0}
					<Badge
						variant="secondary"
						class="ml-2 h-5 min-w-5 text-xs"
						value={tabCounts.unfulfilled}
					/>
				{/if}
			</Tabs.Trigger>
			<Tabs.Trigger value="canceled" class="relative">
				Canceled
				{#if tabCounts.canceled > 0}
					<Badge variant="secondary" class="ml-2 h-5 min-w-5 text-xs" value={tabCounts.canceled} />
				{/if}
			</Tabs.Trigger>
		</Tabs.List>

		<!-- Single Tab Content that changes based on activeTab -->
		<Tabs.Content value={activeTab} class="flex-1 flex flex-col">
			<div class="rounded-md border flex flex-col bg-white shadow-sm">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							{#each columns as column}
								<Table.Head
									class={cn(
										'cursor-pointer hover:bg-muted/50 transition-colors',
										!column.sortable && 'cursor-default'
									)}
									on:click={() => handleSort(column.id)}
								>
									<div class="flex items-center gap-2">
										{column.header}
										{#if column.sortable}
											<svelte:component this={getSortIcon(column.id)} class="h-4 w-4" />
										{/if}
									</div>
								</Table.Head>
							{/each}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each currentTabData as req (req.id)}
							<Table.Row
								class="hover:bg-muted/50 cursor-pointer"
								on:click={() => goto(`/requisitions/${req.id}`)}
							>
								<Table.Cell class="font-medium">
									<a href="/requisitions/{req.id}" class="text-primary hover:underline font-mono">
										#{req.id}
									</a>
								</Table.Cell>
								<Table.Cell class="max-w-xs truncate" title={req.name}>
									{req.name}
								</Table.Cell>
								{#if isAdmin}
									<Table.Cell>
										{formatClientName(req)}
									</Table.Cell>
								{/if}
								<Table.Cell>{req.location_name || '-'}</Table.Cell>
								<Table.Cell>{req.region_abbreviation || '-'}</Table.Cell>
								{#if !isAdmin}
									<Table.Cell>
										<Badge
											variant={req.permanent_position ? 'default' : 'secondary'}
											value={req.permanent_position ? 'Permanent' : 'Temporary'}
										/>
									</Table.Cell>
								{/if}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="text-center py-8">
									<div class="flex flex-col items-center gap-2 text-muted-foreground">
										<Filter class="h-8 w-8" />
										<p>No {activeTab} requisitions found</p>
										{#if searchTerm}
											<p class="text-sm">Try adjusting your search terms</p>
										{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<!-- Pagination -->
			{#if currentTabCount > 0 && totalPages > 1}
				<div class="flex items-center justify-between px-2 py-4">
					<div class="text-sm text-muted-foreground">
						Showing {currentPage + 1} to {Math.min(currentPage + ITEMS_PER_PAGE, currentTabCount)} of
						{currentTabCount}
						results
					</div>
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 0}
							on:click={() => handlePagination('prev')}
						>
							<ChevronLeft class="h-4 w-4 mr-1" />
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage >= (totalPages - 1) * ITEMS_PER_PAGE}
							on:click={() => handlePagination('next')}
						>
							Next
							<ChevronRight class="h-4 w-4 ml-1" />
						</Button>
					</div>
				</div>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</section>

<!-- Add Requisition Drawer -->
<AddRequisitionDrawer {user} bind:drawerExpanded {clientForm} adminForm={adminForm ?? null} />
