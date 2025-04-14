<script lang="ts">
import type {PageData} from "./$types"
import DataTableEmptyState from "./data-table-empty-state.svelte";
import DataTable from "./data-table.svelte";
import type { TimesheetWithRelations } from "$lib/server/database/schemas/requisition";

export let data: PageData
$: console.log(data)
$: timesheets = data.timesheets as TimesheetWithRelations[];


</script>

<svelte:head>
    <title>Timesheets | DentalStaff.US</title>
</svelte:head>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class=" flex items-center justify-between flex-wrap">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Timesheets</h1>
	</div>

	<div class="">
        {#if timesheets.length === 0}
            <DataTableEmptyState />
        {:else}
            <DataTable data={data.timesheets} />
        {/if}
    </div>
</section>
