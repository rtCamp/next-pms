<script setup lang="ts">
import TimesheetLayout from "@/pages/timesheet/TimesheetLayout.vue";
import TeamTimesheetFilters from "./TeamTimesheetFilters.vue";
import TeamTimesheetGrid from "./TeamTimesheetGrid.vue";
import { provideTeamTimesheet } from "./useTeamTimesheet";

defineOptions({ inheritAttrs: false });

provideTeamTimesheet();
</script>

<template>
  <TimesheetLayout pick-employee>
    <div class="relative flex min-h-0 w-full flex-1 flex-col px-5 py-3.5">
      <TeamTimesheetFilters />
      <TeamTimesheetGrid />
    </div>
  </TimesheetLayout>
</template>
