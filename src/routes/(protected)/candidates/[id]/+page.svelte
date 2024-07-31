<script lang="ts">
	import { CANDIDATE_STATUS, USER_ROLES } from '$lib/config/constants';
	import type { CandidateWithProfile } from '$lib/server/database/queries/candidates';
	import type { PageData } from './$types';
	import * as Avatar from '$lib/components/ui/avatar';
	import convertNameToInitials from '$lib/_helpers/convertNameToInitials';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import Calendar from '$lib/components/calendar/calendar.svelte';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import { PencilIcon } from 'lucide-svelte';
	import { format } from 'date-fns';

	const statusStyles: Record<keyof typeof CANDIDATE_STATUS, string> = {
		INACTIVE: 'bg-gray-200 text-gray-800 border-gray-800',
		PENDING: 'bg-yellow-100 text-yellow-600 border-yellow-600',
		ACTIVE: 'bg-green-200 text-green-600 border-green-600'
	};

	export let data: PageData;
	let initials: string = '';

	$: birthdate = new Date(candidate?.profile.birthday as string);
	$: user = data.user;
	$: isAdmin = user?.role === USER_ROLES.SUPERADMIN;
	$: candidate = data.candidate as CandidateWithProfile | null;

	$: {
		if (candidate) {
			console.log(candidate);
			initials = convertNameToInitials(candidate.user.firstName, candidate.user.lastName);
		}
	}
</script>

{#if candidate}
	<section class="grow h-screen overflow-y-auto p-6 flex flex-col">
		<div class="flex flex-col gap-4 md:gap-6 w-full">
			<div class="flex gap-4 md:gap-8 flex-wrap">
				<Avatar.Root class="bg-gray-300 rounded-lg w-24 h-24 md:w-36 md:h-36">
					<Avatar.Fallback class="bg-transparent text-4xl md:text-6xl font-semibold"
						>{initials}</Avatar.Fallback
					>
					<Avatar.Image src={candidate.user.avatarUrl} />
				</Avatar.Root>
				<div class="flex flex-col gap-4">
					<h1 class="font-semibold text-4xl md:text-5xl flex items-center gap-2">
						{candidate.user.firstName}
						{candidate.user.lastName}
						{#if isAdmin}
							<button class="inline bg-gray-200 p-2 rounded-sm hover:bg-gray-300"
								><a href={`${candidate.profile.id}/edit`}><PencilIcon /></a></button
							>
						{/if}
					</h1>
					<div class="px-3 py-1 rounded-sm border text-sm border-gray-800 w-fit">
						{candidate.discipline.name}
					</div>
					{#if isAdmin}
						<div
							class={cn(
								candidate ? statusStyles['PENDING'] : '',
								'px-3 py-1 rounded-sm border text-sm w-fit'
							)}
						>
							{candidate.profile.status}
						</div>
					{/if}
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
											<p class="text-sm">{candidate.user.email}</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Address:</p>
											<p class="text-sm">{candidate.profile.address}</p>
											<p class="text-sm">{candidate.profile.city}, {candidate.profile.state}</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Contact Info:</p>
											<p class="text-sm">Cell Phone: {candidate.profile.cellPhone}</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Date of Birth:</p>
											<p class="text-sm">{format(birthdate, 'P')}</p>
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
												${candidate.profile.hourlyRateMin} - {candidate.profile.hourlyRateMax}
											</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Pay Frequency:</p>
											<p class="text-sm">Weekly</p>
										</div>
									</div>
									<div class="col-span-3 md:col-span-1">
										<p class="text-lg text-blue-600 font-semibold">Location</p>
										<div class="mt-4">
											<p class="text-sm font-semibold">Region:</p>
											<p class="text-sm">{candidate.region?.name}</p>
										</div>
										<div class="mt-4">
											<p class="text-sm font-semibold">Sub-region:</p>
											<p class="text-sm">{candidate.subRegion?.name || 'None Selected'}</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</TabItem>
					<TabItem title="Availability">
						<Calendar events={[]} />
					</TabItem>
					<TabItem title="Documents"></TabItem>
					<TabItem title="Work History"></TabItem>
					<TabItem title="Support Tickets"></TabItem>
				</Tabs>
			</div>
		</div>
	</section>
{:else}
	<section
		class="grow h-screen overflow-y-auto p-6 flex flex-col items-center text-center sm:justify-center gap-4 md:gap-6"
	>
		<p>No Candidate Found</p>
		<Button type="button" on:click={() => window.history.back()}>Go Back</Button>
	</section>
{/if}
