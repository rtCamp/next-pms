<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button, Dialog, Textarea } from "frappe-ui";
import LeaveSummaryCard from "./LeaveSummaryCard.vue";
import type { EmployeeOnLeave } from "./leaves";

const props = defineProps<{
  leave: EmployeeOnLeave | null;
  /** Resolves `true` once the leave is rejected. */
  reject: (leaveId: string, reason: string) => Promise<boolean>;
}>();

const emit = defineEmits<{ close: [] }>();

const reason = ref("");
const touched = ref(false);
const rejecting = ref(false);

const empty = computed(() => reason.value.trim() === "");
const error = computed(() =>
  touched.value && empty.value ? "Rejection reason is required." : undefined,
);

watch(
  () => props.leave,
  () => {
    reason.value = "";
    touched.value = false;
  },
);

async function submit() {
  touched.value = true;
  if (!props.leave || empty.value) return;
  rejecting.value = true;
  const rejected = await props.reject(props.leave.name, reason.value.trim());
  rejecting.value = false;
  if (rejected) emit("close");
}
</script>

<template>
  <Dialog
    :open="leave !== null"
    title="Reject leave request"
    size="lg"
    @update:open="!$event && emit('close')"
  >
    <div v-if="leave" class="flex flex-col gap-4">
      <LeaveSummaryCard :leave="leave" />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Textarea renders a <label> from `label` -->
      <Textarea
        v-model="reason"
        label="Rejection reason"
        required
        variant="outline"
        :rows="4"
        :error="error"
        placeholder="Explain why this leave request is being rejected..."
        @update:model-value="touched = true"
      />
    </div>
    <template #actions>
      <div class="flex w-full justify-end gap-2">
        <Button
          variant="subtle"
          size="md"
          label="Cancel"
          @click="emit('close')"
        />
        <Button
          variant="solid"
          theme="red"
          size="md"
          label="Reject leave"
          :disabled="empty"
          :loading="rejecting"
          @click="submit"
        />
      </div>
    </template>
  </Dialog>
</template>
