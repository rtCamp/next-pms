<script setup lang="ts">
import { Button, PageHeaderBase } from "frappe-ui";
import TimesheetBreadcrumbs from "./TimesheetBreadcrumbs.vue";
import { useTimesheetDialogs } from "./useTimesheetDialogs";

defineProps<{ canAddTime: boolean }>();

const dialogs = useTimesheetDialogs();

const canAddLeave =
  window.boot?.user?.can_create?.includes("Leave Application") ?? false;
</script>

<template>
  <PageHeaderBase class="z-10 border-b border-outline-gray-1 bg-surface-base">
    <div class="flex h-14 items-center justify-between gap-2 px-3 py-2">
      <TimesheetBreadcrumbs />
      <div class="flex gap-2">
        <Button
          v-if="canAddLeave"
          label="Add time-off"
          icon-left="lucide-calendar-x-2"
          @click="dialogs.openAddLeave()"
        />
        <Button
          v-if="canAddTime"
          variant="solid"
          label="Add time"
          icon-left="lucide-plus"
          @click="dialogs.openAddTime()"
        />
      </div>
    </div>
  </PageHeaderBase>
</template>
