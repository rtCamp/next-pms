<script setup lang="ts">
import TimesheetLayout from "@/pages/timesheet/TimesheetLayout.vue";
import PersonalTimesheetFilters from "./PersonalTimesheetFilters.vue";
import PersonalTimesheetGrid from "./PersonalTimesheetGrid.vue";
import { providePersonalTimesheet } from "./usePersonalTimesheet";

defineOptions({ inheritAttrs: false });

providePersonalTimesheet();
</script>

<template>
  <TimesheetLayout>
    <div class="relative flex min-h-0 w-full flex-1 flex-col px-5 py-3.5">
      <PersonalTimesheetFilters />
      <PersonalTimesheetGrid />
    </div>
  </TimesheetLayout>
</template>
