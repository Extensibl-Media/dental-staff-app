<script lang="ts">
	import type { User } from 'lucia';

	import {
		LayoutGrid,
		CalendarDays,
		Briefcase,
		Building2,
		SquareUser,
		MessageCircle,
		Shield,
		ArrowRightSquare,
		HeartHandshake
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import DashboardNavLink from './dashboard-nav-link.svelte';

	import UserAvatarMenu from './user-avatar-menu.svelte';
	import { USER_ROLES } from '$lib/config/constants';

	export let user: User | null;
	let expanded = false;

	const handleNavExpand = () => {
		expanded = !expanded;
	};
</script>

<header
	class={cn(
		'z-20 group p-5 pt-8 absolute left-0 top-0 bottom-0 h-full transition-all duration-150 ease-in-out min-h-screen bg-gray-800 flex flex-col ',
		expanded ? 'w-72' : 'w-20'
	)}
>
	<button
		type="button"
		on:click={handleNavExpand}
		class={cn(
			'absolute p-1 rounded-sm bg-white shadow-lg -right-4 top-8 cursor-pointer',
			expanded ? 'rotate-180' : 'rotate-0'
		)}
	>
		<ArrowRightSquare size={20} />
	</button>
	<div class="inline-flex p-1 gap-4">
		<HeartHandshake size={30} class="text-white shrink-0" />
		<p
			class={cn(
				'origin-left text-white font-medium text-2xl transition-all duration-75',
				!expanded && 'scale-0'
			)}
		>
			DentalStaff.US
		</p>
	</div>
	<ul class="flex flex-col gap-4 mt-8 grow overflow-y-auto">
		{#if user?.role === USER_ROLES.SUPERADMIN}
			<DashboardNavLink bind:expanded link={{ name: 'Dashboard', path: '/dashboard' }}>
				<LayoutGrid class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Calendar', path: '/calendar' }}>
				<CalendarDays class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Inbox', path: '/inbox' }}>
				<MessageCircle class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Requisitions', path: '/requisitions' }}>
				<Briefcase class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Clients', path: '/clients' }}>
				<Building2 class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Candidates', path: '/candidates' }}>
				<SquareUser class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink
				bind:expanded
				link={{
					name: 'Admin',
					children: [
						{ name: 'Admin Menu', path: '/admin/menu' },
						{ name: 'Reports', path: '/admin/reports' },
						{ name: 'Action History', path: '/admin/history' },
						{ name: 'Support Tickets', path: '/admin/support-tickets' }
					]
				}}
			>
				<Shield class="shrink-0" />
			</DashboardNavLink>
		{/if}
		{#if user?.role === USER_ROLES.CLIENT || user?.role === USER_ROLES.CLIENT_STAFF}
			<DashboardNavLink bind:expanded link={{ name: 'Dashboard', path: '/dashboard' }}>
				<LayoutGrid class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Calendar', path: '/calendar' }}>
				<CalendarDays class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Inbox', path: '/inbox' }}>
				<MessageCircle class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Requisitions', path: '/requisitions' }}>
				<Briefcase class="shrink-0" />
			</DashboardNavLink>
		{/if}
	</ul>
	<UserAvatarMenu {user} />
</header>
