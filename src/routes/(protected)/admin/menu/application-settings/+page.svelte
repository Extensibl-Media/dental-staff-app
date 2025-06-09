<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import {
		Select,
		SelectContent,
		SelectInput,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import { Disc, Loader2, Save } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	const { form, enhance, submitting } = superForm(data.paymentFeeForm);
	$: console.log('Form data:', $form);

	$: selectedPaymentType = $form.paymentFeeType
		? {
				label: $form.paymentFeeType === 'FIXED' ? 'Fixed' : 'Percentage',
				value: $form.paymentFeeType
			}
		: null;
</script>

<section class="container mx-auto flex flex-col min-h-screen">
	<div class="py-6 flex flex-col gap-6">
		<div>
			<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
				Application Settings
			</h1>
			<p class="text-sm text-muted-foreground">
				Manage application-wide settings and configurations.
			</p>
		</div>
		<div>
			<Card.Root>
				<Card.Header>
					<Card.Title>Invoice Platform Fee</Card.Title>
					<Card.Description
						>Set platform fee for handling invoices on behalf of Business Members</Card.Description
					>
				</Card.Header>
				<form method="POST" use:enhance action="?/updatePaymentFee">
					<Card.Content class="space-y-4">
						<div>
							<Label>Payment Fee</Label>
							<Input type="number" name="paymentFee" bind:value={$form.paymentFee} />
						</div>
						<div>
							<Label>Fee Type (fixed or percentage)</Label>
							<Select
								selected={selectedPaymentType}
								onSelectedChange={(v) => {
									v && ($form.paymentFeeType = v.value);
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Fee Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="FIXED">Fixed</SelectItem>
									<SelectItem value="PERCENTAGE">Percentage</SelectItem>
								</SelectContent>
								<SelectInput name="paymentFeeType" bind:value={$form.paymentFeeType} />
							</Select>
						</div>
					</Card.Content>
					<Card.Footer>
						<Button class="bg-green-500 hover:bg-green-600 ml-auto" type="submit">
							<Save class="mr-2" />
							{#if $submitting}
								<Loader2 class="animate-spin" /> Saving...
							{:else}
								Save Changes
							{/if}
						</Button>
					</Card.Footer>
				</form>
			</Card.Root>
		</div>
	</div>
</section>
