<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ActionMenuButton from '$lib/components/dashboard/shared/action-menu-button.svelte';
</script>

<ActionMenuButton>
	<DropdownMenu.Item>
		<a href="">Edit</a>
	</DropdownMenu.Item>
	<DropdownMenu.Item>
		<a href="">Delete</a>
	</DropdownMenu.Item>
</ActionMenuButton>
