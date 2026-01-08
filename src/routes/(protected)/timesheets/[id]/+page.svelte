<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import {
		Calendar,
		Clock,
		FileText,
		CheckCircle2,
		X,
		AlertCircle,
		ArrowLeft,
		Printer,
		Download,
		User,
		AlertTriangle,
		Info,
		HelpCircle,
		Edit,
		RefreshCw,
		Save,
		Shield,
		History,
		Clipboard,
		Undo2,
		Trash2,
		Eye
	} from 'lucide-svelte';
	import { format, parseISO, addDays } from 'date-fns';
  import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
	import { cn } from '$lib/utils';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { USER_ROLES } from '$lib/config/constants';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';

	export let data: PageData;
	$: user = data.user;

	// State variables
	let approvalDialogOpen = false;
	let rejectionDialogOpen = false;
	let rejectionNote = '';
	let activeTab = 'hours';
	let editingDiscrepancy = null;
	let editingHour = null;
	let correctionMode = false;
	let correctionNote = '';
	let originalValue = '';
	let newValue = '';
	let correctionHistory: any[] = [];
	let showHistory = false;
	let overrideDialogOpen = false;
	let recalculatingHours = false;

	// New state for bulk editing
	let bulkEditMode = false;
	let editedHours = data?.timesheet?.hoursRaw ? [...data.timesheet.hoursRaw] : [];
	let editedTotalHours = data?.timesheet?.totalHoursWorked || '0';
	let savingChanges = false;

	// Format dates for display
	const weekBeginDate = new Date(
		data?.timesheet?.weekBeginDate || (new Date() as Date)
	).toISOString();

	const weekEndDate = addDays(weekBeginDate, 6);
	const formattedWeekRange = `${format(weekBeginDate, 'MMM d')} - ${format(weekEndDate, 'MMM d, yyyy')}`;

	// Get status badge for timesheet
	function getTimesheetStatusBadge() {
		if (data?.timesheet?.validated && !data?.timesheet?.awaitingClientSignature) {
			return { variant: 'success', text: 'Approved', icon: CheckCircle2 };
		} else if (data?.timesheet?.awaitingClientSignature) {
			return { variant: 'warning', text: 'Awaiting Approval', icon: AlertCircle };
		} else {
			return { variant: 'secondary', text: 'Draft', icon: FileText };
		}
	}

	function getCostEstimate() {
		const hourlyRate = data?.timesheet?.hourlyRate || 0;
		const hours = parseFloat(data?.timesheet?.totalHoursWorked || '0');
		return (Number(hourlyRate) * hours).toFixed(2);
	}


 function formatTimeInReqZone(date: Date | string, formatStr: string = 'h:mm a'): string {
    if (!date) return 'N/A';
    try {
      const timezone = data?.requisition?.requisition?.referenceTimezone || 'America/New_York';
      return formatInTimeZone(new Date(date), timezone, formatStr);
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  }

  function formatTimeForInput(date: Date | string): string {
    if (!date) return '';
    try {
      const timezone = data?.requisition?.requisition?.referenceTimezone || 'America/New_York';
      return formatInTimeZone(new Date(date), timezone, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time for input:', error);
      return '';
    }
  }

  // ✅ Parse time input and convert to UTC
  function parseTimeToUTC(dateStr: string, timeStr: string): Date {
    const timezone = data?.requisition?.requisition?.referenceTimezone || 'America/New_York';
    const localDateTime = parseISO(`${dateStr}T${timeStr}:00`);
    return fromZonedTime(localDateTime, timezone);
  }

  function calculateHoursWithLunch(start: Date, end: Date, lunchStart?: Date | null, lunchEnd?: Date | null): number {
    if (!start || !end) return 0;

    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    if (lunchStart && lunchEnd) {
      const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60);
      totalMinutes -= lunchMinutes;
    }

    return Math.round((totalMinutes / 60) * 100) / 100;
  }

	function hasDiscrepancies() {
		return data?.timesheet?.status === "DISCREPANCY"
	}

	// New functions for editing
	function enterBulkEditMode() {
		bulkEditMode = true;
		editedHours = data?.timesheet?.hoursRaw ? [...data.timesheet.hoursRaw] : [];
		editedTotalHours = data?.timesheet?.totalHoursWorked || '0';
	}

	function cancelBulkEdit() {
		bulkEditMode = false;
		editedHours = data?.timesheet?.hoursRaw ? [...data.timesheet.hoursRaw] : [];
		editedTotalHours = data?.timesheet?.totalHoursWorked || '0';
	}

	function removeHourEntry(index: number) {
		editedHours = editedHours.filter((_, i) => i !== index);
		recalculateTotalHours();
	}

	function updateHourEntry(index: number, field: string, value: any) {
    if (!editedHours[index]) return;

    if (field === 'startTime' || field === 'endTime' || field === 'lunchStartTime' || field === 'lunchEndTime') {
      // Convert time string to UTC Date
      const dateStr = editedHours[index].date;
      editedHours[index][field] = value ? parseTimeToUTC(dateStr, value) : null;

      // Recalculate hours
      const hours = calculateHoursWithLunch(
        editedHours[index].startTime,
        editedHours[index].endTime,
        editedHours[index].lunchStartTime,
        editedHours[index].lunchEndTime
      );
      editedHours[index].hours = hours;
    } else {
      editedHours[index] = { ...editedHours[index], [field]: value };
    }

    recalculateTotalHours();
  }

	function recalculateTotalHours() {
		const total = editedHours.reduce((sum, hour) => sum + (hour.hours || 0), 0);
		editedTotalHours = total.toString();
	}

	function formatTimeInput(date: Date): string {
		return format(date, 'HH:mm');
	}

	function parseTimeInput(timeStr: string, date: string): Date {
		const [hours, minutes] = timeStr.split(':').map(Number);
		const baseDate = new Date(date);
		baseDate.setHours(hours, minutes, 0, 0);
		return baseDate;
	}

	const timesheetSeverityMap = {
		HOURS_MISMATCH: 'warning',
		MISSING_RATE: 'info',
		INVALID_HOURS: 'warning',
		UNAUTHORIZED_WORKDAY: 'error'
	};

	const statusBadge = getTimesheetStatusBadge();
</script>

{#if user.role === USER_ROLES.SUPERADMIN}
	<section class="container mx-auto px-4 py-6 space-y-6">
		<!-- Admin Header with Badge -->
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="text-2xl font-bold flex items-center gap-2">Timesheet Details</h1>
				<p class="text-gray-600 flex items-center mt-1">
					<Calendar class="h-4 w-4 mr-1" />
					Week of {formattedWeekRange}
				</p>
			</div>

			<div class="flex gap-2">
				<Button on:click={() => goto('/timesheets')} variant="outline" class="gap-1">
					<ArrowLeft class="h-4 w-4" />
					Back to List
				</Button>
				<Button href={`/requisitions/${data.requisition.id}`} variant="outline" class="gap-1">
					<Eye class="h-4 w-4" />
					View Requisition
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Main Content -->
			<div class="md:col-span-2 space-y-6">
				<!-- Timesheet Info Card -->
				<Card>
					<CardHeader>
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div>
								<CardTitle>{data?.requisition.discipline.name}</CardTitle>
								<CardDescription>
									<p>
										• Candidate: {data?.timesheet?.candidate?.firstName}
										{data?.timesheet?.candidate?.lastName}
									</p>
									<p>• Client: {data?.timesheet?.clientCompanyName}</p>
								</CardDescription>
							</div>
							<Badge
								class={cn(
									data?.timesheet?.status === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
									data?.timesheet?.status === 'DISCREPANCY' && 'bg-orange-400 hover:bg-orange-500',
									data?.timesheet?.status === 'APPROVED' && 'bg-green-400 hover:bg-green-600',
									data?.timesheet?.status === 'VOID' && 'bg-gray-200 hover:bg-gray-300',
									data?.timesheet?.status === 'REJECTED' && 'bg-red-500 hover:bg-red-600'
								)}
								value={data?.timesheet?.status}
							></Badge>
						</div>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Timesheet Summary -->
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
							<div class="p-3 bg-gray-50 rounded-lg">
								<p class="text-sm text-gray-600">Total Hours</p>
								<p class="text-xl font-bold flex items-center justify-center gap-1">
									{bulkEditMode ? editedTotalHours : data?.timesheet?.totalHoursWorked}
									<!-- {#if !bulkEditMode}
										<button
											class="text-gray-500 hover:text-gray-700"
											title="Recalculate Total Hours"
										>
											<RefreshCw class="h-4 w-4" />
										</button>
									{/if} -->
								</p>
							</div>
							<div class="p-3 bg-gray-50 rounded-lg">
								<p class="text-sm text-gray-600">Regular Rate</p>
								<p class="text-xl font-bold">${data?.timesheet?.hourlyRate}</p>
							</div>

							<div class="p-3 bg-gray-50 rounded-lg">
								<p class="text-sm text-gray-600">Est. Cost</p>
								<p class="text-xl font-bold">
									${(
										Number(data?.timesheet?.hourlyRate) *
										parseFloat(
											bulkEditMode ? editedTotalHours : data?.timesheet?.totalHoursWorked || '0'
										)
									).toFixed(2)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Tabs for different sections -->
				<Tabs bind:value={activeTab} class="w-full">
					<TabsList class="grid grid-cols-3 w-full">
						<TabsTrigger value="hours">Hours Detail</TabsTrigger>
						<TabsTrigger value="discrepancies" class="relative">
							Discrepancies
						</TabsTrigger>
						<TabsTrigger value="history" class="relative">
							Audit History
							{#if data.auditHistory && data.auditHistory.length}
								<span
									class="absolute top-1 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800"
								>
									{data.auditHistory.length}
								</span>
							{/if}
						</TabsTrigger>
					</TabsList>

					<!-- Hours Detail Tab Content -->
					<TabsContent value="hours" class="space-y-4 pt-4">
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Hours Detail</CardTitle>
          <CardDescription>
            {bulkEditMode ? 'Edit timesheet hours' : 'View submitted hours'}
          </CardDescription>
        </div>
        {#if !bulkEditMode}
          <Button
            variant="outline"
            class="gap-1 text-green-700 border-green-200 hover:bg-green-50"
            on:click={enterBulkEditMode}
            disabled={data?.timesheet?.status === 'APPROVED'}
          >
            <Edit class="h-4 w-4" />
            Edit Hours
          </Button>
        {:else}
          <div class="flex gap-2">
            <Button variant="outline" class="gap-1" on:click={cancelBulkEdit}>
              <Undo2 class="h-4 w-4" />
              Cancel
            </Button>
            <form
              method="POST"
              action="?/adminEditTimesheet"
              use:enhance={() => {
                savingChanges = true;
                return async ({ result }) => {
                  savingChanges = false;
                  if (result.type === 'success') {
                    bulkEditMode = false;
                    window.location.reload();
                  }
                };
              }}
            >
              <input type="hidden" name="hoursRaw" value={JSON.stringify(editedHours)} />
              <input type="hidden" name="totalHoursWorked" value={editedTotalHours} />
              <Button
                type="submit"
                class="gap-1 bg-green-700 hover:bg-green-800"
                disabled={savingChanges}
              >
                <Save class="h-4 w-4" />
                {savingChanges ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        {/if}
      </div>
    </CardHeader>

    <CardContent>
      {#if bulkEditMode}
        <!-- ✅ EDIT MODE -->
        <div class="space-y-4">
          <Alert>
            <Info class="h-4 w-4" />
            <AlertDescription>
              Editing timesheet hours. All times are in {data?.requisition?.requisition?.referenceTimezone || 'Eastern'} timezone.
            </AlertDescription>
          </Alert>

          {#each editedHours as hour, index}
            {@const recurrenceDay = data.recurrenceDays.find((day) => day.date === hour.date)}

            <div class="border rounded-lg p-4 space-y-4">
              <!-- Date Header -->
              <div class="flex items-center justify-between">
                <p class="font-medium">{format(new Date(hour.date), 'EEE, MMM d, yyyy')}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  on:click={() => removeHourEntry(index)}
                  class="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>

              <!-- Work Hours -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label class="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={formatTimeForInput(hour.startTime)}
                    on:input={(e) => updateHourEntry(index, 'startTime', e.target.value)}
                    class="mt-1"
                  />
                </div>
                <div>
                  <Label class="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={formatTimeForInput(hour.endTime)}
                    on:input={(e) => updateHourEntry(index, 'endTime', e.target.value)}
                    class="mt-1"
                  />
                </div>
              </div>

              <!-- Lunch Hours -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label class="text-xs">Lunch Start (Optional)</Label>
                  <Input
                    type="time"
                    value={formatTimeForInput(hour.lunchStartTime)}
                    on:input={(e) => updateHourEntry(index, 'lunchStartTime', e.target.value)}
                    class="mt-1"
                  />
                </div>
                <div>
                  <Label class="text-xs">Lunch End (Optional)</Label>
                  <Input
                    type="time"
                    value={formatTimeForInput(hour.lunchEndTime)}
                    on:input={(e) => updateHourEntry(index, 'lunchEndTime', e.target.value)}
                    class="mt-1"
                  />
                </div>
              </div>

              <!-- Hours Display -->
              <div class="pt-3 border-t flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Calculated Hours:</span>
                <span class="font-semibold">{hour.hours?.toFixed(2) || '0.00'} hrs</span>
              </div>

              <!-- Scheduled Comparison -->
              {#if recurrenceDay}
                <div class="pt-2 border-t">
                  <p class="text-xs text-muted-foreground">
                    Scheduled: {formatTimeInReqZone(recurrenceDay.dayStart)} - {formatTimeInReqZone(recurrenceDay.dayEnd)}
                    {#if recurrenceDay.lunchStart && recurrenceDay.lunchEnd}
                      <span class="ml-2">
                        (Lunch: {formatTimeInReqZone(recurrenceDay.lunchStart)} - {formatTimeInReqZone(recurrenceDay.lunchEnd)})
                      </span>
                    {/if}
                  </p>
                </div>
              {/if}
            </div>
          {/each}

          <!-- Total -->
          <div class="border-t-2 pt-4 mt-4">
            <div class="flex items-center justify-between">
              <span class="font-bold">Total Hours:</span>
              <div class="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editedTotalHours}
                  on:input={(e) => (editedTotalHours = e.target.value)}
                  class="w-24 text-right font-bold"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  on:click={recalculateTotalHours}
                  title="Recalculate from entries"
                >
                  <RefreshCw class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- ✅ VIEW MODE (same as client view) -->
        {#if data?.timesheet?.hoursRaw && data.timesheet.hoursRaw.length > 0}
          <div class="space-y-3">
            {#each data.timesheet.hoursRaw as entry}
              {@const recurrenceDay = data?.recurrenceDays.find((day) => day.date === entry.date)}

              <div class="border rounded-lg p-4 space-y-3">
                <div class="flex items-start justify-between">
                  <div>
                    <p class="font-medium text-base">{format(new Date(entry.date), 'EEE, MMM d, yyyy')}</p>
                    <p class="text-sm text-muted-foreground mt-0.5">
                      {formatTimeInReqZone(entry.startTime)} - {formatTimeInReqZone(entry.endTime)}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold">{entry.hours} hrs</p>
                  </div>
                </div>

                {#if entry.lunchStartTime && entry.lunchEndTime}
                  <div class="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <span class="text-base">🍽️</span>
                    <span>Lunch: {formatTimeInReqZone(entry.lunchStartTime)} - {formatTimeInReqZone(entry.lunchEndTime)}</span>
                  </div>
                {/if}

                {#if recurrenceDay}
                  <div class="pt-2 border-t">
                    <p class="text-xs text-muted-foreground">
                      Scheduled: {formatTimeInReqZone(recurrenceDay.dayStart)} - {formatTimeInReqZone(recurrenceDay.dayEnd)}
                      {#if recurrenceDay.lunchStart && recurrenceDay.lunchEnd}
                        <span class="ml-2">
                          (Lunch: {formatTimeInReqZone(recurrenceDay.lunchStart)} - {formatTimeInReqZone(recurrenceDay.lunchEnd)})
                        </span>
                      {/if}
                    </p>
                  </div>
                {/if}
              </div>
            {/each}

            <div class="border-t-2 pt-3 mt-4 flex items-center justify-between font-bold">
              <span class="text-base">Total Hours</span>
              <span class="text-lg">{data?.timesheet?.totalHoursWorked} hrs</span>
            </div>
          </div>
        {:else}
          <div class="p-8 text-center text-muted-foreground">
            <Clipboard class="h-12 w-12 mx-auto mb-3" />
            <p>No hours recorded for this timesheet</p>
          </div>
        {/if}
      {/if}
    </CardContent>
  </Card>
</TabsContent>

					<!-- Discrepancies Tab Content -->
					<TabsContent value="discrepancies" class="space-y-4 pt-4">
						<Card>
							<CardHeader>
								<div class="flex items-center justify-between">
									<div>
										<CardTitle>Timesheet Discrepancies</CardTitle>
										<CardDescription>Resolve issues before timesheet approval</CardDescription>
									</div>
								</div>
							</CardHeader>

							<CardContent>
								{#if hasDiscrepancies()}
    								<div class="p-4 border rounded-lg flex gap-3">
    									<div class="mt-0.5">
    										<AlertCircle class="h-5 w-5 text-amber-600" />
    									</div>
    									<div class="flex-1">
    										<p class="mt-2">{data?.timesheet?.discrepancyNote}</p>
    									</div>
    								</div>
								{:else}
									<div class="p-8 text-center">
										<CheckCircle2 class="h-12 w-12 text-green-500 mx-auto mb-3" />
										<h3 class="text-lg font-medium">No Discrepancies Found</h3>
										<p class="text-gray-600 mt-1">
											This timesheet has no issues and is ready for review.
										</p>
									</div>
								{/if}
							</CardContent>
						</Card>
					</TabsContent>

					<!-- Audit History Tab Content -->
					<TabsContent value="history" class="space-y-4 pt-4">
						<Card>
							<CardHeader>
								<CardTitle>Audit History</CardTitle>
								<CardDescription>Record of all changes made to this timesheet</CardDescription>
							</CardHeader>

							<CardContent>
								{#if data.auditHistory && data.auditHistory.length > 0}
									<div class="space-y-4">
										{#each data.auditHistory as record}
											<div class="p-4 border rounded-lg flex gap-3">
												<div class="mt-0.5">
													<History class="h-5 w-5 text-blue-600" />
												</div>
												<div class="flex-1">
													<div class="flex items-start justify-between">
														<div>
															<p class="font-medium">
																{record.user.firstName}
																{record.user.lastName}
																<span class="font-regular text-sm">
																	{#if record.action === 'CREATE'}created{/if}
																	{#if record.action === 'UPDATE'}updated{/if}
																	{#if record.action === 'DELETE'}deleted{/if}
																	timesheet
																</span>
															</p>
															<p class="text-xs text-gray-500">
																{format(record.createdAt, 'PPp')}
															</p>
														</div>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="p-8 text-center">
										<History class="h-12 w-12 text-gray-400 mx-auto mb-3" />
										<h3 class="text-lg font-medium">No Audit History</h3>
										<p class="text-gray-600 mt-1">
											No corrections or overrides have been made to this timesheet.
										</p>
									</div>
								{/if}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Admin Actions Card -->
				<Card>
					<CardHeader>
						<CardTitle>Admin Actions</CardTitle>
						<CardDescription>Manage timesheet status</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-3">
							<Button
								class="w-full bg-green-700 hover:bg-green-800 gap-2"
								disabled={hasDiscrepancies() ||
									data?.timesheet?.status === 'APPROVED' ||
									bulkEditMode}
								on:click={() => (approvalDialogOpen = true)}
							>
								<CheckCircle2 class="h-4 w-4" />
								<span>Approve Timesheet</span>
							</Button>

							{#if hasDiscrepancies()}
								<Button
									disabled={data?.timesheet?.status === 'APPROVED' || bulkEditMode}
									variant="outline"
									class="w-full border-amber-200 text-amber-700 hover:bg-amber-50 gap-2"
									on:click={() => (overrideDialogOpen = true)}
								>
									<Shield class="h-4 w-4" />
									<span>Override Discrepancies</span>
								</Button>
							{/if}

							<Button
								variant="outline"
								class="w-full border-red-200 text-red-700 hover:bg-red-50 gap-2"
								on:click={() => (rejectionDialogOpen = true)}
								disabled={data?.timesheet?.status === 'REJECTED' ||
									data?.timesheet?.status === 'APPROVED' ||
									bulkEditMode}
							>
								<X class="h-4 w-4" />
								<span>Reject Timesheet</span>
							</Button>
						</div>

						{#if bulkEditMode}
							<Alert>
								<Edit class="h-4 w-4" />
								<AlertDescription>
									You are currently editing hours. Save or cancel your changes before approving.
								</AlertDescription>
							</Alert>
						{:else if hasDiscrepancies() && data?.timesheet?.status !== 'APPROVED'}
							<Alert variant="destructive" class="mt-3">
								<AlertCircle class="h-4 w-4" />
								<AlertDescription>
									This timesheet has unresolved discrepancies. Edit the hours to fix them or use the
									override function.
								</AlertDescription>
							</Alert>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>

		<!-- Dialogs -->
		<!-- Override Dialog -->
		<Dialog bind:open={overrideDialogOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Override Discrepancies</DialogTitle>
					<DialogDescription>
						You're about to approve this timesheet despite having unresolved discrepancies. Please
						provide a reason for this override.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter class="mt-4">
					<form method="POST" use:enhance action="?/adminOverrideTimesheet">
						<Button type="button" variant="outline">Cancel</Button>
						<Button
							on:click={() => (overrideDialogOpen = false)}
							type="submit"
							variant="default"
							class="bg-amber-600 hover:bg-amber-700"
						>
							Override & Approve
						</Button>
					</form>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</section>
{:else}
	<!-- Client view remains the same -->
	<section class="container mx-auto px-4 py-6 space-y-6">
		<div class="flex flex-wrap justify-between">
			<div>
				<div class="flex flex-wrap items-center gap-3">
					<h1 class="text-2xl font-bold">Timesheet Review</h1>
					<Badge
						class={cn(
							data?.timesheet?.status === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
							data?.timesheet?.status === 'DISCREPANCY' && 'bg-orange-400 hover:bg-bg-orange-500',
							data?.timesheet?.status === 'APPROVED' && 'bg-green-400 hover:bg-green-600',
							data?.timesheet?.status === 'VOID' && 'bg-gray-200 hover:bg-gray-300',
							data?.timesheet?.status === 'REJECTED' && 'bg-red-500 hover:bg-red-500'
						)}
						value={data?.timesheet?.status}
					></Badge>
				</div>
				<p class="text-gray-600 flex items-center mt-1">
					<Calendar class="h-4 w-4 mr-1" />
					Week of {formattedWeekRange}
				</p>
			</div>
			<div class="flex gap-2">
				<Button href={`/requisitions/${data.requisition.id}`} variant="outline" class="gap-1">
					<Eye class="h-4 w-4" />
					View Requisition
				</Button>
			</div>
		</div>

		<!-- Discrepancy Alert -->
		{#if hasDiscrepancies()}
			<Alert variant="destructive">
				<AlertTriangle class="h-4 w-4" />
				<AlertTitle>Attention Required</AlertTitle>
				<AlertDescription>
					This timesheet has an issue that needs your review before approval.
					Check the Discrepancies tab for details.
				</AlertDescription>
			</Alert>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Main Content -->
			<div class="md:col-span-2 space-y-6">
				<!-- Timesheet Info -->
				<Card>
					<CardHeader>
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div>
								<CardTitle>{data?.requisition.discipline.name} <span class="text-muted-foreground text-xs">Req#: {data?.requisition.id}</span></CardTitle>
								<CardDescription
									>{data?.timesheet?.candidate?.firstName}
									{data?.timesheet?.candidate?.lastName}</CardDescription
								>
							</div>
						</div>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Timesheet Summary -->
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
							<div class="p-3 bg-gray-50 rounded-lg">
								<p class="text-sm text-gray-600">Total Hours</p>
								<p class="text-xl font-bold">{data?.timesheet?.totalHoursWorked}</p>
							</div>
							<div class="p-3 bg-gray-50 rounded-lg">
								<p class="text-sm text-gray-600">Hourly Rate</p>
								<p class="text-xl font-bold">${data?.timesheet?.hourlyRate}</p>
							</div>
							<div class="p-3 bg-gray-50 rounded-lg">
								<p class="text-sm text-gray-600">Est. Cost</p>
								<p class="text-xl font-bold">${getCostEstimate()}</p>
							</div>
						</div>

						<Separator />

						<!-- Candidate Information -->
						<div class="flex items-start gap-4">
							<div class="bg-blue-100 rounded-full p-2.5">
								<User class="h-5 w-5 text-blue-700" />
							</div>
							<div>
								<h3 class="font-medium">Candidate Information</h3>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
									<div>
										<p class="text-xs text-gray-600">Name</p>
										<p class="text-sm whitespace-pre-line">
											{data?.timesheet?.candidate?.firstName}
											{data?.timesheet?.candidate?.lastName || 'No Name Provided'}
										</p>
									</div>
									<div>
										<p class="text-xs text-gray-600">Email</p>
										<p class="text-sm whitespace-pre-line truncate">
											{data?.timesheet?.candidate?.email || 'No email provided'}
										</p>
									</div>
									<div>
										<p class="text-xs text-gray-600">Position</p>
										<p class="text-sm whitespace-pre-line">{data?.requisition.title}</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Tabs for Hours and Discrepancies -->
				<Tabs bind:value={activeTab} class="w-full">
					<TabsList class="grid grid-cols-2 w-full">
						<TabsTrigger value="hours">Hours Detail</TabsTrigger>
						<TabsTrigger value="discrepancies" class="relative">
							Discrepancies
						</TabsTrigger>
					</TabsList>

					<TabsContent value="hours" class="space-y-4 pt-4">
						<Card>
							<CardHeader>
								<CardTitle>Hours Detail</CardTitle>
								<CardDescription>Breakdown of hours submitted by the candidate</CardDescription>
							</CardHeader>

							<CardContent>
								<div class="divide-y">
									<div class="py-2 grid grid-cols-12 text-sm font-medium text-gray-600">
										<div class="col-span-4">Day</div>
										<div class="col-span-3">Time</div>
										<div class="col-span-3">Scheduled Time</div>
										<div class="col-span-2 text-right">Hours</div>
									</div>
									{#each data?.timesheet?.hoursRaw || [] as entry}
										{@const recurrenceDay = data?.recurrenceDays.find(
											(day) => day.date === entry.date
										)}
										<div class="py-3 grid grid-cols-12 items-center">
											<div class="col-span-4">
												<p class="font-medium">
													{entry.date}
												</p>
											</div>
											<div class="col-span-3">
												<p class="text-sm text-gray-600">
													{format(entry.startTime, 'hh:mm a')} -{' '}
													{format(entry.endTime, 'hh:mm a')}
												</p>
											</div>
											<div class="col-span-3">
												<p class="text-sm text-gray-600">
													{format(recurrenceDay?.dayStart, 'hh:mm a')} - {format(
														recurrenceDay.dayEnd,
														'hh:mm a'
													)}
												</p>
											</div>
											<div class="col-span-2 text-right">
												<p class="font-semibold">{entry.hours} hrs</p>
											</div>
										</div>
									{/each}
									<div class="py-3 grid grid-cols-12 items-center bg-gray-50">
										<div class="col-span-9 font-bold">Total</div>
										<div class="col-span-3 text-right font-bold">
											{data?.timesheet?.totalHoursWorked} hrs
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="discrepancies" class="space-y-4 pt-4">
						<Card>
							<CardHeader>
								<CardTitle>Timesheet Discrepancies</CardTitle>
								<CardDescription>Issues that need to be resolved before approval</CardDescription>
							</CardHeader>

							<CardContent>
								{#if hasDiscrepancies()}
								<div class="p-4 border rounded-lg flex gap-3">
    									<div class="mt-0.5">
    										<AlertCircle class="h-5 w-5 text-amber-600" />
    									</div>
    									<div class="flex-1">
    										<p class="mt-2">{data?.timesheet?.discrepancyNote}</p>
    									</div>
    								</div>
								{:else}
									<div class="p-8 text-center">
										<CheckCircle2 class="h-12 w-12 text-green-500 mx-auto mb-3" />
										<h3 class="text-lg font-medium">No Discrepancies Found</h3>
										<p class="text-gray-600 mt-1">
											This timesheet has no issues and is ready for review.
										</p>
									</div>
								{/if}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Approval Actions -->
				{#if data?.timesheet?.status !== 'APPROVED'}
					<Card>
						<CardHeader>
							<CardTitle>Timesheet Approval</CardTitle>
							<CardDescription>Review and approve this timesheet</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<p class="text-sm text-gray-600">
								By approving this timesheet, you confirm that the hours and work details are
								accurate.
							</p>

							<div class="space-y-2">
								<Button
									class="w-full bg-green-700 hover:bg-green-800 gap-2"
									on:click={() => (approvalDialogOpen = true)}
									disabled={hasDiscrepancies()}
								>
									<CheckCircle2 class="h-4 w-4" />
									<span>Approve Timesheet</span>
								</Button>

								<Button
									variant="outline"
									class="w-full border-red-200 text-red-700 hover:bg-red-50 gap-2"
									on:click={() => (rejectionDialogOpen = true)}
									disabled={data.timesheet?.status === 'APPROVED'}
								>
									<X class="h-4 w-4" />
									<span>Reject Timesheet</span>
								</Button>
							</div>

							{#if hasDiscrepancies()}
								<Alert variant="default" class="mt-3">
									<AlertCircle class="h-4 w-4" />
									<AlertDescription>
										{#if data.timesheet?.status !== 'APPROVED'}
											{#if hasDiscrepancies()}
												This timesheet has unresolved discrepancies.
											{:else}
												This timesheet is currently under review
											{/if}
										{:else}
											This timesheet has been approved.
										{/if}
									</AlertDescription>
								</Alert>
							{/if}
						</CardContent>
					</Card>
				{:else}
					<Card>
						<CardHeader>
							<CardTitle>Approval Status</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="p-4 bg-green-50 rounded-lg flex items-start gap-3">
								<CheckCircle2 class="h-5 w-5 text-green-600 mt-0.5" />
								<div>
									<p class="font-medium text-green-800">Timesheet Approved</p>
									<p class="text-sm text-green-700">
										This timesheet was approved on {format(
											parseISO(data?.timesheet?.updatedAt.toISOString()),
											'MMM d, yyyy'
										)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	</section>
{/if}

<!-- Rejection Dialog -->
<Dialog bind:open={rejectionDialogOpen}>
  <DialogContent>
    <form method="POST" action="?/rejectTimesheet" use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          rejectionDialogOpen = false;
          rejectionNote = ''; // Reset the note
          window.location.reload();
        }
      };
    }}>
      <DialogHeader>
        <DialogTitle>Reject Timesheet</DialogTitle>
        <DialogDescription>
          Please provide a reason for rejecting this timesheet. This will be sent to the candidate so they can correct the issues.
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <Label for="discrepancyNote" class="text-sm font-medium">
          Reason for Rejection <span class="text-red-500">*</span>
        </Label>
        <Textarea
          id="discrepancyNote"
          name="discrepancyNote"
          bind:value={rejectionNote}
          placeholder="Explain what needs to be corrected (e.g., 'Hours worked on Jan 8 don't match scheduled shift time')"
          class="mt-2 min-h-[100px]"
          required
        />
        <p class="text-xs text-gray-500 mt-1">
          Be specific so the candidate knows what to fix.
        </p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          on:click={() => {
            rejectionDialogOpen = false;
            rejectionNote = '';
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={!rejectionNote.trim()}
        >
          Reject Timesheet
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

<!-- Approval Dialog -->
<Dialog bind:open={approvalDialogOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Approve Timesheet</DialogTitle>
			<DialogDescription>
				Approving this timesheet will confirm that the hours and work details are accurate.
			</DialogDescription>
		</DialogHeader>

		<DialogFooter class="mt-4">
			<form method="POST" action="?/approveTimesheet" use:enhance>
				<Button type="button" variant="outline" on:click={() => (approvalDialogOpen = false)}>
					Cancel
				</Button>
				<Button
					type="submit"
					variant="default"
					class="bg-green-500 hover:bg-green-600 text-white"
					on:click={() => (approvalDialogOpen = false)}
				>
					Approve Timesheet
				</Button>
			</form>
		</DialogFooter>
	</DialogContent>
</Dialog>
