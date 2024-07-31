<script lang="ts">
	export let name: string;
	export let value: number;
</script>

<div class="rounded-lg bg-blue-400 p-4 flex flex-col items-center justify-between grow">
	<slot name="icon" />
	<p class="text-5xl text-center">{value}</p>
	<p class="text-lg font-medium text-center leading-none max-w-[100px]">{name}</p>
</div>
