<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { ChevronDown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button variant="ghost" size="icon">
			<ChevronDown size={20} />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<slot />
	</DropdownMenu.Content>
</DropdownMenu.Root>
