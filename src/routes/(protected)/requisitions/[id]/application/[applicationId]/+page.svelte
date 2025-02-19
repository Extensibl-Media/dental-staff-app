<script lang="ts">
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import {
		Card,
		CardTitle,
		CardHeader,
		CardContent,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { CalendarDays, DollarSign, Clock, MapPin, Phone, Mail, Check } from 'lucide-svelte';
	import type { PageData } from './$types';
	import convertNameToInitials from '$lib/_helpers/convertNameToInitials';
	import { format } from 'date-fns';
	import { superForm } from 'sveltekit-superforms/client';

	export let data: PageData;
	$: application = data.application;

	$: console.log({ application });

	const { enhance, formId, submitting } = superForm(data.form);
</script>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
		Application Details
	</h1>
	<div class="">
		<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
			<div class="flex items-center gap-4">
				<Avatar class="w-16 h-16">
					<AvatarImage src={application.user.avatarUrl} alt="Candidate" />
					<AvatarFallback
						>{convertNameToInitials(
							application.user.firstName,
							application.user.lastName
						)}</AvatarFallback
					>
				</Avatar>
				<div>
					<h1 class="text-2xl font-bold">
						{application.user.firstName}
						{application.user.lastName}
					</h1>
				</div>
			</div>
			<div class="flex gap-2">
				<form method="POST" use:enhance class="flex items-center gap-2 flex-wrap">
					<Button
						disabled={application.application.status === 'APPROVED'}
						type="submit"
						name="id"
						on:click={() => ($formId = application.application.id)}
						formaction="?/approveApplication"
						value={application.application.id}
						class="bg-green-500 hover:bg-green-600"
					>
						{#if application.application.status !== 'APPROVED'}
							<Check />
							Application Approved
						{:else if $submitting}
							Please Wait...
						{:else}
							Approve Application
						{/if}
					</Button>
					<Button
						type="submit"
						name="id"
						on:click={() => ($formId = application.application.id)}
						formaction="?/startConversation"
						value={application.application.id}
						variant="outline">Send Message</Button
					>
				</form>
			</div>
		</div>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card class="col-span-2">
			<CardHeader>
				<CardTitle>Candidate Overview</CardTitle>
				<CardDescription>Personal details and application information</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-2">
						<div class="space-y-2 col-span-2 md:col-span-1">
							<div class="flex items-center gap-2">
								<Phone class="h-4 w-4 text-muted-foreground" />
								<span>{application.candidateProfile.cellPhone}</span>
							</div>
							<div class="flex items-center gap-2">
								<Mail class="h-4 w-4 text-muted-foreground" />
								<span>{application.user.email}</span>
							</div>
							<div class="flex items-center gap-2">
								<MapPin class="h-4 w-4 text-muted-foreground" />
								<span
									>{application.candidateProfile.city}, {application.candidateProfile.state}</span
								>
							</div>
						</div>
						<div class="space-y-2 col-span-2 md:col-span-1">
							<div class="flex items-center gap-2">
								<DollarSign class="h-4 w-4 text-muted-foreground" />
								<span>Desired Pay: ${application.candidateProfile.hourlyRateMin}/hour</span>
							</div>
							<div class="flex items-center gap-2">
								<CalendarDays class="h-4 w-4 text-muted-foreground" />
								<span>Available from: June 1, 2023</span>
							</div>
							<div class="flex items-center gap-2">
								<Clock class="h-4 w-4 text-muted-foreground" />
								<span>Preferred: Full-time</span>
							</div>
						</div>
					</div>
					<Separator />
					<div>
						<h3 class="font-semibold mb-2">Application Timeline</h3>
						<div class="space-y-2">
							<div class="flex justify-between items-center">
								<span class="text-sm">Initial Application</span>
								<span class="text-sm text-muted-foreground"
									>{format(application.application.createdAt, 'PP')}</span
								>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</section>
