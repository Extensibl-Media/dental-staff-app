<script lang="ts">
	import { cn } from '$lib/utils';
	import type PageData from './$types';

	let selectedTab = 'ACCOUNT';
	export let data: PageData;
</script>

<section class="grow h-screen overflow-y-auto">
	<div class="p-6 flex flex-col gap-6 grow h-full">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
			Account Settings
		</h1>
	</div>
</section>
