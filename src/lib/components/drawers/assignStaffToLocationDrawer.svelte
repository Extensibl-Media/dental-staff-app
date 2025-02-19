<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select } from 'flowbite-svelte';
	import { Checkbox } from '../ui/checkbox';
	import { superForm } from 'sveltekit-superforms/client';
	export let allStaff;
	export let location;
	export let company;
	export let assignForm;

	const form = superForm(assignForm);

	const { enhance, form: formData } = form;

	$: console.log(allStaff);
</script>

<Sheet.Root>
	<Sheet.Trigger asChild let:builder>
		<Button builders={[builder]} class="bg-blue-800 hover:bg-blue-900 mb-4">
			Add Staff Member
		</Button>
	</Sheet.Trigger>
	<Sheet.Content side="right">
		<form method="POST" action="?/assignStaff" use:enhance>
			<Sheet.Header>
				<Sheet.Title>Add Staff</Sheet.Title>
				<Sheet.Description>Add an existing staff member to this location.</Sheet.Description>
			</Sheet.Header>
			<div class="grid gap-4 py-4">
				<div class="space-y-2">
					<Label for="name" class="text-right">Name</Label>
					<Select>
						{#each allStaff as staff}
							<option>{staff.user.firstName} {staff.user.lastName}</option>
						{/each}
					</Select>
					<div class="flex gap-4"><Checkbox /><span>Primary Location</span></div>
					<input type="hidden" value={company.id} name="companyId" />
					<input type="hidden" value={location.id} name="locationId" />
				</div>
			</div>
			<Sheet.Footer>
				<Sheet.Close asChild let:builder>
					<Button class="bg-blue-800 hover:bg-blue-900 mb-4" builders={[builder]} type="submit"
						>Add Staff Member</Button
					>
				</Sheet.Close>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
