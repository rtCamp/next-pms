<script setup lang="ts">
import { AddTimeDialog } from "@/components/AddTime";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { provideUnsavedChanges } from "@/composables/useUnsavedChanges";
import AddLeaveDialog from "./AddLeaveDialog.vue";
import SubmitApprovalDialog from "./SubmitApprovalDialog.vue";
import TimesheetHeader from "./TimesheetHeader.vue";
import { provideTimesheetDialogs } from "./useTimesheetDialogs";

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    /** The dialogs log time and time off for a picked employee (team and project pages). */
    pickEmployee?: boolean;
  }>(),
  { pickEmployee: false },
);

const dialogs = provideTimesheetDialogs();
const unsavedChanges = provideUnsavedChanges();
</script>

<template>
  <TimesheetHeader />
  <slot />
  <AddTimeDialog
    v-model:open="dialogs.state.addTime.open"
    :prefill="dialogs.state.addTime.prefill"
    :pick-employee="pickEmployee"
  />
  <AddLeaveDialog
    v-model:open="dialogs.state.addLeave.open"
    :pick-employee="pickEmployee"
  />
  <SubmitApprovalDialog
    v-model:open="dialogs.state.submitApproval.open"
    :week="dialogs.state.submitApproval.week"
  />
  <UnsavedChangesDialog
    :open="unsavedChanges.dialogOpen.value"
    @keep-editing="unsavedChanges.keepEditing()"
    @discard="unsavedChanges.discardChanges()"
    @save="unsavedChanges.saveChanges()"
  />
</template>
