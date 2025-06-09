<script lang="ts"></script>

<section class="grow h-screen overflow-y-auto">
	<div class="p-6 flex flex-col gap-6">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">Admin Menu</h1>
	</div>
	<div class="px-6 pb-6 grid grid-cols-6 gap-12">
		<div class="col-span-6 md:col-span-3 lg:col-span-2">
			<p class="text-lg font-semibold">User Management</p>
			<ul class="pt-4 flex flex-col gap-1">
				<li class="text-blue-500"><a href="/admin/menu/admins">Admins</a></li>
				<li class="text-blue-500"><a href="/candidates">Candidates</a></li>
				<li class="text-blue-500"><a href="/clients">Clients</a></li>
				<!-- <li class="text-blue-500"><a href="/admin/client-staff">Client Staff</a></li> -->
				<li class="text-blue-500"><a href="/#">Client Locations</a></li>
			</ul>
		</div>
		<div class="col-span-6 md:col-span-3 lg:col-span-2">
			<p class="text-lg font-semibold">Requisition Management</p>
			<ul class="pt-4 flex flex-col gap-1">
				<li class="text-blue-500"><a href="/requisitions">Requisitions</a></li>
				<!-- <li class="text-blue-500"><a href="/admin/menu/requisition-types">Requisition Types</a></li> -->
				<li class="text-blue-500"><a href="/timesheets">Timesheets</a></li>
				<li class="text-blue-500"><a href="/admin/menu/ratings">Ratings</a></li>
				<li class="text-blue-500"><a href="/admin/menu/experience-levels">Experience Levels</a></li>
				<li class="text-blue-500"><a href="/admin/menu/skill-categories">Skill Categories</a></li>
				<li class="text-blue-500"><a href="/admin/menu/skills">Skills</a></li>
				<li class="text-blue-500"><a href="/admin/menu/disciplines">Disciplines</a></li>
			</ul>
		</div>
		<div class="col-span-6 md:col-span-3 lg:col-span-2">
			<p class="text-lg font-semibold">Record Management</p>
			<ul class="pt-4 flex flex-col gap-1">
				<!-- <li class="text-blue-500"><a href="/#">Company Documents/Forms</a></li> -->
				<li class="text-blue-500"><a href="/admin/menu/support-tickets">Support Tickets</a></li>
				<li class="text-blue-500"><a href="/admin/menu/record-history">Record History</a></li>
				<li class="text-blue-500"><a href="/admin/menu/regions">Regions</a></li>
				<li class="text-blue-500"><a href="/admin/menu/sub-regions">Sub Regions</a></li>
				<li class="text-blue-500"><a href="/admin/menu/documents">Documents</a></li>
				<!-- <li class="text-blue-500">
					<a href="/admin/menu/notification-templates">Notification Templates</a>
				</li> -->
				<!-- <li class="text-blue-500"><a href="/admin/menu/emails">Emails Sent</a></li>
				<li class="text-blue-500"><a href="/admin/menu/sms">SMS Sent</a></li> -->
				<!-- <li class="text-blue-500"><a href="/admin/menu/transactions">Transactions</a></li> -->
				<!-- <li class="text-blue-500"><a href="/admin/menu/reports">Reports</a></li> -->
				<li class="text-blue-500">
					<a href="/admin/menu/application-settings">Application Settings</a>
				</li>
				<!-- <li class="text-blue-500">
					<a href="/admin/menu/mass-notifications">Mass Notifications</a>
				</li> -->
				<!-- <li class="text-blue-500"><a href="/admin/menu/message-history">Message History</a></li> -->
			</ul>
		</div>
	</div>
</section>
