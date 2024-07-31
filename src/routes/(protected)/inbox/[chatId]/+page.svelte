<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Form from '$lib/components/ui/form';
	import { newMessageSchema } from '$lib/config/zod-schemas.js';
	import { Loader2 } from 'lucide-svelte';
	import { afterUpdate, onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms/client';

	export let data;

	let shouldScroll = false;

	$: user = data.user;
	$: chat = data.chat;
	$: form = data.form;
	$: ({ messages, chatUser } = chat);
	let messageText: string = '';

	$: if (messages) {
		shouldScroll = true;
	}

	onMount(() => {
		scrollToBottom();
	});

	afterUpdate(() => {
		if (shouldScroll) {
			messageText = '';
			scrollToBottom();
			shouldScroll = false;
		}
	});

	const scrollToBottom = () => {
		if (typeof document !== 'undefined') {
			const bottom = document?.getElementById('bottom');
			bottom?.scrollIntoView();
		}
	};
</script>

<div class="h-full flex flex-col overflow-hidden">
	<div class="p-6 border-b border-b-gray-200 flex gap-6 items-center bg-white">
		<Avatar.Root class="h-14 w-14">
			<Avatar.Image src={chatUser?.avatarUrl} />
		</Avatar.Root>
		<p class=" text-3xl font-semibold">{chatUser?.firstName} {chatUser?.lastName}</p>
	</div>

	<div id="chat-window" class="h-full grow p-4 overflow-y-auto bg-white">
		<div class="flex flex-col justify-end gap-4">
			{#if messages}
				{#each messages as message}
					{#if message.senderId === user?.id}
						<div
							class="self-end p-4 max-w-[400px] w-fit ml-6 bg-blue-500 rounded-t-lg rounded-bl-lg text-white relative"
						>
							<p>{message.body}</p>
							<svg
								class="absolute -right-2 bottom-0"
								width="9"
								height="8"
								viewBox="0 0 9 8"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M0.941197 7.86149L0.920348 0.533866L8.26882 7.88233L0.941197 7.86149Z"
									fill="#3f83f8"
								/>
							</svg>
						</div>
					{:else}
						<div
							class="relative self-start p-4 max-w-[400px] w-fit mr-6 bg-gray-200 rounded-t-lg rounded-br-lg"
						>
							<p>{message.body}</p>
							<svg
								class="absolute -left-2 bottom-0"
								width="8"
								height="8"
								viewBox="0 0 8 8"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M7.81222 7.86149L7.83307 0.533866L0.484601 7.88233L7.81222 7.86149Z"
									fill="#e5e7eb"
								/>
							</svg>
						</div>
					{/if}
				{/each}
				<div id="bottom" />
			{/if}
		</div>
	</div>
	<Form.Root
		let:submitting
		let:errors
		let:config
		method="POST"
		{form}
		action="?/sendNewMessage"
		schema={newMessageSchema}
	>
		<div class="p-6 flex gap-4 border-t border-t-gray-200 bg-white">
			<Form.Field {config} name="body">
				<Form.Input
					class="grow-1"
					value={messageText}
					on:change={(e) => (messageText = e.currentTarget.value)}
					placeholder="New Message..."
				/>
			</Form.Field>
			<Form.Button
				>{#if submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{:else}Send{/if}</Form.Button
			>
		</div>
	</Form.Root>
</div>
