<script lang="ts">
	import type { ClientCompanyLocation } from '$lib/server/database/schemas/client';
	import { CANDIDATE_STATUS, USER_ROLES } from '$lib/config/constants';
	import type { PageData } from './$types';
	import * as Avatar from '$lib/components/ui/avatar';
	import convertNameToInitials from '$lib/_helpers/convertNameToInitials';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import Calendar from '$lib/components/calendar/calendar.svelte';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import { PencilIcon } from 'lucide-svelte';
	import * as Table from '$lib/components/ui/table';
	// import { format } from 'date-fns';

	import {
		getCoreRowModel,
		type ColumnDef,
		getSortedRowModel,
		type TableOptions,
		createSvelteTable,
		flexRender
	} from '@tanstack/svelte-table';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';

	const statusStyles: Record<keyof typeof CANDIDATE_STATUS, string> = {
		INACTIVE: 'bg-gray-200 text-gray-800 border-gray-800',
		PENDING: 'bg-yellow-100 text-yellow-600 border-yellow-600',
		ACTIVE: 'bg-green-200 text-green-600 border-green-600'
	};

	export let data: PageData;
	let initials: string = '';
	let locationTableData: ClientCompanyLocation[] = [];

	// $: birthdate = new Date(candidate?.profile.birthday as string);
	$: user = data.user;
	$: isAdmin = user?.role === USER_ROLES.SUPERADMIN;
	$: client = data.client;
	$: locations = data.client?.locations || [];
	$: {
		locationTableData = locations;
	}

	$: {
		if (client) {
			console.log(client);
			initials = convertNameToInitials(client.user.firstName, client.user.lastName);
		}
	}

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
</script>

{#if client}
	<section class="grow h-screen overflow-y-auto p-6 flex flex-col">
		<div class="flex flex-col gap-4 md:gap-6 w-full">
			<div class="flex gap-4 md:gap-8 flex-wrap">
				<Avatar.Root class="bg-gray-300 rounded-lg w-24 h-24 md:w-36 md:h-36">
					<Avatar.Fallback class="bg-transparent text-4xl md:text-6xl font-semibold"
						>{initials}</Avatar.Fallback
					>
					<Avatar.Image src={client.user.avatarUrl} />
				</Avatar.Root>
				<div class="flex flex-col gap-4">
					<h1 class="font-semibold text-4xl md:text-5xl flex items-center gap-2">
						{client.user.firstName}
						{client.user.lastName}
						{#if isAdmin}
							<button class="inline bg-gray-200 p-2 rounded-sm hover:bg-gray-300"
								><a href={`${client.profile.id}/edit`}><PencilIcon /></a></button
							>
						{/if}
					</h1>
					<div class=" py-1 font-semibold text-xl w-fit">
						{client.company.companyName}
					</div>
					<!-- {#if isAdmin}
						<div
							class={cn(
								client ? statusStyles['PENDING'] : '',
								'px-3 py-1 rounded-sm border text-sm w-fit'
							)}
						>
							{client.profile.status}
						</div>
					{/if} -->
				</div>
			</div>
			<div>
				<Tabs
					class=""
					tabStyle="underline"
					contentClass="py-4"
					inactiveClasses="p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50"
					activeClasses="border-b-2 border-b-blue-500 p-4 text-primary-600 bg-gray-100 rounded-t-lg"
				>
					<TabItem open title="Profile" class="">
						<div class="flex flex-col gap-4 md:gap-8">
							<div>
								<div class="grid grid-cols-3 gap-6">
									<div class="col-span-3 md:col-span-1">
										<p class="text-lg text-blue-600 font-semibold">Personal Details</p>
										<div class="mt-4">
											<p class="text-sm font-semibold">Email:</p>
											<p class="text-sm">{client.user.email}</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Address:</p>
											<!-- <p class="text-sm">{client.profile.address}</p>
											<p class="text-sm">{client.profile.city}, {client.profile.state}</p> -->
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Contact Info:</p>
											<!-- <p class="text-sm">Cell Phone: {client.profile.cellPhone}</p> -->
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Date of Birth:</p>
											<!-- <p class="text-sm">{format(birthdate, 'P')}</p> -->
										</div>
									</div>
									<div class="col-span-3 md:col-span-1">
										<p class="text-lg text-blue-600 font-semibold">Work Preferences</p>
										<div class="mt-4">
											<p class="text-sm font-semibold">Preferred Positions:</p>
											<p class="text-sm">
												Consultant, Dental Assistant, Dentist, Floater, Front Office, Hygienist
											</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Rate of Pay:</p>
											<p class="text-sm">
												<!-- ${client.profile.hourlyRateMin} - {client.profile.hourlyRateMax} -->
											</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Pay Frequency:</p>
											<p class="text-sm">Weekly</p>
										</div>
									</div>
									<!-- <div class="col-span-3 md:col-span-1">
										<p class="text-lg text-blue-600 font-semibold">Location</p>
										<div class="mt-4">
											<p class="text-sm font-semibold">Region:</p>
											<p class="text-sm">{client.region?.name}</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Sub-region:</p>
											<p class="text-sm">{client.subRegion?.name || 'None Selected'}</p>
										</div>
									</div> -->
								</div>
							</div>
						</div>
					</TabItem>
					<TabItem title="Locations">
						<div class="column">
							<Table.Root class="table">
								<Table.TableHeader>
									{#each $locationTable.getHeaderGroups() as headerGroup}
										<Table.TableRow class="bg-white">
											{#each headerGroup.headers as header}
												<Table.TableHead colspan={header.colSpan}>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
												</Table.TableHead>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableHeader>
								<Table.TableBody>
									{#each $locationTable.getRowModel().rows as row}
										<Table.TableRow class="bg-gray-50">
											{#each row.getVisibleCells() as cell}
												<Table.TableCell>
													<svelte:component
														this={flexRender(cell.column.columnDef.cell, cell.getContext())}
													/>
												</Table.TableCell>
											{/each}
										</Table.TableRow>
									{/each}
								</Table.TableBody>
							</Table.Root>
						</div>
					</TabItem>
					<TabItem title="Requisitions">
						<Calendar events={[]} />
					</TabItem>
					<TabItem title="Documents"></TabItem>
					<TabItem title="Support Tickets"></TabItem>
				</Tabs>
			</div>
		</div>
	</section>
{:else}
	<section
		class="grow h-screen overflow-y-auto p-6 flex flex-col items-center text-center sm:justify-center gap-4 md:gap-6"
	>
		<p>No Client Found</p>
		<Button type="button" on:click={() => window.history.back()}>Go Back</Button>
	</section>
{/if}
