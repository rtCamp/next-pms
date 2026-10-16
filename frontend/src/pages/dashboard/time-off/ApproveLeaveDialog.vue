<script setup lang="ts">
import { ref } from "vue";
import { Button, Dialog } from "frappe-ui";
import LeaveSummaryCard from "./LeaveSummaryCard.vue";
import type { EmployeeOnLeave } from "./leaves";

const props = defineProps<{
  leave: EmployeeOnLeave | null;
  /** Resolves `true` once the leave is approved. */
  approve: (name: string) => Promise<boolean>;
}>();

const emit = defineEmits<{ close: [] }>();

const approving = ref(false);

async function submit() {
  if (!props.leave) return;
  approving.value = true;
  const approved = await props.approve(props.leave.name);
  approving.value = false;
  if (approved) emit("close");
}
</script>

<template>
  <Dialog
    :open="leave !== null"
    title="Approve leave request"
    size="lg"
    :dismissible="!approving"
    @update:open="!$event && emit('close')"
  >
    <div v-if="leave" class="flex flex-col gap-4">
      <LeaveSummaryCard :leave="leave" />
      <p class="text-base text-ink-gray-6">
        Approving submits this leave application. It cannot be undone from Next
        PMS.
      </p>
    </div>
    <template #actions>
      <div class="flex w-full justify-end gap-2">
        <Button
          variant="subtle"
          size="md"
          label="Cancel"
          :disabled="approving"
          @click="emit('close')"
        />
        <Button
          variant="solid"
          theme="green"
          size="md"
          label="Approve leave"
          :loading="approving"
          @click="submit"
        />
      </div>
    </template>
  </Dialog>
</template>
