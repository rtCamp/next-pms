<script setup lang="ts">
import { Button } from "frappe-ui";

defineProps<{
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isReplying: boolean;
  isUpdating: boolean;
}>();

const emit = defineEmits<{ reply: []; edit: []; delete: [] }>();
</script>

<template>
  <div
    v-if="canReply || canEdit || canDelete"
    class="flex flex-wrap items-center"
  >
    <Button
      v-if="canReply"
      variant="ghost"
      size="sm"
      label="Reply"
      icon-left="lucide-reply"
      :aria-expanded="isReplying"
      :disabled="isUpdating"
      @click="emit('reply')"
    />
    <span
      v-if="canReply && (canEdit || canDelete)"
      class="mx-1 h-4 w-0 border-l border-outline-gray-3"
      aria-hidden="true"
    />
    <Button
      v-if="canEdit"
      variant="ghost"
      size="sm"
      label="Edit"
      icon-left="lucide-pencil"
      :disabled="isUpdating"
      @click="emit('edit')"
    />
    <span
      v-if="canEdit && canDelete"
      class="mx-1 h-4 w-0 border-l border-outline-gray-3"
      aria-hidden="true"
    />
    <Button
      v-if="canDelete"
      variant="ghost"
      size="sm"
      label="Delete"
      icon-left="lucide-trash-2"
      :disabled="isUpdating"
      @click="emit('delete')"
    />
  </div>
</template>
