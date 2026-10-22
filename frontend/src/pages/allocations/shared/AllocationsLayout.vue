<script setup lang="ts">
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { provideUnsavedChanges } from "@/composables/useUnsavedChanges";
import AllocationsHeader from "./AllocationsHeader.vue";
import type { AllocationsView } from "./constants";
import { provideAllocationDialogs } from "./useAllocationDialogs";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /** Which page the layout wraps; the dialogs order their fields by it. */
  view: AllocationsView;
}>();

const unsavedChanges = provideUnsavedChanges();
provideAllocationDialogs(props.view);
</script>

<template>
  <AllocationsHeader />
  <slot />
  <UnsavedChangesDialog
    :open="unsavedChanges.dialogOpen.value"
    @keep-editing="unsavedChanges.keepEditing()"
    @discard="unsavedChanges.discardChanges()"
    @save="unsavedChanges.saveChanges()"
  />
</template>
