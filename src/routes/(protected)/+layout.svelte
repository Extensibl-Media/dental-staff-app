<script lang="ts">
	import type { LayoutData } from './$types';
	import DashboardNav from '$lib/components/navigation/dashboard-nav.svelte';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';

	export let data: any;
	let user: LayoutData['user'];
	$: user = data.user;
</script>

<ProgressBar class="text-blue-500 h-3" />
<div class="h-screen flex w-full grow pl-20 overflow-hidden bg-gray-100">
	<DashboardNav {user} />
	<div class="grow h-full overflow-y-auto">
		<slot />
	</div>
</div>
