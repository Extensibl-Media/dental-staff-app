<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { ClientRequisitionSchema } from '$lib/config/zod-schemas';
	import { onMount, onDestroy } from 'svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	export let form: SuperValidated<ClientRequisitionSchema>;
	export let drawerExpanded: boolean;

	const { form: formObj, enhance, submitting, reset, isTainted } = superForm(form, {
		clearOnSubmit: 'errors-and-message',
		resetForm: true,
	});

	let locations: any[] = [];
	let disciplines: any[] = [];
	let experienceLevels: any[] = [];

	const handleGetLocations = async () => {
		const req = await fetch(`/api/locations/getCompanyLocations`, {
			method: 'GET'
		});
		const locationsRes = await req.json();
		locations = locationsRes;
	};

	const handleFetchDisciplines = async () => {
		if (!disciplines.length) {
			const req = await fetch('/api/disciplines/fetchAllDisciplines', { method: 'GET' });
			const disciplinesRes = await req.json();
			disciplines = disciplinesRes;
		}
	};

	const handleFetchExperienceLevels = async () => {
		if (!experienceLevels.length) {
			const req = await fetch('/api/experience/fetchAllExperienceLevels', { method: 'GET' });
			const experienceRes = await req.json();
			experienceLevels = experienceRes;
		}
	};

	onMount(async () => {
		await handleGetLocations();
		await handleFetchExperienceLevels();
		await handleFetchDisciplines();

		window.addEventListener('beforeunload', handleBeforeUnload);
	});

	onDestroy(() => {
		window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	function handleReset() {
		reset();
	}

	function handleDrawerClose() {
		handleReset();
		drawerExpanded = false;
	}

	function handleBeforeUnload(event: BeforeUnloadEvent) {
		if (isTainted()) {
			event.preventDefault();
			event.returnValue = '';
		}
	}

	$: if (!drawerExpanded) {
		handleReset();
	}
</script>

<form use:enhance method="POST" action="/requisitions?/client" class="grow flex flex-col h-full max-h-[calc(100vh_-_70px)]">
	<div class="grow p-4 overflow-y-auto">
		<div class="mb-4">
			<Label for="title">Title</Label>
			<Input type="text" id="title" name="title" bind:value={$formObj.title} />
		</div>

		<div class="mb-4">
			<Label for="locationId">Location</Label>
			<select id="locationId" name="locationId" bind:value={$formObj.locationId} class="w-full p-2 border rounded" required>
				<option value="">Select Location</option>
				{#each locations as location}
					<option value={location.id}>{location.name}</option>
				{/each}
			</select>
		</div>

		<div class="mb-4">
			<Label for="disciplineId">Discipline</Label>
			<select id="disciplineId" name="disciplineId" bind:value={$formObj.disciplineId} class="w-full p-2 border rounded" required>
				<option value="">Select Discipline</option>
				{#each disciplines as discipline}
					<option value={discipline.id}>{discipline.name}</option>
				{/each}
			</select>
		</div>

		<div class="mb-4">
			<Label for="experienceLevelId">Experience Level</Label>
			<select id="experienceLevelId" name="experienceLevelId" bind:value={$formObj.experienceLevelId} class="w-full p-2 border rounded" required>
				<option value="">Select Experience</option>
				{#each experienceLevels as level}
					<option value={level.id}>{level.value}</option>
				{/each}
			</select>
		</div>

		<div class="mb-4">
			<Label for="hourlyRate">Hourly Rate</Label>
			<Input type="number" id="hourlyRate" name="hourlyRate" bind:value={$formObj.hourlyRate} />
		</div>

		<div class="mb-4">
			<Label for="permanentPosition">Requisition Type</Label>
			<select id="permanentPosition" name="permanentPosition" bind:value={$formObj.permanentPosition} class="w-full p-2 border rounded" required>
				<option value={false}>Temporary</option>
				<option value={true}>Permanent</option>
			</select>
		</div>

		<div class="mb-4">
			<Label for="jobDescription">Job Description</Label>
			<textarea id="jobDescription" name="jobDescription" bind:value={$formObj.jobDescription} class="w-full p-2 border rounded" rows="4" required></textarea>
		</div>

		<div class="mb-4">
			<Label for="specialInstructions">Special Instructions</Label>
			<textarea id="specialInstructions" name="specialInstructions" bind:value={$formObj.specialInstructions} class="w-full p-2 border rounded" rows="4"></textarea>
		</div>
	</div>

	<div class="flex justify-end gap-4 p-4 border-t border-t-gray-200">
		<Button
			tabindex={drawerExpanded ? 0 : -1}
			type="button"
			on:click={handleDrawerClose}
			class="bg-white hover:bg-red-500 hover:text-white border border-red-500 text-red-500 rounded-md"
		>
			Cancel
		</Button>
		<Button
			tabindex={drawerExpanded ? 0 : -1}
			type="submit"
			disabled={$submitting}
			class="px-4 py-2 border border-green-400 bg-green-400 hover:bg-green-400 text-white rounded-md"
		>
			{$submitting ? 'Submitting...' : 'Create Requisition'}
		</Button>
	</div>
</form>
