<script lang="ts">
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Separator } from "$lib/components/ui/separator";
  import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import {
    Calendar, Clock, FileText, CheckCircle2, X,
    AlertCircle, ArrowLeft, Printer, Download, User,
    AlertTriangle, Bookmark, Info, HelpCircle
  } from "lucide-svelte";
  import { format, parseISO, addDays } from 'date-fns';
	import { cn } from "$lib/utils";
	import type { PageData } from "./$types";
	import { enhance } from "$app/forms";

	export let data: PageData

	$: console.log({data})

  // State variables
  let rejectionDialogOpen = false;
  let rejectionReason = "";
  let activeTab = "hours";

  // Destructure dummy data

  // Format dates for display
  const weekBeginDate = parseISO(new Date(data?.timesheet?.weekBeginDate || new Date() as Date).toISOString());
  const weekEndDate = addDays(weekBeginDate, 6);
  const formattedWeekRange = `${format(weekBeginDate, 'MMM d')} - ${format(weekEndDate, 'MMM d, yyyy')}`;

  // Get status badge for timesheet
  function getTimesheetStatusBadge() {
    if (data?.timesheet?.validated && !data?.timesheet?.awaitingClientSignature) {
      return { variant: "success", text: "Approved", icon: CheckCircle2 };
    } else if (data?.timesheet?.awaitingClientSignature) {
      return { variant: "warning", text: "Awaiting Approval", icon: AlertCircle };
    } else {
      return { variant: "secondary", text: "Draft", icon: FileText };
    }
  }

  function formatTimeRange(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';

    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes || '00'} ${ampm}`;
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }

  function getCostEstimate() {
    const hourlyRate = data?.timesheet?.candidateRateBase || 0;
    const hours = parseFloat(data?.timesheet?.totalHoursWorked || '0');
    return (hourlyRate * hours).toFixed(2);
  }

  function getDiscrepancyIcon(severity) {
    switch(severity) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertCircle;
      case 'info': return Info;
      default: return HelpCircle;
    }
  }

  function getDiscrepancyColor(severity) {
    switch(severity) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  function getDiscrepancyBadgeColor(severity) {
    switch(severity) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function hasDiscrepancies() {
    return data?.discrepancies && data.discrepancies.length > 0;
  }

  // Dummy action functions
  function handleApproveTimesheet() {
    alert('Timesheet approved!');
    // dummyData.timesheet.awaitingClientSignature = false;
  }

  function handleRejectTimesheet() {
    alert(`Timesheet rejected with reason: ${rejectionReason}`);
    rejectionDialogOpen = false;
    rejectionReason = "";
  }

  const timesheetSeverityMap= {
   	HOURS_MISMATCH: "warning",
	MISSING_RATE: "info",
	INVALID_HOURS: "warning",
	// VALIDATION_MISSING = 'VALIDATION_MISSING',
	// SIGNATURE_MISSING = 'SIGNATURE_MISSING',
	UNAUTHORIZED_WORKDAY: "error"
  }

  const statusBadge = getTimesheetStatusBadge();
</script>

<section class="container mx-auto px-4 py-6 space-y-6">

  <div>
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-2xl font-bold">Timesheet Review</h1>
      <Badge class={
          cn(
            data?.timesheet?.status === 'PENDING' && 'bg-yellow-300 hover:bg-yellow-400',
          data?.timesheet?.status === 'DISCREPANCY' && 'bg-orange-400 hover:bg-bg-orange-500',
          data?.timesheet?.status === 'APPROVED' && 'bg-green-400 hover:bg-green-600',
          data?.timesheet?.status === 'VOID' && 'bg-gray-200 hover:bg-gray-300',
          data?.timesheet?.status === 'REJECTED' && 'bg-red-500 hover:bg-red-500'
          )
          } value={data?.timesheet?.status}>
        <svelte:component this={statusBadge.icon} class="h-3 w-3" />
      </Badge>

      <!-- {#if hasDiscrepancies()}
        <Badge variant="outline" class="bg-amber-50 text-amber-800 border-amber-200 gap-1">
          <AlertTriangle class="h-3 w-3" />
          {discrepancies.length} Issue{discrepancies.length > 1 ? 's' : ''}
        </Badge>
      {/if} -->
    </div>
    <p class="text-gray-600 flex items-center mt-1">
      <Calendar class="h-4 w-4 mr-1" />
      Week of {formattedWeekRange}
    </p>
  </div>

  <!-- Discrepancy Alert -->
  {#if hasDiscrepancies()}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Attention Required</AlertTitle>
      <AlertDescription>
        This timesheet has {data?.discrepancies.length} issue{data?.discrepancies.length > 1 ? 's' : ''} that need{data?.discrepancies.length === 1 ? 's' : ''} your review
        before approval. Check the Discrepancies tab for details.
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
              <CardTitle>{data?.requisition.title}</CardTitle>
              <CardDescription>{data?.timesheet?.candidate?.firstName} {data?.timesheet?.candidate?.lastName}</CardDescription>
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
              <p class="text-xl font-bold">${data?.timesheet?.candidateRateBase}</p>
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
                  <p class="text-sm whitespace-pre-line">{data?.timesheet?.candidate?.firstName} {data?.timesheet?.candidate?.lastName || "No Name Provided"}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-600">Email</p>
                  <p class="text-sm whitespace-pre-line">{data?.timesheet?.candidate?.email || 'No email provided'}</p>
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
      <Tabs bind:selected={activeTab} class="w-full">
        <TabsList class="grid grid-cols-2 w-full">
          <TabsTrigger value="hours">Hours Detail</TabsTrigger>
          <TabsTrigger value="discrepancies" class="relative">
            Discrepancies
            {#if hasDiscrepancies()}
              <span class="absolute top-0.5 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-800">
                {data?.discrepancies.length}
              </span>
            {/if}
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
                  <div class="col-span-5">Day</div>
                  <div class="col-span-4">Time</div>
                  <div class="col-span-3 text-right">Hours</div>
                </div>
                {#each data?.timesheet?.hoursRaw || [] as entry}
                  <div class="py-3 grid grid-cols-12 items-center">
                    <div class="col-span-5">
                      <p class="font-medium">{format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}</p>
                    </div>
                    <div class="col-span-4">
                      <p class="text-sm text-gray-600">
                        {formatTimeRange(entry.startTime, entry.endTime)}
                      </p>
                    </div>
                    <div class="col-span-3 text-right">
                      <p class="font-semibold">{entry.hours} hrs</p>
                    </div>
                  </div>
                {/each}
                <div class="py-3 grid grid-cols-12 items-center bg-gray-50">
                  <div class="col-span-9 font-bold">Total</div>
                  <div class="col-span-3 text-right font-bold">{data?.timesheet?.totalHoursWorked} hrs</div>
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
                <div class="space-y-4">
                  {#each data.discrepancies as discrepancy}
                    <div class="p-4 border rounded-lg flex gap-3">
                      <div class="mt-0.5">
                        <svelte:component this={getDiscrepancyIcon(timesheetSeverityMap[discrepancy.discrepancyType])} class={`h-5 w-5 ${getDiscrepancyColor(timesheetSeverityMap[discrepancy.discrepancyType])}`} />
                      </div>
                      <div class="flex-1">
                        <div class="flex items-start justify-between">
                          <Badge class={getDiscrepancyBadgeColor(timesheetSeverityMap[discrepancy.discrepancyType])} value={discrepancy.discrepancyType}/>
                        </div>
                        <p class="mt-2">{discrepancy.details}</p>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="p-8 text-center">
                  <CheckCircle2 class="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 class="text-lg font-medium">No Discrepancies Found</h3>
                  <p class="text-gray-600 mt-1">This timesheet has no issues and is ready for review.</p>
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
      {#if data?.timesheet?.awaitingClientSignature}
        <Card>
          <CardHeader>
            <CardTitle>Timesheet Approval</CardTitle>
            <CardDescription>Review and approve this timesheet</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <p class="text-sm text-gray-600">
              By approving this timesheet, you confirm that the hours and work details are accurate.
            </p>

            <div class="space-y-2">
              <Button
                class="w-full bg-green-700 hover:bg-green-800 gap-2"
                on:click={handleApproveTimesheet}
                disabled={hasDiscrepancies()}
              >
                <CheckCircle2 class="h-4 w-4" />
                <span>Approve Timesheet</span>
              </Button>

              <Button
                variant="outline"
                class="w-full border-red-200 text-red-700 hover:bg-red-50 gap-2"
                on:click={() => rejectionDialogOpen = true}
              >
                <X class="h-4 w-4" />
                <span>Reject Timesheet</span>
              </Button>
            </div>

            {#if hasDiscrepancies()}
              <Alert variant="warning" class="mt-3">
                <AlertCircle class="h-4 w-4" />
                <AlertDescription>
                  Please resolve all discrepancies before approving this timesheet.
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
                  This timesheet was approved on {format(parseISO(new Date(data?.timesheet?.updatedAt).toISOString()), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Export Options -->
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <Button variant="outline" class="w-full gap-2">
            <Download class="h-4 w-4" />
            <span>Export as PDF</span>
          </Button>

          <Button variant="outline" class="w-full gap-2">
            <Printer class="h-4 w-4" />
            <span>Print Timesheet</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</section>

<!-- Rejection Dialog -->
<Dialog bind:open={rejectionDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Reject Timesheet</DialogTitle>
      <DialogDescription>
        Please provide a reason for rejecting this timesheet. This will be sent to the candidate.
      </DialogDescription>
    </DialogHeader>

    <div class="space-y-4">
      <Textarea
        bind:value={rejectionReason}
        placeholder="Please explain why this timesheet is being rejected..."
        rows={4}
        required
      />
    </div>

    <DialogFooter class="mt-4">
        <form method="POST" action="?/rejectTimesheet" use:enhance>
            <Button type="button" variant="outline" on:click={() => rejectionDialogOpen = false}>
                Cancel
            </Button>
            <Button type="submit" variant="destructive" on:click={() => rejectionDialogOpen = false}>
                Reject Timesheet
            </Button>
        </form>
    </DialogFooter>
  </DialogContent>
</Dialog>
