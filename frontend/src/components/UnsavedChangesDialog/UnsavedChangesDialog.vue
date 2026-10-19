<script setup lang="ts">
import { Button, Dialog } from "frappe-ui";
import type {
  UnsavedChangesDialogEmits,
  UnsavedChangesDialogProps,
} from "./types";

withDefaults(defineProps<UnsavedChangesDialogProps>(), { open: false });

const emit = defineEmits<UnsavedChangesDialogEmits>();

function onOpenChange(open: boolean) {
  emit("update:open", open);
  if (!open) emit("keepEditing");
}
</script>

<template>
  <Dialog
    :open="open"
    title="Save Changes"
    message="You have unsaved changes. Would you like to save them before leaving?"
    position="top"
    :padding-top="120"
    @update:open="onOpenChange"
  >
    <template #actions>
      <div class="flex w-full items-center justify-end gap-2">
        <Button
          variant="ghost"
          label="Discard Changes"
          @click="emit('discard')"
        />
        <Button
          variant="subtle"
          label="Keep Editing"
          @click="emit('keepEditing')"
        />
        <Button variant="solid" label="Save Changes" @click="emit('save')" />
      </div>
    </template>
  </Dialog>
</template>
