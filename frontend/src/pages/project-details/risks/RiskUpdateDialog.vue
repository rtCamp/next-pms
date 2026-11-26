<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { Button, Dialog, ErrorMessage, FormLabel, Select } from "frappe-ui";
import RichTextEditor from "@/pages/project-details/RichTextEditor.vue";
import PriorityIcon from "@/pages/project-details/shared/PriorityIcon.vue";
import {
  isPriorityLevel,
  PRIORITY_INK,
} from "@/pages/project-details/shared/priority";
import { RISK_LEVELS, RISK_STATUSES } from "./constants";
import { riskUpdateForm, validateRiskUpdateForm } from "./risks";
import RiskStatusDot from "./RiskStatusDot.vue";
import type { RiskUpdateForm } from "./types";
import type { RiskDetailState } from "./useRiskDetail";

const props = defineProps<{ detail: RiskDetailState }>();

const open = computed({
  get: () => props.detail.updateDialogOpen.value,
  set: (value) => {
    if (!value) props.detail.closeUpdateDialog();
  },
});
const isEdit = computed(() => props.detail.editingUpdate.value !== null);
const saving = computed(() => props.detail.savingUpdate.value);

const form = reactive<RiskUpdateForm>({ status: "", risk_level: "", note: "" });
const errors = reactive<Partial<Record<"note", string>>>({});

watch(open, (isOpen) => {
  const risk = props.detail.risk.value;
  if (!isOpen || !risk) return;
  Object.assign(form, riskUpdateForm(risk, props.detail.editingUpdate.value));
  delete errors.note;
});
watch(
  () => form.note,
  () => delete errors.note,
);

const STATUS_OPTIONS = RISK_STATUSES.map((status) => ({
  label: status,
  value: status,
}));
const LEVEL_OPTIONS = RISK_LEVELS.map((level) => ({
  label: `${level} risk`,
  value: level,
}));

function levelInk(level: unknown) {
  return isPriorityLevel(level) ? PRIORITY_INK[level] : "";
}

async function submit() {
  Object.assign(errors, validateRiskUpdateForm(form));
  if (errors.note) return;
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
        :options="STATUS_OPTIONS"
        placeholder="Select status"
      >
        <template #item-prefix="{ item }">
          <RiskStatusDot :status="String(item.value)" />
        </template>
      </Select>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-model="form.risk_level"
        label="Risk"
        size="md"
        variant="outline"
        :options="LEVEL_OPTIONS"
        placeholder="Select risk level"
      >
        <template #item-prefix="{ item }">
          <PriorityIcon
            :level="String(item.value)"
            :class="levelInk(item.value)"
          />
        </template>
      </Select>
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
        :disabled="saving"
        @click="submit"
      />
    </template>
  </Dialog>
</template>
