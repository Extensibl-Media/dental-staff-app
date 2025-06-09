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
		HeartHandshake,
		Users,
		ScrollText,
		LifeBuoy,
		MessageCircleQuestion,
		FileClock
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import DashboardNavLink from './dashboard-nav-link.svelte';

	import UserAvatarMenu from './user-avatar-menu.svelte';
	import { USER_ROLES } from '$lib/config/constants';
	import Logo from '../logo/logo.svelte';

	export let user: User | null;
	export let isOfficeAdmin: boolean = false;

	let expanded = false;

	const handleNavExpand = () => {
		expanded = !expanded;
	};
</script>

<header
	class={cn(
		'z-20 group p-5 pt-8 absolute left-0 top-0 bottom-0 h-full transition-all duration-150 ease-in-out min-h-screen bg-blue-900 flex flex-col ',
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
		<Logo />
		<p
			class={cn(
				'origin-left text-white font-medium text-2xl transition-all duration-75',
				!expanded && 'scale-0'
			)}
		>
			DentalStaff.US
		</p>
	</div>
	<ul class="flex flex-col gap-2 mt-8 grow overflow-y-auto">
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
			<DashboardNavLink bind:expanded link={{ name: 'Timesheets', path: '/timesheets ' }}>
				<FileClock class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Invoices', path: '/invoices' }}>
				<ScrollText class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink
				bind:expanded
				link={{
					name: 'Admin Menu',
					path: '/admin/menu'
					// children: [
					// 	{ name: 'Admin Menu', path: '/admin/menu' },
					// 	{ name: 'Reports', path: '/admin/reports' },
					// 	{ name: 'Action History', path: '/admin/history' },
					// 	{ name: 'Support Tickets', path: '/admin/support-tickets' }
					// ]
				}}
			>
				<Shield class="shrink-0" />
			</DashboardNavLink>
		{/if}
		{#if user?.role === USER_ROLES.CLIENT}
			<DashboardNavLink bind:expanded link={{ name: 'Dashboard', path: '/dashboard' }}>
				<LayoutGrid class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Calendar', path: '/calendar' }}>
				<CalendarDays class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Locations', path: '/locations' }}>
				<Building2 class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Requisitions', path: '/requisitions' }}>
				<Briefcase class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Staff', path: '/staff' }}>
				<Users class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Timesheets', path: '/timesheets ' }}>
				<FileClock class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Invoices', path: '/invoices' }}>
				<ScrollText class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Inbox', path: '/inbox' }}>
				<MessageCircle class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Support', path: '/support' }}>
				<MessageCircleQuestion class="shrink-0" />
			</DashboardNavLink>
		{/if}
		{#if user?.role === USER_ROLES.CLIENT_STAFF}
			<DashboardNavLink bind:expanded link={{ name: 'Dashboard', path: '/dashboard' }}>
				<LayoutGrid class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Calendar', path: '/calendar' }}>
				<CalendarDays class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Requisitions', path: '/requisitions' }}>
				<Briefcase class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Locations', path: '/locations' }}>
				<Building2 class="shrink-0" />
			</DashboardNavLink>
			{#if isOfficeAdmin}
				<DashboardNavLink bind:expanded link={{ name: 'Staff', path: '/staff' }}>
					<Users class="shrink-0" />
				</DashboardNavLink>
				<DashboardNavLink bind:expanded link={{ name: 'Invoices', path: '/invoices' }}>
					<ScrollText class="shrink-0" />
				</DashboardNavLink>
			{/if}
			<DashboardNavLink bind:expanded link={{ name: 'Inbox', path: '/inbox' }}>
				<MessageCircle class="shrink-0" />
			</DashboardNavLink>
			<DashboardNavLink bind:expanded link={{ name: 'Support', path: '/support' }}>
				<MessageCircleQuestion class="shrink-0" />
			</DashboardNavLink>
		{/if}
	</ul>
	<UserAvatarMenu {user} />
</header>
