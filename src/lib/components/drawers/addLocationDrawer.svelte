<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Checkbox } from '../ui/checkbox';
	import { superForm } from 'sveltekit-superforms/client';
	import { Loader2, PlusIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { ClientCompany } from '$lib/server/database/schemas/client';
	import * as Form from '../ui/form';
	import { clientCompanyLocationSchema } from '$lib/config/zod-schemas';
	import { STATES } from '$lib/config/constants';

	export let newLocationForm;
	export let open: boolean;
	export let company: ClientCompany | undefined;

	let selectedState = '';
	let selectedTimezone = '';

	const form = superForm(newLocationForm);

	const { enhance, form: formData, submitting, errors } = form;

	$: console.log('formData', $formData);
	onMount(() => {});
</script>

<Sheet.Root {open} on:openChange={(e) => (open = !open)}>
	<Sheet.Trigger asChild>
		<Button on:click={() => (open = true)} class="bg-blue-800 hover:bg-blue-900 mb-4"
			><PlusIcon size={20} class="mr-2" />New Location</Button
		>
	</Sheet.Trigger>
	<Sheet.Content side="right" class="overflow-scroll">
		<form method="POST" action="?/createLocation" use:enhance class="h-full flex flex-col">
			<Sheet.Header>
				<Sheet.Title>Add New Location</Sheet.Title>
				<Sheet.Description>Add details for a location for your business.</Sheet.Description>
			</Sheet.Header>
			<div class="grid gap-4 py-4">
				<div class="space-y-2">
					<div>
						<Label>Location Name</Label>
						<Input name="name" bind:value={$formData.name} />
					</div>
					<div>
						<Label>Address</Label>
						<Input name="streetOne" bind:value={$formData.streetOne} />
					</div>
					<div>
						<Label>Address Line 2</Label>
						<Input name="streetTwo" bind:value={$formData.streetTwo} />
					</div>
					<div>
						<Label>City</Label>
						<Input name="city" bind:value={$formData.city} />
					</div>
					<div>
						<Label>State</Label>
						<Select.Root
							preventScroll={false}
							selected={selectedState}
							onSelectedChange={(v) => {
								v && ($formData.state = String(v.value));
							}}
						>
							<Select.Trigger>
								<Select.Value />
							</Select.Trigger>
							<Select.Content class="max-h-[150px] overflow-y-scroll">
								{#each STATES as state}
									<Select.Item value={state.abbreviation}>
										<span>{state.name}</span>
									</Select.Item>
								{/each}
							</Select.Content>
							<Input type="hidden" value={$formData.state} name="state" />
						</Select.Root>
					</div>
					<div>
						<Label>Zipcode</Label>
						<Input
							bind:value={$formData.zipcode}
							type="number"
							maxlength={5}
							on:input={(event) => {
								if (event.currentTarget.value.length > 5) {
									event.currentTarget.value = event.currentTarget.value.slice(0, 5);
								}
							}}
						/>
					</div>
					<div>
						<Label>Timezone</Label>
						<Select.Root
							preventScroll={false}
							selected={selectedTimezone}
							onSelectedChange={(v) => {
								v && ($formData.timezone = String(v.value));
							}}
						>
							<Select.Trigger>
								<Select.Value />
							</Select.Trigger>
							<Select.Content class="max-h-[150px] overflow-y-scroll">
								{#each Intl.supportedValuesOf('timeZone') as timezone}
									<Select.Item value={timezone}>
										<span>{timezone}</span>
									</Select.Item>
								{/each}
							</Select.Content>
							<Input name="timezone" type="hidden" value={$formData.timezone} />
						</Select.Root>
					</div>
					<div>
						<Label>Office Phone Number</Label>
						<Input name="companyPhone" bind:value={$formData.companyPhone} />
					</div>
					<div>
						<Label>Office Email Address</Label>
						<Input name="email" type="email" bind:value={$formData.email} />
					</div>
				</div>
				<input type="hidden" name="companyId" value={company?.id} />
			</div>
			<Sheet.Footer class="mt-auto">
				<Sheet.Close asChild>
					<Button
						on:click={() => (open = false)}
						class="bg-red-500 hover:bg-red-600 mb-4"
						type="button">Cancel</Button
					></Sheet.Close
				>
				<Sheet.Close asChild>
					<Button
						on:click={() => (open = false)}
						class="bg-green-500 hover:bg-green-600 mb-4"
						type="submit"
					>
						{#if $submitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" /> Please wait...
						{:else}Add Location
						{/if}
					</Button>
				</Sheet.Close>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
