<script lang="ts">
	import { page } from '$app/stores';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';
	import type { LayoutData } from './$types';

	import { PenBox, Search } from 'lucide-svelte';
	export let data: LayoutData;
	let searchTerm: string = '';

	$: pageObj = $page;
	$: user = data.user;
	$: isNestedRoute = pageObj.params.chatId !== undefined;
	$: conversations = data.conversations.map((conv) => ({
	    ...conv,
		participants: conv.participants.filter((p) => p.userId !== user.id),
	}));

</script>

<section class="grow h-screen overflow-hidden grid grid-cols-5">
	<div class="col-span-5 lg:col-span-2 h-full overflow-hidden flex flex-col">
		<div class="p-6 flex justify-between">
			<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Inbox</h1>
			<button class="p-2 bg-gray-200 hover:bg-gray-300 rounded-md"><PenBox /></button>
		</div>
		<div>
			<div class="relative grow p-6 pt-0">
				<Search class="absolute left-8 top-2.5" size={20} />
				<Input
					on:change={(e) => (searchTerm = e.currentTarget.value)}
					bind:value={searchTerm}
					type="text"
					class="bg-white pl-10"
					placeholder="Search Conversations"
				/>
			</div>
		</div>
		<div class={cn('grow overflow-y-scroll flex flex-col', isNestedRoute && 'hidden lg:flex')}>
			{#each conversations as conversation}
			<a href={`/inbox/${conversation.id}`}>
					<div
						class="px-8 py-6 border-b border-b-gray-200 hover:bg-gray-50 flex items-center gap-4 bg-white"
					>
						<Avatar.Root class="h-14 w-14">
							<Avatar.Image src={conversation?.participants[0]?.user?.avatarUrl} />
						</Avatar.Root>
						<div>
							<p class="text-xl font-semibold">{conversation?.participants[0]?.user?.firstName}</p>
							{#if conversation.lastMessage}
							  <p class="text-sm text-gray-500 line-clamp-1">{conversation.lastMessage.body}</p>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
	<div class="col-span-5 lg:col-span-3 lg:border-l-2 lg:border-l-gray-300 overflow-hidden">
		{#if isNestedRoute}
			<slot />
		{:else}
			<div class="h-full flex items-center justify-center bg-white">
				<p>Open a conversation</p>
			</div>
		{/if}
	</div>
</section>
