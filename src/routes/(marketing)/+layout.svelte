<script lang="ts">
	import type { PageData } from './$types';
	import Navigation from '$lib/components/navigation/navigation.svelte';

	export let data: any;
	let user: PageData['user'];
	$: user = data.user;
</script>

<!-- <Navigation {user} /> -->
<div>
	<slot />
</div>
