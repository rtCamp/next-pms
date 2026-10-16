<script setup lang="ts">
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { provideUnsavedChanges } from "@/composables/useUnsavedChanges";
import TimesheetHeader from "./TimesheetHeader.vue";
import { provideTimesheetDialogs } from "./useTimesheetDialogs";

defineOptions({ inheritAttrs: false });

provideTimesheetDialogs();
const unsavedChanges = provideUnsavedChanges();
</script>

<template>
  <TimesheetHeader />
  <slot />
  <UnsavedChangesDialog
    :open="unsavedChanges.dialogOpen.value"
    @keep-editing="unsavedChanges.keepEditing()"
    @discard="unsavedChanges.discardChanges()"
    @save="unsavedChanges.saveChanges()"
  />
</template>
