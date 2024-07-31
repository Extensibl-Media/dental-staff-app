<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import * as Alert from '$lib/components/ui/alert';
	import { clientCompanySchema, type ClientCompanySchema } from '$lib/config/zod-schemas';
	import { Loader2, AlertCircle } from 'lucide-svelte';
	import type { SuperValidated } from 'sveltekit-superforms';

	export let form: SuperValidated<ClientCompanySchema>;
</script>

<section class="flex flex-col items-center justify-center min-h-screen">
	<div class="p-6 flex gap-2 w-full max-w-2xl mx-auto">
		<Form.Root
			class="w-full"
			let:submitting
			let:errors
			method="POST"
			{form}
			schema={clientCompanySchema}
			let:config
		>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-2xl">Company Info</Card.Title>
					<Card.Description>Let's get your company profile set up.</Card.Description>
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
					<Form.Field {config} name="companyName">
						<Form.Item>
							<Form.Label>Company Name</Form.Label>
							<Form.Input />
							<Form.Validation />
						</Form.Item>
					</Form.Field>
				</Card.Content>
				<Card.Footer>
					<Form.Button class="ml-auto" disabled={submitting}
						>{#if submitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}Next{/if}
					</Form.Button>
				</Card.Footer>
			</Card.Root>
		</Form.Root>
	</div>
</section>
