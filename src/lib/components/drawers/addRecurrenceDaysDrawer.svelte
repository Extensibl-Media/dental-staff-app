<!-- RecurrenceDrawer.svelte -->
<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet/index.js';
  import { Button } from '$lib/components/ui/button/index.js';

  import Input from '$lib/components/ui/input/input.svelte';
  import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
  import { sineIn } from 'svelte/easing';
  import { Label } from '../ui/label';
  import { RangeCalendar } from "$lib/components/ui/range-calendar"
  import DatePicker from "../../../routes/(protected)/requisitions/[id]/date-picker.svelte"
  import {
    type DateValue,
    DateFormatter,
    getLocalTimeZone,
  } from "@internationalized/date";
  import type { DateRange } from 'bits-ui';
	import { getTimezoneOffset } from 'date-fns-tz';
  import type { RecurrenceDay, Requisition } from '$lib/server/database/schemas/requisition';
  import { superForm } from 'sveltekit-superforms/client';

  // Props
  export let requisition: Requisition;
  export let company;
  export let form; // From parent

  const { enhance } = superForm(form, {
    onSubmit(input) {
      console.log({input})
    },
   onUpdate({ form }) {
     // Reset form state after successful submission
     if (form.message === 'success') {
       multipleDays = false;
       useSameTimeForAllDates = false;
       selectedRawDate = undefined;
       selectedRawDateRange = undefined;
       sharedTimes = {
         dayStartTime: "",
         dayEndTime: "",
         lunchStartTime: "",
         lunchEndTime: "",
         timezoneOffset: timezoneOffsetString
       };
     }
   },
   onError(err){
     console.error(err)
   }
  });

  // Form state
  let multipleDays = false;
  let useSameTimeForAllDates = false;
  let selectedRawDate: DateValue | undefined;
  let selectedRawDateRange: DateRange | undefined;
  let userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  $: timezoneOffsetString = getTimezoneOffset(userTimeZone) / 60 / 60 / 1000;

  let sharedTimes = {
    dayStartTime: "",
    dayEndTime: "",
    lunchStartTime: "",
    lunchEndTime: "",
    timezoneOffset: timezoneOffsetString
  };

  const df = new DateFormatter("en-US", { dateStyle: "full" });

  // Derived values
  $: operatingHours = company.operatingHours;

  $: formattedDateRange = multipleDays && selectedRawDateRange?.start && selectedRawDateRange?.end
    ? getDatesInRange(
        new Date(df.format(selectedRawDateRange.start.toDate(getLocalTimeZone()))),
        new Date(df.format(selectedRawDateRange.end.toDate(getLocalTimeZone())))
    )
    : selectedRawDate
        ? [new Date(df.format(selectedRawDate.toDate(getLocalTimeZone())))]
        : [];

  $: filteredDates = formattedDateRange.filter(date => !operatingHours[date.getDay()].isClosed);

  $: selectedDateTimes = filteredDates.map(date => ({
    date: date.toISOString(),
    times: useSameTimeForAllDates ? {...sharedTimes} : {
      dayStartTime: "",
      dayEndTime: "",
      lunchStartTime: "",
      lunchEndTime: ""
    }
  }));

  $: finalDateValue = multipleDays
    ? selectedDateTimes.map(createRecurrenceDay)
    : selectedDateTimes[0] ? createRecurrenceDay(selectedDateTimes[0]) : null;


  // Helper functions
  function createRecurrenceDay(entry) {
    return {
      date: entry.date,
      ...entry.times,
      requisitionId: requisition.id,
      timezoneOffset: String(timezoneOffsetString)
    };
  }

  function getDatesInRange(start: Date, end: Date): Date[] {
    const dates = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  $: console.log('Form State:', {
   multipleDays,
   useSameTimeForAllDates,
   sharedTimes
  });

  $: console.log('Date Selection:', {
   selectedRawDate,
   selectedRawDateRange,
   selectedDateTimes
  });

  $: console.log('Final Output:', {
   finalDateValue,
   requisition: requisition.id,
   timezoneOffsetString,
   operatingHours: Object.keys(operatingHours).filter(day => operatingHours[day].isClosed)
  });

  $: console.log('Raw date range:', {
      start: selectedRawDateRange?.start?.toDate(getLocalTimeZone()),
      end: selectedRawDateRange?.end?.toDate(getLocalTimeZone())
  });
</script>

<Sheet.Root>
 <Sheet.Trigger asChild let:builder>
   <Button builders={[builder]} class="bg-blue-800 hover:bg-blue-900 mb-4">
     Add Recurrence Days
   </Button>
 </Sheet.Trigger>

 <Sheet.Content side="right" class="overflow-scroll flex flex-col">
   <Sheet.Header>
     <Sheet.Title>Add Workdays</Sheet.Title>
     <Sheet.Description>Add dates and times for workdays. Dates will respect your hours of operation and closed dates will be excluded.</Sheet.Description>
   </Sheet.Header>

   <div class="flex flex-col flex-1 mt-4 h-full">
     <div>
       <Checkbox bind:checked={multipleDays} name="multipleDays" />
       <Label for="multipleDays">Multiple Days?</Label>
     </div>

     {#if multipleDays}
       <RangeCalendar
         bind:value={selectedRawDateRange}
         class="rounded-md border w-fit"
       />
       {#if filteredDates.length}
         <div class="mt-4">
           <Checkbox bind:checked={useSameTimeForAllDates} name="useSameTime" />
           <Label for="useSameTime">Use same schedule for all days</Label>
         </div>

         {#if useSameTimeForAllDates}
             <p class="mt-4 font-semibold">All Dates:</p>

           <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
               <Label for="shared-day-start">Day Start</Label>
               <Input
                 id="shared-day-start"
                 type="time"
                 value={sharedTimes.dayStartTime}
                 on:input={(e) => sharedTimes.dayStartTime = e.currentTarget.value}
               />
             </div>
             <div class="space-y-2">
               <Label for="shared-day-end">Day End</Label>
               <Input
                 id="shared-day-end"
                 type="time"
                 value={sharedTimes.dayEndTime}
                 on:input={(e) => sharedTimes.dayEndTime = e.currentTarget.value}
               />
             </div>
             <div class="space-y-2">
               <Label for="shared-lunch-start">Lunch Start</Label>
               <Input
                 id="shared-lunch-start"
                 type="time"
                 value={sharedTimes.lunchStartTime}
                 on:input={(e) => sharedTimes.lunchStartTime = e.currentTarget.value}
               />
             </div>
             <div class="space-y-2">
               <Label for="shared-lunch-end">Lunch End</Label>
               <Input
                 id="shared-lunch-end"
                 type="time"
                 value={sharedTimes.lunchEndTime}
                 on:input={(e) => sharedTimes.lunchEndTime = e.currentTarget.value}
               />
             </div>
           </div>
         {:else}
           {#each selectedDateTimes as dateEntry}
             <div class="mt-4">
               <p class="font-semibold">Date: {new Date(dateEntry.date).toLocaleDateString()}</p>
               <div class="grid grid-cols-2 gap-4">
                 <div class="space-y-2">
                   <Label for={`day-start-${dateEntry.date}`}>Day Start</Label>
                   <Input
                     id={`day-start-${dateEntry.date}`}
                     type="time"
                     value={dateEntry.times.dayStartTime}
                     on:input={(e) => dateEntry.times.dayStartTime = e.currentTarget.value}
                   />
                 </div>
                 <div class="space-y-2">
                   <Label for={`day-end-${dateEntry.date}`}>Day End</Label>
                   <Input
                     id={`day-end-${dateEntry.date}`}
                     type="time"
                     value={dateEntry.times.dayEndTime}
                     on:input={(e) => dateEntry.times.dayEndTime = e.currentTarget.value}
                   />
                 </div>
                 <div class="space-y-2">
                   <Label for={`lunch-start-${dateEntry.date}`}>Lunch Start</Label>
                   <Input
                     id={`lunch-start-${dateEntry.date}`}
                     type="time"
                     value={dateEntry.times.lunchStartTime}
                     on:input={(e) => dateEntry.times.lunchStartTime = e.currentTarget.value}
                   />
                 </div>
                 <div class="space-y-2">
                   <Label for={`lunch-end-${dateEntry.date}`}>Lunch End</Label>
                   <Input
                     id={`lunch-end-${dateEntry.date}`}
                     type="time"
                     value={dateEntry.times.lunchEndTime}
                     on:input={(e) => dateEntry.times.lunchEndTime = e.currentTarget.value}
                   />
                 </div>
               </div>
             </div>
           {/each}
         {/if}
       {/if}
     {:else}
       <DatePicker bind:value={selectedRawDate}/>
       {#if selectedRawDate}
         <div class="grid grid-cols-2 gap-4 mt-4">
           <div class="space-y-2">
             <Label for="single-day-start">Day Start</Label>
             <Input
               id="single-day-start"
               type="time"
               value={sharedTimes.dayStartTime}
               on:input={(e) => sharedTimes.dayStartTime = e.currentTarget.value}
             />
           </div>
           <div class="space-y-2">
             <Label for="single-day-end">Day End</Label>
             <Input
               id="single-day-end"
               type="time"
               value={sharedTimes.dayEndTime}
               on:input={(e) => sharedTimes.dayEndTime = e.currentTarget.value}
             />
           </div>
           <div class="space-y-2">
             <Label for="single-lunch-start">Lunch Start</Label>
             <Input
               id="single-lunch-start"
               type="time"
               value={sharedTimes.lunchStartTime}
               on:input={(e) => sharedTimes.lunchStartTime = e.currentTarget.value}
             />
           </div>
           <div class="space-y-2">
             <Label for="single-lunch-end">Lunch End</Label>
             <Input
               id="single-lunch-end"
               type="time"
               value={sharedTimes.lunchEndTime}
               on:input={(e) => sharedTimes.lunchEndTime = e.currentTarget.value}
             />
           </div>
         </div>
       {/if}
     {/if}

     <form
      use:enhance
      method="POST"
      action="?/addRecurrenceDays"
      class="mt-12 pb-4"
     >
      <input type="hidden" name="recurrenceDays" value={JSON.stringify(finalDateValue)} />
      <Sheet.Footer>
        <Sheet.Close asChild let:builder>
          <Button
            builders={[builder]}
            variant="destructive"
            type="button"
            on:click={() => {
              multipleDays = false;
              useSameTimeForAllDates = false;
              selectedRawDate = undefined;
              selectedRawDateRange = undefined;
              sharedTimes = {
                dayStartTime: "",
                dayEndTime: "",
                lunchStartTime: "",
                lunchEndTime: "",
                timezoneOffset: timezoneOffsetString
              };
            }}
          >
            Cancel
          </Button>
        </Sheet.Close>
        <!-- <Sheet.Close asChild let:builder> -->
          <Button  type="submit">Add Days</Button>
        <!-- </Sheet.Close> -->
      </Sheet.Footer>
     </form>
   </div>
 </Sheet.Content>
</Sheet.Root>
<!-- onValueChange={(v) => console.log({start: new Date(df.format(v.start?.toDate(getLocalTimeZone()))), end: new Date(df.format(v.end?.toDate(getLocalTimeZone())))})} -->

<!-- 		isDateUnavailable={(date) => {
		    const dayOfWeek = new Date(df.format(date.toDate(getLocalTimeZone()))).getDay()
			const dayOperatingHours = operatingHours[dayOfWeek];

          const isClosed = dayOperatingHours.isClosed
          return isClosed
		}} -->
