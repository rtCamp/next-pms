<script setup lang="ts">
import { Button, FileUploader, toast } from "frappe-ui";
import { errorMessage } from "@/utils/errors";

defineProps<{ doctype: string; docname: string }>();
const emit = defineEmits<{ uploaded: [] }>();

function onFailure(error: unknown) {
  toast.error(
    error instanceof Error && error.message
      ? errorMessage(error)
      : "Failed to upload document",
  );
}
</script>

<template>
  <FileUploader
    :doctype="doctype"
    :docname="docname"
    :private="true"
    @success="emit('uploaded')"
    @failure="onFailure"
  >
    <template #default="{ uploading, openFileSelector }">
      <Button
        variant="ghost"
        icon="lucide-plus"
        label="Add document"
        :loading="uploading"
        :disabled="uploading"
        @click="openFileSelector()"
      />
    </template>
  </FileUploader>
</template>
