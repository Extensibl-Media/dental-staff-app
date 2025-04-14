<script lang="ts">
  import type { InvoiceWithRelations, TimesheetWithRelations } from "$lib/server/database/schemas/requisition";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Button } from "$lib/components/ui/button";
  import { MoreHorizontal } from "lucide-svelte";

  export let row: TimesheetWithRelations;
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button
      variant="ghost"
      builders={[builder]}
      size="icon"
      class="h-8 w-8 p-0"
    >
      <span class="sr-only">Open menu</span>
      <MoreHorizontal class="h-4 w-4" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Label>Actions</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.Item>View Details</DropdownMenu.Item>
    <!-- <DropdownMenu.Item>View Invoice</DropdownMenu.Item> -->
    <!-- {#if row.timesheet.status === 'PENDING'}
      <DropdownMenu.Item>Edit invoice</DropdownMenu.Item>
    {/if} -->
  </DropdownMenu.Content>
</DropdownMenu.Root>
