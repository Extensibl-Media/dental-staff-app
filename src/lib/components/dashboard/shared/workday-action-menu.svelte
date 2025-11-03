<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ActionMenuButton from '$lib/components/dashboard/shared/action-menu-button.svelte';
</script>

<ActionMenuButton>
	<DropdownMenu.Item on:click={() => alert('edit action triggered')}>
		<span>Edit</span>
	</DropdownMenu.Item>
	<DropdownMenu.Item on:click={() => alert('Delete action triggered')} class="text-destructive">
		<span>Delete</span>
	</DropdownMenu.Item>
</ActionMenuButton>
