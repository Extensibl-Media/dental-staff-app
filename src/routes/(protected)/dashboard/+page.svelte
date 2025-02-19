<script lang="ts">
	import { USER_ROLES } from '$lib/config/constants';
	import AdminDashboardView from '$lib/views/admin/adminDashboardView.svelte';
	import ClientDashboardView from '$lib/views/client/clientDashboardView.svelte';
	// import ClientStaffDashboardView from '$lib/views/client/clientStaffDashboardView.svelte';

	export let data;
	$: user = data.user;
</script>

{#if user?.role === USER_ROLES.SUPERADMIN}
	<AdminDashboardView {user} {data} />
{:else if user?.role === USER_ROLES.CLIENT}
	<ClientDashboardView {user} {data} />
{:else if user?.role === USER_ROLES.CLIENT_STAFF}
	<!-- Update to Staff View if something changes between the two -->
	<ClientDashboardView {user} {data} />
{/if}
