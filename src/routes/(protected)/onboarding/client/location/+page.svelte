<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import * as Alert from '$lib/components/ui/alert';
	import { clientCompanyLocationSchema, type CompanyLocationSchema } from '$lib/config/zod-schemas';

	import { Loader2, AlertCircle } from 'lucide-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { STATES } from '$lib/config/constants';

	export let form: SuperValidated<CompanyLocationSchema>;
</script>

<section class="flex flex-col items-center justify-center min-h-screen">
	<div class="p-6 flex gap-2 w-full max-w-2xl mx-auto">
		<Form.Root
			class="w-full"
			let:submitting
			let:errors
			method="POST"
			{form}
			schema={clientCompanyLocationSchema}
			let:config
		>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-2xl">Add Main Location</Card.Title>
					<Card.Description
						>Add your main location. If you operate more than one, you can add more later in your
						dashboard.</Card.Description
					>
				</Card.Header>
				<Card.Content>
					{#if errors?._errors?.length}
						<Alert.Root variant="destructive">
							<AlertCircle class="h-4 w-4" />
							<Alert.Title>Error</Alert.Title>
							<Alert.Description>
								{#each errors._errors as error}
									{error}
								{/each}
							</Alert.Description>
						</Alert.Root>
					{/if}
					<Form.Field {config} name="name">
						<Form.Item>
							<Form.Label>Location Name</Form.Label>
							<Form.Input />
							<Form.Validation />
						</Form.Item>
					</Form.Field>
					<Form.Field {config} name="streetOne">
						<Form.Item>
							<Form.Label>Street 1</Form.Label>
							<Form.Input />
							<Form.Validation />
						</Form.Item>
					</Form.Field>
					<Form.Field {config} name="streetTwo">
						<Form.Item>
							<Form.Label>Street 2</Form.Label>
							<Form.Input />
							<Form.Validation />
						</Form.Item>
					</Form.Field>
					<Form.Field {config} name="city">
						<Form.Item>
							<Form.Label>City</Form.Label>
							<Form.Input />
							<Form.Validation />
						</Form.Item>
					</Form.Field>
					<div class="grid grid-cols-2 gap-2 md:gap-4">
						<div class="col-span-2 md:col-span-1">
							<Form.Field {config} name="state">
								<Form.Item>
									<Form.Label>State</Form.Label>
									<Form.Select>
										<Form.SelectTrigger placeholder="State"></Form.SelectTrigger>
										<Form.SelectContent class="max-h-[150px] overflow-y-scroll">
											{#each STATES as state}
												<Form.SelectItem value={state.abbreviation} label={state.name}
													>{state.name}</Form.SelectItem
												>
											{/each}
										</Form.SelectContent>
									</Form.Select>
									<Form.Validation />
								</Form.Item>
							</Form.Field>
						</div>
						<div class="col-span-2 md:col-span-1">
							<Form.Field {config} name="zipcode">
								<Form.Item>
									<Form.Label>Zipcode</Form.Label>
									<Form.Input type="number" />
									<Form.Validation />
								</Form.Item>
							</Form.Field>
						</div>
					</div>
					<Form.Field {config} name="email">
						<Form.Item>
							<Form.Label>Office Email</Form.Label>
							<Form.Input type="email" />
							<Form.Validation />
						</Form.Item>
					</Form.Field>
					<div class="grid grid-cols-4 gap-2 md:gap-4">
						<div class="col-span-4 md:col-span-3">
							<Form.Field {config} name="phoneNumber">
								<Form.Item>
									<Form.Label>Phone Number</Form.Label>
									<Form.Input type="tel" />
									<Form.Validation />
								</Form.Item>
							</Form.Field>
						</div>
						<div class="col-span-2 md:col-span-1">
							<Form.Field {config} name="phoneNumberType">
								<Form.Item>
									<Form.Label>Type</Form.Label>
									<Form.Select>
										<Form.SelectTrigger placeholder="Type"></Form.SelectTrigger>
										<Form.SelectContent class="">
											<Form.SelectItem value={'cell'} label={'Cell'}>Cell</Form.SelectItem>
											<Form.SelectItem value={'office'} label={'Office'}>Office</Form.SelectItem>
										</Form.SelectContent>
									</Form.Select>
									<Form.Validation />
								</Form.Item>
							</Form.Field>
						</div>
					</div>
				</Card.Content>
				<Card.Footer>
					<Form.Button class="ml-auto bg-blue-800 hover:bg-blue-900" disabled={submitting}
						>{#if submitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}Next{/if}
					</Form.Button>
				</Card.Footer>
			</Card.Root>
		</Form.Root>
	</div>
</section>
