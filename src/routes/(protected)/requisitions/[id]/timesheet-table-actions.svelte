<script lang="ts">
	import { Button } from "$lib/components/ui/button";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { MoreHorizontal, FileEdit, CheckCircle, Ban } from "lucide-svelte";

    export let timesheetId: string;
    export let isValidated: boolean;
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
        <Button
            class="h-8 w-8 p-0 focus-visible:ring-0"
            builders={[builder]}
        >
            <MoreHorizontal class="h-4 w-4" />
            <span class="sr-only">Open menu</span>
        </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
        <DropdownMenu.Group>
            <DropdownMenu.Item>
                <FileEdit class="mr-2 h-4 w-4" />
                <span>Edit Timesheet</span>
            </DropdownMenu.Item>
            {#if !isValidated}
                <DropdownMenu.Item>
                    <CheckCircle class="mr-2 h-4 w-4" />
                    <span>Validate</span>
                </DropdownMenu.Item>
            {/if}
            <DropdownMenu.Separator />
            <DropdownMenu.Item class="text-destructive">
                <Ban class="mr-2 h-4 w-4" />
                <span>Void Timesheet</span>
            </DropdownMenu.Item>
        </DropdownMenu.Group>
    </DropdownMenu.Content>
</DropdownMenu.Root>
