<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLThAttributes, MouseEventHandler } from 'svelte/elements';

	type $$Props = any;

	let className: $$Props['class'] = undefined;
	export { className as class };
	export let click: MouseEventHandler<HTMLTableCellElement>;
</script>

<th
	on:click={click}
	class={cn(
		'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
		className
	)}
	{...$$restProps}
>
	<slot />
</th>
