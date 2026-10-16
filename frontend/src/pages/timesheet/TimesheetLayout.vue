<script setup lang="ts">
import TimesheetHeader from "./TimesheetHeader.vue";
import { provideTimesheetDialogs } from "./useTimesheetDialogs";

defineOptions({ inheritAttrs: false });

provideTimesheetDialogs();
</script>

<template>
  <TimesheetHeader />
  <slot />
</template>
