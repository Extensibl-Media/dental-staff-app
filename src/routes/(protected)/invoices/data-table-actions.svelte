<script lang="ts">
	import type { InvoiceWithRelations } from '$lib/server/database/schemas/requisition';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { MoreHorizontal } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	export let row: InvoiceWithRelations;

	const copyInvoiceNumber = () => {
		navigator.clipboard.writeText(row.invoice.invoiceNumber);
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button variant="ghost" builders={[builder]} size="icon" class="h-8 w-8 p-0">
			<span class="sr-only">Open menu</span>
			<MoreHorizontal class="h-4 w-4" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Label>Actions</DropdownMenu.Label>
		<DropdownMenu.Item on:click={copyInvoiceNumber}>Copy invoice number</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item on:click={() => goto(`/invoices/${row.invoice.id}`)}
			>View invoice details</DropdownMenu.Item
		>
		<DropdownMenu.Item on:click={() => goto(`/timesheets/${row.timesheet?.id}`)}
			>View timesheet</DropdownMenu.Item
		>
		{#if row.invoice.status === 'draft'}
			<DropdownMenu.Item>Edit invoice</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
