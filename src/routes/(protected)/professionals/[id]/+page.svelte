<script lang="ts">
	import { CANDIDATE_STATUS, USER_ROLES } from '$lib/config/constants';
	import type { CandidateWithProfile } from '$lib/server/database/queries/candidates';
	import type { PageData } from './$types';
	import * as Avatar from '$lib/components/ui/avatar';
	import convertNameToInitials from '$lib/_helpers/convertNameToInitials';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import Calendar from '$lib/components/calendar/calendar.svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { STATES } from '$lib/config/constants';
	import {
		Save,
		X,
		Edit,
		User,
		MapPin,
		Briefcase,
		Calendar as CalendarIcon,
		FileText,
		Clock,
		Phone,
		Mail,
		DollarSign,
		AlertCircle,
		Download,
		MoreHorizontal,
		Trash2
	} from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { format } from 'date-fns';
	import { CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Card } from 'flowbite-svelte';
	import { enhance } from '$app/forms';
	import { CandidateStatusSchema } from '$lib/config/zod-schemas';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

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
	$: supportTickets = data.supportTickets || [];
	$: workHistory = data.workHistory || [];
	$: documents = data.documents || [];
	$: disciplines = data.allDisciplines || [];

	// Edit state tracking
	let editingPersonal = false;
	let editingWork = false;
	let editingLocation = false;

	function cancelEdit(section: string) {
		switch (section) {
			case 'personal':
				editingPersonal = false;
				break;
			case 'work':
				editingWork = false;
				break;
			case 'location':
				editingLocation = false;
				break;
		}
	}

	$: {
		if (candidate) {
			initials = convertNameToInitials(candidate.user.firstName, candidate.user.lastName);
		}
	}

	const { form: statusForm, enhance: statusEnhance } = superForm(data.statusForm);
	function getFileIcon(filename: string) {
		const extension = filename?.split('.').pop()?.toLowerCase() || '';

		if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
			return 'image';
		} else if (['pdf'].includes(extension)) {
			return 'pdf';
		} else if (['doc', 'docx'].includes(extension)) {
			return 'word';
		} else {
			return 'generic';
		}
	}
</script>

{#if candidate}
	<section class="container mx-auto px-4 py-6">
		<div class="flex flex-col gap-6">
			<!-- Clean Header -->
			<div class="py-4">
				<div class="flex items-center justify-between">
					<div class="flex gap-4 items-center">
						<Avatar.Root class="bg-gray-300 rounded-lg w-16 h-16">
							<Avatar.Fallback class="bg-transparent text-xl font-semibold">
								{initials}
							</Avatar.Fallback>
							<Avatar.Image src={candidate.user.avatarUrl} />
						</Avatar.Root>
						<div>
							<h1 class="text-2xl font-bold">
								{candidate.user.firstName}
								{candidate.user.lastName}
							</h1>
							<p class="text-sm text-gray-500">Professional Member</p>
							<div class="flex items-center gap-2 mt-1">
								<span
									class={cn(statusStyles[candidate.profile.status], 'px-2 py-1 rounded text-xs')}
								>
									{candidate.profile.status === 'ACTIVE'
										? 'Approved'
										: candidate.profile.status === 'INACTIVE'
											? 'Disapproved'
											: 'Pending Review'}
								</span>
							</div>
						</div>
					</div>

					{#if isAdmin}
						<div class="flex items-center gap-3">
							<form
								use:enhance
								id="status-form"
								action="?/updateStatus"
								method="POST"
								class="flex items-center gap-2"
							>
								<Label class="text-sm text-gray-600">Status:</Label>
								<Select.Root
									preventScroll={false}
									selected={{ value: candidate.profile.status, label: candidate.profile.status }}
									onSelectedChange={(selected) => {
										if (selected) {
											const form = document.getElementById('status-form');
											const hiddenInput = form?.querySelector('input[name="status"]');
											hiddenInput.value = selected.value;

											form?.submit();
										}
									}}
								>
									<Select.Trigger class="h-8 w-32 bg-white">
										<Select.Value />
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="PENDING">Pending</Select.Item>
										<Select.Item value="ACTIVE">Approved</Select.Item>
										<Select.Item value="INACTIVE">Denied</Select.Item>
									</Select.Content>
									<Select.Input type="hidden" name="status" value={candidate.profile.status} />
								</Select.Root>
							</form>
						</div>
					{/if}
				</div>
			</div>

			<!-- Tabs section -->
			<Tabs class="w-full">
				<TabsList class="flex flex-col items-stretch md:flex-row w-full lg:w-fit h-fit">
					<TabsTrigger value="profile" class="gap-2 flex-1">
						<User class="h-4 w-4" />
						<span>Profile</span>
					</TabsTrigger>
					<!-- <TabsTrigger value="availability" class="gap-2 flex-1">
						<CalendarIcon class="h-4 w-4" />
						<span >Availability</span>
					</TabsTrigger> -->
					<TabsTrigger value="documents" class="gap-2 flex-1">
						<FileText class="h-4 w-4" />
						<span>Documents</span>
					</TabsTrigger>
					{#if isAdmin}
						<TabsTrigger value="work-history" class="gap-2 flex-1">
							<Clock class="h-4 w-4" />
							<span>Work History</span>
						</TabsTrigger>
					{/if}
					<TabsTrigger value="support" class="gap-2 flex-1">
						<Mail class="h-4 w-4" />
						<span>Support</span>
					</TabsTrigger>
				</TabsList>

				<!-- Profile Tab -->
				<TabsContent value="profile" class="mt-6">
					<div class="grid gap-6">
						<!-- Personal Details Card -->
						<Card class="w-full max-w-none">
							<CardHeader class="pb-3">
								<div class="flex items-center justify-between">
									<CardTitle class="text-blue-600 flex items-center gap-2 text-lg">
										<User class="h-4 w-4" />
										Personal Details
									</CardTitle>
									<!-- {#if !editingPersonal && isAdmin}
										<Button variant="ghost" size="sm" on:click={() => (editingPersonal = true)}>
											<Edit class="h-4 w-4" />
										</Button>
									{/if} -->
								</div>
							</CardHeader>
							<CardContent class="pt-0">
								{#if editingPersonal}
									<!-- Personal Edit Form -->
									<form method="POST" action="?/updatePersonalDetails" class="space-y-4">
										<div class="grid grid-cols-2 gap-4">
											<div class="space-y-2">
												<Label for="firstName">First Name</Label>
												<Input
													id="firstName"
													name="firstName"
													value={candidate.user.firstName}
													placeholder="Enter first name"
												/>
											</div>
											<div class="space-y-2">
												<Label for="lastName">Last Name</Label>
												<Input
													id="lastName"
													name="lastName"
													value={candidate.user.lastName}
													placeholder="Enter last name"
												/>
											</div>
										</div>

										<div class="space-y-2">
											<Label for="email">Email</Label>
											<Input
												id="email"
												name="email"
												type="email"
												value={candidate.user.email}
												placeholder="Enter email address"
											/>
										</div>

										<div class="space-y-2">
											<Label for="cellPhone">Cell Phone</Label>
											<Input
												id="cellPhone"
												name="cellPhone"
												value={candidate.profile.cellPhone}
												placeholder="Enter cell phone"
											/>
										</div>

										<div class="space-y-2">
											<Label for="address">Address</Label>
											<Input
												id="address"
												name="address"
												value={candidate.profile.address}
												placeholder="Enter street address"
											/>
										</div>

										<div class="grid grid-cols-2 gap-4">
											<div class="space-y-2">
												<Label for="city">City</Label>
												<Input
													id="city"
													name="city"
													value={candidate.profile.city}
													placeholder="Enter city"
												/>
											</div>
											<div class="space-y-2">
												<Label for="state">State</Label>
												<Select.Root preventScroll={false}>
													<Select.Trigger>
														<Select.Value placeholder={candidate.profile.state || 'Select state'} />
													</Select.Trigger>
													<Select.Content class="max-h-[150px] overflow-y-scroll">
														{#each STATES as state}
															<Select.Item value={state.abbreviation}>
																<span>{state.abbreviation}</span>
															</Select.Item>
														{/each}
													</Select.Content>
													<Input type="hidden" name="state" value={candidate.profile.state} />
												</Select.Root>
											</div>
										</div>

										<div class="space-y-2">
											<Label for="birthday">Date of Birth</Label>
											<Input
												id="birthday"
												name="birthday"
												type="date"
												value={candidate.profile.birthday}
											/>
										</div>

										<div class="flex gap-2 pt-4">
											<Button
												type="submit"
												size="sm"
												class="gap-2 bg-green-500 hover:bg-green-600 text-white"
											>
												<Save class="h-4 w-4" />
												Save Changes
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												on:click={() => cancelEdit('personal')}
												class="gap-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-500"
											>
												<X class="h-4 w-4" />
												Cancel
											</Button>
										</div>
									</form>
								{:else}
									<!-- Personal Details Display -->
									<div class="space-y-4">
										<div>
											<h3 class="text-sm font-medium text-muted-foreground">Contact Information</h3>
											<div class="mt-2 space-y-2">
												<div class="flex items-center gap-2">
													<Mail class="h-4 w-4 text-gray-500" />
													<a
														href={`mailto:${candidate.user.email}`}
														class="text-blue-600 hover:underline"
													>
														{candidate.user.email}
													</a>
												</div>
												<div class="flex items-center gap-2">
													<Phone class="h-4 w-4 text-gray-500" />
													<a
														href={`tel:${candidate.profile.cellPhone}`}
														class="text-blue-600 hover:underline"
													>
														{candidate.profile.cellPhone}
													</a>
												</div>
											</div>
										</div>

										{#if isAdmin}
											<div>
												<h3 class="text-sm font-medium text-muted-foreground">Address</h3>
												<address class="mt-1 not-italic">
													{candidate.profile.address}<br />
													{candidate.profile.city}, {candidate.profile.state}
												</address>
											</div>
										{/if}

										<div>
											<h3 class="text-sm font-medium text-muted-foreground">Date of Birth</h3>
											<p class="mt-1">{format(birthdate, 'P')}</p>
										</div>
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Work Preferences Card -->
						<Card class="w-full max-w-none">
							<CardHeader class="pb-3">
								<div class="flex items-center justify-between">
									<CardTitle class="text-blue-600 flex items-center gap-2 text-lg">
										<Briefcase class="h-4 w-4" />
										Work Details & Preferences
									</CardTitle>
									<!-- {#if !editingWork && isAdmin}
										<Button variant="ghost" size="sm" on:click={() => (editingWork = true)}>
											<Edit class="h-4 w-4" />
										</Button>
									{/if} -->
								</div>
							</CardHeader>
							<CardContent class="pt-0">
								{#if editingWork}
									<!-- Work Preferences Edit Form -->
									<form method="POST" action="?/updateWorkPreferences" class="space-y-4">
										<!-- <div class="space-y-2">
											<Label for="preferredPositions">Preferred Positions</Label>
											<Input
												id="preferredPositions"
												name="preferredPositions"
												value="Consultant, Dental Assistant, Dentist, Floater, Front Office, Hygienist"
												placeholder="Enter preferred positions"
											/>
										</div> -->

										<div class="grid grid-cols-2 gap-4">
											<div class="space-y-2">
												<Label for="hourlyRateMin">Min Hourly Rate</Label>
												<Input
													id="hourlyRateMin"
													name="hourlyRateMin"
													type="number"
													value={candidate.profile.hourlyRateMin}
													placeholder="0"
												/>
											</div>
											<div class="space-y-2">
												<Label for="hourlyRateMax">Max Hourly Rate</Label>
												<Input
													id="hourlyRateMax"
													name="hourlyRateMax"
													type="number"
													value={candidate.profile.hourlyRateMax}
													placeholder="0"
												/>
											</div>
										</div>

										<div class="flex gap-2 pt-4">
											<Button
												type="submit"
												size="sm"
												class="gap-2 bg-green-500 hover:bg-green-600 text-white"
											>
												<Save class="h-4 w-4" />
												Save Changes
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												on:click={() => cancelEdit('work')}
												class="gap-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-500"
											>
												<X class="h-4 w-4" />
												Cancel
											</Button>
										</div>
									</form>
								{:else}
									<!-- Work Preferences Display -->
									<div class="space-y-4">
										<div>
											<h3 class="text-sm font-medium text-muted-foreground">Experience</h3>
											<div class="flex flex-col gap-2 mt-2">
												{#each disciplines as discipline}
													<spa
														class="grow-0 w-fit bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded"
													>
														{discipline.discipline.name} - {discipline.experience.experienceLevel}
													</spa>
												{/each}
											</div>
										</div>

										<div>
											<h3 class="text-sm font-medium text-muted-foreground">Rate of Pay</h3>
											<div class="mt-1 flex items-center gap-2">
												<DollarSign class="h-4 w-4 text-gray-500" />
												<span class="text-sm font-medium">
													${candidate.profile.hourlyRateMin || 'Not Specified'} - ${candidate
														.profile.hourlyRateMax || 'Not Specified'} /hr
												</span>
											</div>
										</div>
									</div>
								{/if}
							</CardContent>
						</Card>

						<!-- Location Preferences Card -->
						<Card class="w-full max-w-none">
							<CardHeader class="pb-3">
								<div class="flex items-center justify-between">
									<CardTitle class="text-blue-600 flex items-center gap-2 text-lg">
										<MapPin class="h-4 w-4" />
										Location Preferences
									</CardTitle>
									<!-- {#if !editingLocation && isAdmin}
										<Button variant="ghost" size="sm" on:click={() => (editingLocation = true)}>
											<Edit class="h-4 w-4" />
										</Button>
									{/if} -->
								</div>
							</CardHeader>
							<CardContent class="pt-0">
								{#if editingLocation}
									<!-- Location Preferences Edit Form -->
									<form method="POST" action="?/updateLocationPreferences" class="space-y-4">
										<div class="space-y-2">
											<Label for="region">Region</Label>
											<Select.Root preventScroll={false}>
												<Select.Trigger>
													<Select.Value placeholder={candidate.region?.name || 'Select region'} />
												</Select.Trigger>
												<Select.Content>
													<!-- Add your regions here -->
													<Select.Item value="region1">Region 1</Select.Item>
													<Select.Item value="region2">Region 2</Select.Item>
												</Select.Content>
												<Input type="hidden" name="regionId" value={candidate.region?.id} />
											</Select.Root>
										</div>

										<div class="space-y-2">
											<Label for="subRegion">Sub-region</Label>
											<Select.Root preventScroll={false}>
												<Select.Trigger>
													<Select.Value
														placeholder={candidate.subRegion?.name || 'Select sub-region'}
													/>
												</Select.Trigger>
												<Select.Content>
													<!-- Add your sub-regions here -->
													<Select.Item value="subregion1">Sub-region 1</Select.Item>
													<Select.Item value="subregion2">Sub-region 2</Select.Item>
												</Select.Content>
												<Input type="hidden" name="subRegionId" value={candidate.subRegion?.id} />
											</Select.Root>
										</div>

										<div class="flex gap-2 pt-4">
											<Button
												type="submit"
												size="sm"
												class="gap-2 bg-green-500 hover:bg-green-600 text-white"
											>
												<Save class="h-4 w-4" />
												Save Changes
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												on:click={() => cancelEdit('location')}
												class="gap-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-500"
											>
												<X class="h-4 w-4" />
												Cancel
											</Button>
										</div>
									</form>
								{:else}
									<!-- Location Preferences Display -->
									<div class="space-y-4">
										<div>
											<h3 class="text-sm font-medium text-muted-foreground">Region</h3>
											<p class="mt-1">{candidate.region?.name || 'Not specified'}</p>
										</div>

										<div>
											<h3 class="text-sm font-medium text-muted-foreground">Sub-region</h3>
											<p class="mt-1">{candidate.subRegion?.name || 'None Selected'}</p>
										</div>
									</div>
								{/if}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<!-- Availability Tab -->
				<!-- <TabsContent value="availability" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="pb-3">
							<CardTitle class="text-blue-600 flex items-center gap-2 text-lg">
								<CalendarIcon class="h-4 w-4" />
								Availability Schedule
							</CardTitle>
						</CardHeader>
						<CardContent class="pt-0">
							<Calendar events={[]} />
						</CardContent>
					</Card>
				</TabsContent> -->

				<!-- Documents Tab -->
				<TabsContent value="documents" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="pb-3">
							<CardTitle class="text-blue-600 flex items-center gap-2 text-lg">
								<FileText class="h-4 w-4" />
								Documents
							</CardTitle>
						</CardHeader>
						<CardContent class="pt-0">
							{#if documents.length > 0}
								{#each documents as doc}
									<tr class="border-b hover:bg-gray-50">
										<td class="py-3 px-4">
											<div class="flex items-center gap-2">
												{#if getFileIcon(doc?.filename) === 'image'}
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5 text-blue-600"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
														<circle cx="8.5" cy="8.5" r="1.5" />
														<polyline points="21 15 16 10 5 21" />
													</svg>
												{:else if getFileIcon(doc?.filename) === 'pdf'}
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5 text-red-600"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
														<polyline points="14 2 14 8 20 8" />
														<path d="M9 15v-2" />
														<path d="M12 15v-4" />
														<path d="M15 15v-6" />
													</svg>
												{:else}
													<FileText class="h-5 w-5 text-blue-600" />
												{/if}
												<span class="font-medium">{doc?.filename}</span>
											</div>
										</td>
										<td class="py-3 px-4 text-sm">{format(doc.createdAt, 'PP')}</td>
										<td class="py-3 px-4 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger>
													<Button variant="ghost" size="icon">
														<MoreHorizontal class="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem>
														<a
															class="flex"
															href={doc.uploadUrl}
															target="_blank"
															rel="noopener noreferrer"
															><Download class="h-4 w-4 mr-2" />
															<span>Download</span></a
														>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</td>
									</tr>
								{/each}
							{:else}
								<div class="text-center py-8">
									<FileText class="h-12 w-12 mx-auto text-gray-300" />
									<h3 class="mt-4 text-lg font-medium">No Documents</h3>
									<p class="mt-2 text-sm text-gray-500">No documents have been uploaded yet.</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Work History Tab -->
				<TabsContent value="work-history" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="pb-3">
							<CardTitle class="text-blue-600 flex items-center gap-2 text-lg">
								<Clock class="h-4 w-4" />
								Work History
							</CardTitle>
						</CardHeader>
						<CardContent class="pt-0">
							{#if workHistory.length > 0}
								<div class="overflow-x-auto">
									<table class="w-full border-collapse">
										<thead>
											<tr class="border-b">
												<th class="text-left py-3 px-4 font-medium">Date</th>
												<th class="text-left py-3 px-4 font-medium">Position</th>
												<th class="text-left py-3 px-4 font-medium">Client</th>
												<th class="text-left py-3 px-4 font-medium">Hours</th>
												<th class="text-left py-3 px-4 font-medium">Timesheet</th>
												<!-- <th class="text-right py-3 px-4 font-medium">Actions</th> -->
											</tr>
										</thead>
										<tbody>
											{#each workHistory as shift}
												<!-- {@const statusBadge = getStatusBadge(shift.status)} -->

												<tr class="border-b hover:bg-gray-50">
													<td class="py-4 px-4">
														<div class="text-xs">
															{format(shift.recurrenceDay.dayStart, 'PP')}
														</div>
														<!-- <div class="text-xs text-muted-foreground">
															{format(shift.recurrenceDay.dayStart, 'hh:mm a')} -{' '}
															{format(shift.recurrenceDay.dayEnd, 'hh:mm a')}
														</div> -->
													</td>

													<td class="py-4 px-4">{shift.requisition.title}</td>

													<td class="py-4 px-4">
														<div>{shift.requisition.companyName}</div>
														<div class="text-xs text-muted-foreground truncate max-w-[200px]">
															{shift.location.address1}
															{shift.location.address2 || ''}
															{shift.location.city}, {shift.location.state}
															{shift.location.zip}
														</div>
													</td>

													<td class="py-4 px-4">{shift.timesheet?.totalHoursWorked}</td>
													<td class="py-4 px-4">
														{#if shift.timesheet}
															<Button
																variant="outline"
																href={`/timesheets/${shift.timesheet?.id}`}
																size="sm">View Timesheet</Button
															>
														{:else}
															<Button variant="outline" href="/timesheets/new" size="sm"
																>Create Timesheet</Button
															>
														{/if}
													</td>
													<!-- <td class="py-4 px-4 text-right">
														<Button
															variant="outline"
															size="sm"
															href={`/my-shifts/${shift.workday.id}`}
														>
															View Details
														</Button>
													</td> -->
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{:else}
								<div class="text-center py-8">
									<Clock class="h-12 w-12 mx-auto text-gray-300" />
									<h3 class="mt-4 text-lg font-medium">No Work History</h3>
									<p class="mt-2 text-sm text-gray-500">No work history records found.</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Support Tickets Tab -->
				<TabsContent value="support" class="mt-6">
					<Card class="w-full max-w-none">
						<CardHeader class="pb-3">
							<CardTitle class="text-blue-600 flex items-center gap-2 text-lg">
								<Mail class="h-4 w-4" />
								Support Tickets
							</CardTitle>
						</CardHeader>
						<CardContent class="pt-0">
							<div class="text-center py-8">
								<Mail class="h-12 w-12 mx-auto text-gray-300" />
								<h3 class="mt-4 text-lg font-medium">No Support Tickets</h3>
								<p class="mt-2 text-sm text-gray-500">No support tickets have been created.</p>
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
			<h2 class="text-2xl font-bold mb-2">No Professional Member Found</h2>
			<p class="text-gray-500 mb-6">
				The requested professional member could not be found in our system.
			</p>
			<Button type="button" on:click={() => window.history.back()}>Go Back</Button>
		</div>
	</section>
{/if}
