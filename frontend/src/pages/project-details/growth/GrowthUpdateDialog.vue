<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import {
  Button,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  TextInput,
} from "frappe-ui";
import RichTextEditor from "@/pages/project-details/RichTextEditor.vue";
import { CLIENT_PRIORITIES } from "./constants";
import { growthUpdateForm, validateGrowthUpdateForm } from "./growth";
import type { GrowthUpdateErrors, GrowthUpdateForm } from "./types";
import { useGrowth } from "./useGrowth";
import type { GrowthDetailState } from "./useGrowthDetail";

const props = defineProps<{ detail: GrowthDetailState }>();

const { statuses, closedStatuses, mastersLoading, isClosing } = useGrowth();

const open = computed({
  get: () => props.detail.updateDialogOpen.value,
  set: (value) => {
    if (!value) props.detail.closeUpdateDialog();
  },
});
const isEdit = computed(() => props.detail.editingUpdate.value !== null);
const saving = computed(() => props.detail.savingUpdate.value);

const form = reactive<GrowthUpdateForm>({
  status: "",
  closed_status: "",
  client_priority: "",
  billable_outcome: "",
  note: "",
});
const errors = reactive<GrowthUpdateErrors>({});
const closing = computed(() => isClosing(form.status));

function clearErrors() {
  for (const key of Object.keys(errors))
    delete errors[key as keyof GrowthUpdateErrors];
}

watch(open, (isOpen) => {
  const initiative = props.detail.initiative.value;
  if (!isOpen || !initiative) return;
  Object.assign(
    form,
    growthUpdateForm(initiative, props.detail.editingUpdate.value),
  );
  clearErrors();
});
watch(
  () => form.status,
  () => {
    if (!closing.value) form.closed_status = "";
  },
);
watch(
  () => [form.closed_status, form.billable_outcome, form.note],
  clearErrors,
);

const statusOptions = computed(() =>
  statuses.value.map((status) => ({ label: status.name, value: status.name })),
);
const closedStatusOptions = computed(() =>
  closedStatuses.value.map((status) => ({
    label: status.name,
    value: status.name,
  })),
);
const PRIORITY_OPTIONS = CLIENT_PRIORITIES.map((priority) => ({
  label: priority,
  value: priority,
}));

async function submit() {
  Object.assign(errors, validateGrowthUpdateForm(form, closing.value));
  if (Object.keys(errors).length) return;
  if (await props.detail.saveUpdate({ ...form }))
    props.detail.closeUpdateDialog();
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="isEdit ? 'Edit update' : 'Add update'"
    size="md"
    position="top"
    :padding-top="120"
    :dismissible="!saving"
  >
    <form class="-mt-2 space-y-4" novalidate @submit.prevent="submit">
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-model="form.status"
        label="Status"
        size="md"
        variant="outline"
        :options="statusOptions"
        placeholder="Select status"
      />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-if="closing"
        v-model="form.closed_status"
        label="Closed status"
        required
        :error="errors.closed_status"
        size="md"
        variant="outline"
        :options="closedStatusOptions"
        placeholder="Select closed status"
      />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-model="form.client_priority"
        label="Priority for Client"
        size="md"
        variant="outline"
        :options="PRIORITY_OPTIONS"
        placeholder="Select priority"
      />
      <TextInput
        v-model="form.billable_outcome"
        label="Billable outcome"
        type="number"
        min="0"
        size="md"
        variant="outline"
        placeholder="0"
        :error="errors.billable_outcome"
      />
      <div class="flex flex-col gap-1.5">
        <FormLabel label="Note" required />
        <RichTextEditor
          v-model="form.note"
          label="Note"
          placeholder="Add a note..."
          content-class="h-24 overflow-auto"
          :disabled="saving"
        />
        <ErrorMessage v-if="errors.note" :message="errors.note" />
      </div>
    </form>

    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        :label="isEdit ? 'Save update' : 'Add update'"
        :loading="saving"
        :disabled="saving || mastersLoading"
        @click="submit"
      />
    </template>
  </Dialog>
</template>
