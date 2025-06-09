<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { FileText, Plus } from 'lucide-svelte';
</script>

<Card.Root class="w-full flex flex-col items-center p-12 border-dashed">
	<div class="flex flex-col items-center gap-4 text-center">
		<div class="rounded-full bg-muted p-4">
			<FileText class="h-8 w-8 text-muted-foreground" />
		</div>
		<Card.Title class="text-2xl">No invoices yet</Card.Title>
		<Card.Description class="max-w-[420px] text-center text-muted-foreground">
			No invoices have been created yet. When timesheets are submitted for requisitions, invoices
			will be auto generated and will appear here.
		</Card.Description>
	</div>
</Card.Root>
