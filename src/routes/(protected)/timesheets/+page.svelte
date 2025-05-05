<script lang="ts">
import type {PageData} from "./$types"
import DataTableEmptyState from "./data-table-empty-state.svelte";
import DataTable from "./data-table.svelte";
import type { TimesheetWithRelations } from "$lib/server/database/schemas/requisition";
	import { USER_ROLES } from "$lib/config/constants";
	import AdminDataTable from "./admin-data-table.svelte";

export let data: PageData
$: console.log(data)
$: user = data.user;
$: timesheets = data.timesheets;


</script>

<svelte:head>
    <title>Timesheets | DentalStaff.US</title>
</svelte:head>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class=" flex items-center justify-between flex-wrap">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Timesheets</h1>
	</div>

	<div class="">
        {#if user.role === USER_ROLES.SUPERADMIN}
            {#if timesheets.length === 0}
                <DataTableEmptyState />
            {:else}
                <AdminDataTable data={data.timesheets} />
            {/if}
        {:else}
            {#if timesheets.length === 0}
                <DataTableEmptyState />
            {:else}
                <DataTable data={data.timesheets} />
            {/if}
        {/if}
    </div>
</section>
