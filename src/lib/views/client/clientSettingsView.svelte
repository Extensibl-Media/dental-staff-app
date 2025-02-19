<script lang="ts">
	import { SETTINGS_MENU_OPTIONS } from '$lib/config/constants';
	import { superForm } from 'sveltekit-superforms/client';
	import { userSchema, type UserSchema } from '$lib/config/zod-schemas';
	import { cn } from '$lib/utils';
	import * as Form from '$lib/components/ui/form';
	import * as Alert from '$lib/components/ui/alert';
	import { AlertCircle, Loader } from 'lucide-svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';

	export let userProfileForm;
	export let passwordForm;
	export let companyForm;
	export let billingInfo;
	const { form: userFormObj, enhance: userFormEnhance } = superForm(userProfileForm);
	const { form: companyFormObj, enhance: companyFormEnhance } = superForm(companyForm);
	const {
		form: passwordFormObj,
		enhance: passwordFormEnhance,
		errors: passwordErrors
	} = superForm(passwordForm);
	export let selectedTab: string;

	$: confirmPasswordError = $passwordErrors.confirmPassword;
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
</script>

<div class="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-5 md:grow">
	<div
		class="col-span-5 md:col-span-1 md:border-r border-b md:border-b-0 border-gray-200 h-full flex flex-col gap-2 l pr-6"
	>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.PROFILE)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.PROFILE ? 'bg-gray-50 border-gray-100' : ''
			)}>Profile</button
		>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.COMPANY)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.COMPANY ? 'bg-gray-50 border-gray-100' : ''
			)}>Company Info</button
		>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.PASSWORD)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.PASSWORD ? 'bg-gray-50 border-gray-100' : ''
			)}>Password</button
		>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.NOTIFICATIONS)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.NOTIFICATIONS
					? 'bg-gray-50 border-gray-100'
					: ''
			)}>Notifications</button
		>
		<button
			on:click={() => (selectedTab = SETTINGS_MENU_OPTIONS.CLIENT.BILLING)}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.BILLING ? 'bg-gray-50 border-gray-100' : ''
			)}>Billing</button
		>
		<!-- <button
			on:click={() => (selectedTab = 'CLIENT-TEAM')}
			class={cn(
				'rounded-md hover:bg-gray-50 p-3 border border-white text-left',
				selectedTab === 'CLIENT-TEAM' ? 'bg-gray-50 border-gray-100' : ''
			)}>Team</button
		> -->
	</div>
	<div class="col-span-5 md:col-span-4 pl-4 space-y-4">
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.PROFILE}
			<h2 class="text-3xl font-semibold">Profile Details</h2>
			<form use:userFormEnhance method="POST" action="?/updateUser">
				<div class="grid grid-cols-2 gap-6">
					<!-- {#if errors?._errors?.length}
						<div class="col-span-2">
							<Alert.Root variant="destructive">
								<AlertCircle class="h-4 w-4" />
								<Alert.Title>Error</Alert.Title>
								<Alert.Description>
									{#each errors._errors as error}
										{error}
									{/each}
								</Alert.Description>
							</Alert.Root>
						</div>
					{/if} -->
					<div class="col-span-2 md:col-span-1">
						<Label for="firstName">First Name</Label>
						<Input name="firstName" bind:value={$userFormObj.firstName} />
					</div>
					<div class="col-span-2 md:col-span-1">
						<Label for="lastName">Last Name</Label>
						<Input name="lastName" bind:value={$userFormObj.lastName} />
					</div>
					<div class="col-span-2 md:col-span-1">
						<Label for="email">Email Address</Label>
						<Input name="email" bind:value={$userFormObj.email} />
					</div>
				</div>
				<div class="mt-8">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		{/if}
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.COMPANY}
			<h2 class="text-3xl font-semibold">Company Details</h2>
			<form use:companyFormEnhance method="POST" class="space-y-8">
				<div class="grid grid-cols-2 gap-6">
					<div class="col-span-2 md:col-span-1">
						<Label for="companyName">Company Name</Label>
						<Input name="companyName" bind:value={$companyFormObj.companyName} />
					</div>

					<div class="col-span-2 md:col-span-1">
						<Label for="companyLogo">Company Logo</Label>
						<Input name="companyLogo" type="file" accept="image/*" />
					</div>

					<div class="col-span-2">
						<Label for="companyDescription">Company Description</Label>
						<Textarea
							name="companyDescription"
							bind:value={$companyFormObj.companyDescription}
							rows={4}
						/>
					</div>

					<div class="col-span-2">
						<Label for="baseLocation">Base Location</Label>
						<Input name="baseLocation" bind:value={$companyFormObj.baseLocation} />
					</div>

					<!-- Operating Hours Section -->
					<div class="col-span-2">
						<h3 class="text-xl font-semibold mb-4">Operating Hours</h3>
						<div class="space-y-4">
							{#each days as day, index}
								<!-- <div class="grid grid-cols-12 gap-4 items-center">
                            <div class="col-span-3">
                            <Label>{day}</Label>
                            </div>
                            <div class="col-span-2 flex items-center gap-2">
                            <Switch
                                id="closed-{index}"
                                checked={!$companyFormObj.operatingHours[index].isClosed}
                                on:change={() => $companyFormObj.operatingHours[index].isClosed = !$companyFormObj.operatingHours[index].isClosed}
                            />
                            <Label for="closed-{index}">Open</Label>
                            </div>
                            {#if !$companyFormObj.operatingHours[index].isClosed}
                            <div class="col-span-3">
                                <Input
                                type="time"
                                bind:value={$companyFormObj.operatingHours[index].openTime}
                                />
                            </div>
                            <div class="col-span-3">
                                <Input
                                type="time"
                                bind:value={$companyFormObj.operatingHours[index].closeTime}
                                />
                            </div>
                            {/if}
                        </div> -->
							{/each}
						</div>
					</div>
				</div>

				<div class="mt-8">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		{/if}
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.PASSWORD}
			<h2 class="text-3xl font-semibold">Change Password</h2>
			<form use:passwordFormEnhance method="POST" action="?/updatePassword">
				<div class="grid grid-cols-2 gap-6">
					{#if confirmPasswordError}
						<div class="col-span-2">
							<Alert.Root variant="destructive">
								<AlertCircle class="h-4 w-4" />
								<Alert.Title>Error</Alert.Title>
								<Alert.Description>
									{confirmPasswordError}
								</Alert.Description>
							</Alert.Root>
						</div>
					{/if}
					<div class="col-span-2 md:col-span-1">
						<Label for="password">Current Password</Label>
						<Input type="password" name="password" bind:value={$passwordFormObj.password} />
					</div>
					<div class="col-span-2 md:col-span-1"></div>
					<div class="col-span-2 md:col-span-1">
						<Label for="newPassword">New Password</Label>
						<Input type="password" name="newPassword" bind:value={$passwordFormObj.newPassword} />
					</div>
					<div class="col-span-2 md:col-span-1"></div>
					<div class="col-span-2 md:col-span-1">
						<Label for="confirmPassword">Confirm New Password</Label>
						<Input
							type="password"
							name="confirmPassword"
							bind:value={$passwordFormObj.confirmPassword}
						/>
					</div>
				</div>
				<div class="mt-8">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		{/if}
		{#if selectedTab === SETTINGS_MENU_OPTIONS.CLIENT.BILLING}
			<div class="space-y-6">
				<h2 class="text-3xl font-semibold">Billing & Subscription</h2>

				<!-- Current Plan/Subscription Card -->
				<div class="border rounded-lg p-6 space-y-4">
					<div class="flex justify-between items-start">
						<div>
							<h3 class="text-xl font-semibold">Current Plan</h3>
							{#if billingInfo?.clientSubscription?.stripeCustomerId}
								<p class="text-sm text-gray-500">
									Next billing date: {new Date(
										billingInfo.subscription?.currentPeriodEnd
									).toLocaleDateString()}
								</p>
							{:else}
								<p class="text-sm text-gray-500">No active subscription</p>
							{/if}
						</div>
						{#if billingInfo?.subscription}
							<div class="text-right">
								<p class="text-2xl font-bold">${billingInfo.subscription.amount}</p>
								<p class="text-sm text-gray-500">per {billingInfo.subscription.interval}</p>
							</div>
						{/if}
					</div>

					<!-- Payment Method if exists -->
					{#if billingInfo?.paymentMethod}
						<div class="border-t pt-4 mt-4">
							<h4 class="font-medium mb-3">Payment Method</h4>
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
								<div class="flex items-center gap-3">
									<div class="p-2 bg-white rounded border">
										<svg
											class="w-6 h-6"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
											<line x1="1" y1="10" x2="23" y2="10"></line>
										</svg>
									</div>
									<div>
										<p class="font-medium">•••• {billingInfo.paymentMethod.last4}</p>
										<p class="text-sm text-gray-500">
											Expires {billingInfo.paymentMethod.expiryMonth}/{billingInfo.paymentMethod
												.expiryYear}
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Action Button -->
					<div class="pt-4 mt-4 border-t">
						{#if billingInfo?.clientSubscription?.stripeCustomerId}
							<Button
								class="w-full bg-blue-600 hover:bg-blue-700"
								on:click={async () => {
									try {
										const response = await fetch('/api/stripe/create-portal-session', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											}
										});

										if (!response.ok) throw new Error('Failed to create portal session');

										const { url } = await response.json();
										window.location.href = url;
									} catch (error) {
										console.error('Error creating portal session:', error);
									}
								}}
							>
								Manage Subscription in Stripe
							</Button>
						{:else}
							<Button
								class="w-full md:w-fit bg-blue-600 hover:bg-blue-700"
								on:click={async () => {
									try {
										const response = await fetch('/api/stripe/create-checkout-session', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											},
											body: JSON.stringify({
												priceId: 'price_1Qtd6aKSJyLDCJz65aSNbkOW' // Replace with your price ID
											})
										});

										if (!response.ok) throw new Error('Failed to create checkout session');

										const { url } = await response.json();
										window.location.href = url;
									} catch (error) {
										console.error('Error creating checkout session:', error);
									}
								}}
							>
								Subscribe Now
							</Button>
						{/if}
					</div>
				</div>

				<!-- Billing History -->
				{#if billingInfo?.invoices?.length}
					<div class="border rounded-lg p-6">
						<h3 class="text-xl font-semibold mb-4">Billing History</h3>
						<div class="space-y-3">
							{#each billingInfo.invoices as invoice}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
									<div>
										<p class="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
										<p class="text-sm text-gray-500">${invoice.amount}</p>
									</div>
									<div class="flex items-center gap-3">
										<span
											class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
										>
											{invoice.status}
										</span>
										{#if invoice.pdfUrl}
											<a
												href={invoice.pdfUrl}
												class="text-sm text-blue-600 hover:text-blue-800"
												target="_blank"
												rel="noopener noreferrer"
											>
												Download
											</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
