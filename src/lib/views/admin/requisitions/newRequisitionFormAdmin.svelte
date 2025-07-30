<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	import * as Form from '$lib/components/ui/form';
	import { Button } from '$lib/components/ui/button';

	import type { SuperValidated } from 'sveltekit-superforms';
	import type { AdminRequisitionSchema } from '$lib/config/zod-schemas';
	import { superForm } from 'sveltekit-superforms/client';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { onDestroy } from 'svelte';

	export let form: SuperValidated<AdminRequisitionSchema>;
	export let schema: AdminRequisitionSchema;
	export let drawerExpanded: boolean;

	let clients: any[] = [];
	let locations: any[] = [];
	let disciplines: any[] = [];
	let experienceLevels: any[] = [];
	let selectedLocation = null;
	let timezone = '';

	const {
		form: formObj,
		enhance,
		submitting,
		reset,
		isTainted
	} = superForm(form, {
		clearOnSubmit: 'errors-and-message',
		resetForm: true
	});

	const handleFetchClients = async () => {
		if (!clients.length) {
			const req = await fetch('api/admin/fetchAllClients', { method: 'GET' });
			const clientsRes = await req.json();

			clients = clientsRes;
		}
	};

	const handleGetLocations = async (companyId: string) => {
		if (!companyId?.length) return;
		const req = await fetch(`/api/admin/fetchCompanyLocations?companyId=${companyId}`, {
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

	$: {
		console.log({ selectedLocation, timezone });
	}

	// $: if ($formObj.locationId) {
	// 	const selectedLocation = locations.find((location) => location.id === $formObj.locationId);
	// 	if (selectedLocation) {
	// 		$formObj.timezone = selectedLocation.timezone;
	// 	}
	// }
</script>

<Form.Root
	{form}
	{schema}
	class="grow flex flex-col h-full max-h-[calc(100vh_-_70px)]"
	let:submitting
	let:errors
	method="POST"
	action="/requisitions?/admin"
	let:config
>
	<div class="grow p-4 overflow-y-auto">
		<Form.Field {config} name="title">
			<Form.Item>
				<Form.Label>Title</Form.Label>
				<Form.Input tabindex={drawerExpanded ? 0 : -1} />
				<Form.Validation />
			</Form.Item>
		</Form.Field>

		<Form.Field {config} name="clientId">
			<Form.Item>
				<Form.Label>Associated Client</Form.Label>
				<Form.Select
					onOpenChange={handleFetchClients}
					onSelectedChange={(el) => handleGetLocations(String(el?.value))}
				>
					<Form.SelectTrigger tabindex={drawerExpanded ? 0 : -1} placeholder="Select Client"
					></Form.SelectTrigger>
					<Form.SelectContent class=" max-h-[170px] md:max-h-[300px] h-full overflow-y-auto">
						{#await handleFetchClients}
							<Form.SelectItem value={null} label={'Loading...'}>
								<span>Loading</span>
							</Form.SelectItem>
						{:then value}
							{#each clients as client}
								<Form.SelectItem
									value={client.company.id}
									label={`${client.user.lastName}, ${client.user.firstName}`}
									><span class="flex flex-col gap-1">
										<span>{client.user.lastName}, {client.user.firstName}</span>
										<span class="text-xs text-gray-400">{client.company.companyName}</span>
									</span></Form.SelectItem
								>
							{/each}
						{:catch error}
							<!-- promise was rejected -->
							<p>Something went wrong: {error.message}</p>
						{/await}
					</Form.SelectContent>
				</Form.Select>
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="locationId">
			<Form.Item>
				<Form.Label>Location</Form.Label>
				<Form.Select
					onSelectedChange={(el) => {
						selectedLocation = locations.find((location) => location.id === el?.value);
						if (selectedLocation) {
							timezone = selectedLocation.timezone;
						}
					}}
				>
					<Form.SelectTrigger tabindex={drawerExpanded ? 0 : -1} placeholder="Select Location"
					></Form.SelectTrigger>
					<Form.SelectContent class=" max-h-[170px] md:max-h-[300px] h-full overflow-y-auto">
						{#await handleGetLocations}
							<Form.SelectItem value={null} label={'Loading...'}>
								<span>Loading</span>
							</Form.SelectItem>
						{:then _}
							{#each locations as location}
								<Form.SelectItem value={location.id} label={location.name}
									>{location.name}</Form.SelectItem
								>
							{/each}
						{:catch error}
							<!-- promise was rejected -->
							<p>Something went wrong: {error.message}</p>
						{/await}
					</Form.SelectContent>
				</Form.Select>
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="disciplineId">
			<Form.Item>
				<Form.Label>Discipline</Form.Label>
				<Form.Select onOpenChange={handleFetchDisciplines}>
					<Form.SelectTrigger tabindex={drawerExpanded ? 0 : -1} placeholder="Select Discipline"
					></Form.SelectTrigger>
					<Form.SelectContent class=" max-h-[170px] md:max-h-[300px] h-full overflow-y-auto">
						{#await handleFetchDisciplines}
							<Form.SelectItem value={null} label={'Loading...'}>
								<span>Loading</span>
							</Form.SelectItem>
						{:then value}
							{#each disciplines as discipline}
								<Form.SelectItem value={discipline.id} label={discipline.name}
									>{discipline.name}</Form.SelectItem
								>
							{/each}
						{:catch error}
							<!-- promise was rejected -->
							<p>Something went wrong: {error.message}</p>
						{/await}
					</Form.SelectContent>
				</Form.Select>
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="experienceLevelId">
			<Form.Item>
				<Form.Label>Experience Level</Form.Label>
				<Form.Select onOpenChange={handleFetchExperienceLevels}>
					<Form.SelectTrigger tabindex={drawerExpanded ? 0 : -1} placeholder="Select Experience"
					></Form.SelectTrigger>
					<Form.SelectContent class=" max-h-[120px] md:max-h-[150px] h-full overflow-y-auto">
						{#await handleFetchExperienceLevels}
							<Form.SelectItem value={null} label={'Loading...'}>
								<span>Loading</span>
							</Form.SelectItem>
						{:then value}
							{#each experienceLevels as experienceLevel}
								<Form.SelectItem value={experienceLevel.id} label={experienceLevel.value}
									>{experienceLevel.value}</Form.SelectItem
								>
							{/each}
						{:catch error}
							<!-- promise was rejected -->
							<p>Something went wrong: {error.message}</p>
						{/await}
					</Form.SelectContent>
				</Form.Select>
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="jobDescription">
			<Form.Item>
				<Form.Label>Job Description</Form.Label>
				<Form.Textarea tabindex={drawerExpanded ? 0 : -1} />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
		<Form.Field {config} name="specialInstructions">
			<Form.Item>
				<Form.Label>Special Instructions</Form.Label>
				<Form.Textarea tabindex={drawerExpanded ? 0 : -1} />
				<Form.Validation />
			</Form.Item>
		</Form.Field>
	</div>
	<input name="timezone" type="hidden" bind:value={timezone} />

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
			class="px-4 py-2 border border-green-400 bg-green-400 hover:bg-green-400 text-white rounded-md"
			>{#if submitting}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Please wait{:else}Create Requisition{/if}</Button
		>
	</div>
</Form.Root>
