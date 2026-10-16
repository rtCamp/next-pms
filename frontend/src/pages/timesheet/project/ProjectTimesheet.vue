<script setup lang="ts">
import TimesheetLayout from "@/pages/timesheet/TimesheetLayout.vue";
import ProjectTimesheetFilters from "./ProjectTimesheetFilters.vue";
import ProjectTimesheetGrid from "./ProjectTimesheetGrid.vue";
import { provideProjectTimesheet } from "./useProjectTimesheet";

defineOptions({ inheritAttrs: false });

provideProjectTimesheet();
</script>

<template>
  <TimesheetLayout pick-employee>
    <div class="relative flex min-h-0 w-full flex-1 flex-col px-5 py-3.5">
      <ProjectTimesheetFilters />
      <ProjectTimesheetGrid />
    </div>
  </TimesheetLayout>
</template>
