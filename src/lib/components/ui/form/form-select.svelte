<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { getFormField } from 'formsnap';
	import type { Select as SelectPrimitive } from 'bits-ui';

	type $$Props = SelectPrimitive.Props<unknown>;
	const { setValue, name, value } = getFormField();
	export let onSelectedChange: $$Props['onSelectedChange'] = undefined;
	export let onOpenChange: $$Props['onOpenChange'] = undefined;
</script>

<Select.Root
	{onOpenChange}
	onSelectedChange={(v) => {
		onSelectedChange?.(v);
		setValue(v ? v.value : undefined);
	}}
	{...$$restProps}
>
	<slot />
	<input hidden {name} value={$value} />
</Select.Root>
