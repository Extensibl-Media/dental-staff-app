<script lang="ts">
	import { CLIENT_STAFF_ROLES } from '$lib/config/constants';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { Input } from '$lib/components/ui/input';
	import { Select } from 'flowbite-svelte';

	import { Loader2, AlertCircle } from 'lucide-svelte';

	type StaffInvite = {
		email: string;
		staffRole: keyof typeof CLIENT_STAFF_ROLES;
	};

	const StaffRoleMap = [
		{
			name: 'Admin',
			value: CLIENT_STAFF_ROLES.CLIENT_ADMIN
		},
		{
			name: 'Manager',
			value: CLIENT_STAFF_ROLES.CLIENT_MANAGER
		},
		{
			name: 'Employee',
			value: CLIENT_STAFF_ROLES.CLIENT_EMPLOYEE
		}
	];

	let inviteEmail = '';
	let inviteRole: typeof CLIENT_STAFF_ROLES | '' = '';
	let staffInvites: StaffInvite[] = [];
	let submitting = false;

	$: console.log({ inviteEmail, inviteRole });

	$: console.log({ staffInvites });

	const handleAddInvite = (email: string) => {
		const emailExpression = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
		const includes = staffInvites.find((invite) => invite.email === email);
		const isEmail = emailExpression.test(email);

		if (!includes && isEmail) {
			staffInvites = [{ email, staffRole: CLIENT_STAFF_ROLES.CLIENT_EMPLOYEE }, ...staffInvites];
			inviteEmail = '';
			inviteRole = '';
		}
	};

	const handleRemoveInvite = (email: string) => {
		staffInvites = staffInvites.filter((invite) => invite.email !== email);
	};

	const handleSelectRole = (email: string, role: string) => {
		const inviteeIndex = staffInvites.findIndex((invitee) => invitee.email === email);
		console.log(inviteeIndex);

		if (inviteeIndex !== -1) {
			staffInvites[inviteeIndex] = {
				...staffInvites[inviteeIndex],
				staffRole: role as keyof typeof CLIENT_STAFF_ROLES
			};
		}
	};
</script>

<section class="flex flex-col items-center justify-center min-h-screen">
	<div class="p-6 flex gap-2 w-full max-w-5xl mx-auto">
		<Card.Root class="w-full">
			<Card.Header>
				<Card.Title class="text-2xl">Invite Staff</Card.Title>
				<Card.Description
					>Add your staff emails to send them invites to sign up with their own accounts.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-6 gap-4">
					<Input name="email" bind:value={inviteEmail} class="col-span-6 md:col-span-5" />
					<Button
						class="col-span-6 md:col-span-1"
						type="button"
						on:click={() => handleAddInvite(inviteEmail)}>Add</Button
					>
				</div>
				<div class="mt-8 flex flex-col divide-y">
					{#each staffInvites as invitee}
						<div class="flex justify-between gap-4 py-4">
							<p>{invitee.email}</p>
							<div class="flex gap-2 items-center">
								<Select
									placeholder="Employee"
									on:change={(e) => handleSelectRole(invitee.email, e.target?.value)}
								>
									{#each StaffRoleMap as role}
										<option label={role.name} value={role.value}>{role.name}</option>
									{/each}
								</Select>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
			<Card.Footer>
				<Button class="ml-auto" disabled={submitting}
					>{#if submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}Next{/if}
				</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</section>
