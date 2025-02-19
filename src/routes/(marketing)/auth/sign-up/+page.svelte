<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import * as Card from '$lib/components/ui/card';
	import * as Alert from '$lib/components/ui/alert';
	import { userSchema } from '$lib/config/zod-schemas';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { Loader2 } from 'lucide-svelte';
	import { AlertCircle } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button } from '$lib/components/ui/button';

	const signUpSchema = userSchema.pick({
		firstName: true,
		lastName: true,
		email: true,
		password: true,
		terms: true
	});

	type SignUpSchema = typeof signUpSchema;

	export let data;
	let checked = false;
	const { signupForm } = data;

	const {
		form: formData,
		enhance,
		submitting
	} = superForm(signupForm, {
		resetForm: false,
		dataType: 'json'
	});

	$: console.log($formData.email);
</script>

<div class="flex items-center justify-center mx-auto max-w-2xl">
	<form method="POST" use:enhance>
		<Card.Root>
			<Card.Header class="space-y-1">
				<Card.Title class="text-2xl">Create an account</Card.Title>
				<Card.Description
					>Already have an account? <a href="/auth/sign-in" class="underline">Sign in here.</a
					></Card.Description
				>
			</Card.Header>
			<Card.Content class="grid gap-4">
				<!-- {#if errors?._errors?.length}
					<Alert.Root variant="destructive">
						<AlertCircle class="h-4 w-4" />
						<Alert.Title>Error</Alert.Title>
						<Alert.Description>
							{#each errors._errors as error}
								{error}
							{/each}
						</Alert.Description>
					</Alert.Root>
				{/if} -->
				<div>
					<Label for="firstName">First Name</Label>
					<Input bind:value={$formData.firstName} name="firstName" />
				</div>
				<div>
					<Label for="lastName">Last Name</Label>
					<Input bind:value={$formData.lastName} name="lastName" />
				</div>
				<div>
					<Label for="email">Email Address</Label>
					<Input bind:value={$formData.email} name="email" />
				</div>
				<div>
					<Label for="email">Password</Label>
					<Input bind:value={$formData.password} name="password" />
				</div>
				<div class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
					<Checkbox id="terms" bind:checked={$formData.terms} aria-labelledby="terms-label" />
					<div>
						<Label form="terms">I Accept the terms and privacy policy.</Label>
						<div>
							You agree to the <a href="/terms" class="text-primaryHover underline">terms</a>
							and
							<a href="/privacy" class="text-primaryHover underline">privacy policy</a>.
						</div>
					</div>
				</div>
			</Card.Content>
			<Card.Footer>
				<Button type="submit" class="w-full" disabled={$submitting}
					>{#if $submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Please wait{:else}Sign Up{/if}
				</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
