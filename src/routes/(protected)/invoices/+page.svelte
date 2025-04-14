<script lang="ts">
import type {PageData} from "./$types"
export let data: PageData
import DataTable from "./data-table.svelte";
import DataTableEmptyState from "./data-table-empty-state.svelte";
// import type { InvoiceWithRelations } from "$lib/server/database/schemas/requisition";

$: console.log(data)
$: invoices = data.invoices || [];


</script>

<svelte:head>
    <title>Invoices | DentalStaff.US</title>
</svelte:head>

<section class="grow h-screen overflow-y-auto p-6 flex flex-col gap-6">
	<div class=" flex items-center justify-between flex-wrap">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Invoices</h1>
	</div>

	<div class="">
        {#if invoices.length === 0}
            <DataTableEmptyState />
        {:else}
            <DataTable data={invoices} />
        {/if}
    </div>
</section>
