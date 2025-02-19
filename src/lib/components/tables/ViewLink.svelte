<script lang="ts">
	export let href: string;
	export let value: string | undefined;
</script>

<a class="text-blue-500" {href}>{value || "View"}</a>
