<script lang="ts">
	import { SETTINGS_MENU_OPTIONS, USER_ROLES } from '$lib/config/constants';
	import ClientSettingsView from '$lib/views/client/clientSettingsView.svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { UserSchema, UserUpdatePasswordSchema } from '$lib/config/zod-schemas';
	import ClientStaffSettingsView from '$lib/views/client/clientStaffSettingsView.svelte';
	import { page } from '$app/stores';

	export let data: any;
	export let userProfileForm: SuperValidated<UserSchema>;
	export let passwordForm: SuperValidated<UserUpdatePasswordSchema>;
	export let subscriptionForm;
	export let companyForm;

	$: userProfileForm = data.userProfileForm;
	$: passwordForm = data.passwordForm;
	$: subscriptionForm = data.subscriptionForm;
	$: companyForm = data.companyForm;
	$: billingInfo = data.billingInfo;

	$: user = data.user;
	$: URLTab = $page.url.searchParams.get('tab');
	$: URLRole = $page.url.searchParams.get('role');

	$: console.log('URLTab:', URLTab);

	$: defaultTab =
		user.role === USER_ROLES.CLIENT
			? SETTINGS_MENU_OPTIONS.CLIENT.PROFILE
			: user.role === USER_ROLES.CLIENT_STAFF
				? SETTINGS_MENU_OPTIONS.CLIENT_STAFF.PROFILE
				: SETTINGS_MENU_OPTIONS.ADMIN.PROFILE;

	$: selectedTab = URLTab && URLRole ? SETTINGS_MENU_OPTIONS[URLRole][URLTab] : defaultTab;
</script>

<section class="grow h-screen overflow-y-auto">
	<div class="p-6 flex flex-col gap-6 grow h-full">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
			Account Settings
		</h1>
		{#if user.role === USER_ROLES.CLIENT}
			<ClientSettingsView
				bind:selectedTab
				{companyForm}
				{userProfileForm}
				{passwordForm}
				{billingInfo}
			/>
		{/if}
		{#if user.role === USER_ROLES.CLIENT_STAFF}
			<ClientStaffSettingsView bind:selectedTab {userProfileForm} {passwordForm} {companyForm} />
		{/if}
	</div>
</section>
