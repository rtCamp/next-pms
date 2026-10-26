<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  dayjs,
  ErrorMessage,
  FormLabel,
  Select,
  Spinner,
  TextInput,
  useCall,
} from "frappe-ui";
import RichTextEditor from "@/pages/project-details/RichTextEditor.vue";
import DisabledField from "@/pages/project-details/shared/DisabledField.vue";
import UpdateLogNote from "@/pages/project-details/shared/UpdateLogNote.vue";
import { documentUrl } from "@/pages/project-details/shared/useDocumentWrite";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage, isAbortError } from "@/utils/errors";
import { formatCurrency } from "@/utils/format";
import { CLIENT_PRIORITIES, EDIT_LOG_NOTE, GROWTH_DOCTYPE } from "./constants";
import GrowthOwnerField from "./GrowthOwnerField.vue";
import GrowthPriorityPill from "./GrowthPriorityPill.vue";
import GrowthStatusBadge from "./GrowthStatusBadge.vue";
import { growthForm, validateGrowthForm } from "./growth";
import type { GrowthDoc, GrowthForm, GrowthFormErrors } from "./types";
import { useGrowth } from "./useGrowth";

const growth = useGrowth();
const {
  dialogOpen,
  editingId,
  saving,
  statuses,
  closedStatuses,
  categories,
  mastersLoading,
} = growth;
const { doc: project } = useProjectDetails();

const open = computed({
  get: () => dialogOpen.value,
  set: (value) => (dialogOpen.value = value),
});
const isEdit = computed(() => Boolean(editingId.value));

const existing = useCall<GrowthDoc>({
  url: computed(() => documentUrl(GROWTH_DOCTYPE, editingId.value)),
  immediate: false,
});
/** The initiative being edited, once read for this opening. */
const editingDoc = ref<GrowthDoc | null>(null);
const readError = computed(() =>
  existing.error && !isAbortError(existing.error) ? existing.error : null,
);

const today = () => dayjs().format("YYYY-MM-DD");
const form = reactive<GrowthForm>(growthForm(null, today()));
const errors = reactive<GrowthFormErrors>({});
/** Which button is saving: "Save and create another" keeps the dialog open. */
const submitting = ref<"another" | "close" | null>(null);
const closing = computed(() => growth.isClosing(form.status));

function reset(values: GrowthForm) {
  Object.assign(form, values);
  for (const key of Object.keys(errors))
    delete errors[key as keyof GrowthFormErrors];
}

/** Counts openings, so a read for an earlier one is ignored. */
let openings = 0;

watch(open, async (isOpen) => {
  if (!isOpen) return;
  const opening = ++openings;
  editingDoc.value = null;
  reset(growthForm(null, today()));
  const name = editingId.value;
  if (!name) return;
  const doc = await existing.fetch();
  // A superseded read resolves with the data it had, possibly another initiative's.
  if (opening !== openings || !open.value || existing.error) return;
  if (!doc || doc.name !== name) return;
  editingDoc.value = doc;
  reset(growthForm(doc, today()));
});
watch(
  () => form.status,
  () => {
    if (!closing.value) form.closed_status = "";
  },
);
watch(
  () => [
    form.activity,
    form.status,
    form.closed_status,
    form.ideation_date,
    form.billable_outcome,
  ],
  () => {
    for (const key of Object.keys(errors))
      delete errors[key as keyof GrowthFormErrors];
  },
);

const loadingDoc = computed(
  () => isEdit.value && !editingDoc.value && !readError.value,
);

const category = computed({
  get: () => form.category || null,
  set: (value) => (form.category = value ? String(value) : ""),
});
const categoryOptions = computed(() =>
  categories.value.map((item) => ({ label: item.name, value: item.name })),
);
const statusOptions = computed(() =>
  statuses.value.map((item) => ({ label: item.name, value: item.name })),
);
const closedStatusOptions = computed(() =>
  closedStatuses.value.map((item) => ({ label: item.name, value: item.name })),
);
const PRIORITY_OPTIONS = CLIENT_PRIORITIES.map((priority) => ({
  label: priority,
  value: priority,
}));

const currency = computed(
  () => project.value?.custom_currency || window.boot?.sysdefaults?.currency,
);

const disabled = computed(
  () =>
    submitting.value !== null ||
    mastersLoading.value ||
    loadingDoc.value ||
    Boolean(readError.value),
);

async function submit(another: boolean) {
  Object.assign(errors, validateGrowthForm(form, closing.value));
  if (Object.keys(errors).length || disabled.value) return;
  submitting.value = another ? "another" : "close";
  const saved = await growth.save({ ...form });
  submitting.value = null;
  if (!saved) return;
  if (another) reset(growthForm(null, today()));
  else open.value = false;
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="isEdit ? 'Edit growth initiative' : 'Create growth initiative'"
    size="md"
    position="top"
    :padding-top="120"
    :dismissible="!saving"
  >
    <div v-if="loadingDoc" class="flex justify-center py-8">
      <Spinner class="size-5" />
    </div>
    <ErrorMessage v-else-if="readError" :message="errorMessage(readError)" />
    <form
      v-else
      class="-mt-2 space-y-4"
      novalidate
      @submit.prevent="submit(false)"
    >
      <TextInput
        v-model="form.activity"
        label="Activity"
        required
        :error="errors.activity"
        size="md"
        variant="outline"
        placeholder="Enter activity"
      />
      <Combobox
        v-model="category"
        label="Category"
        size="md"
        variant="outline"
        :options="categoryOptions"
        :loading="mastersLoading"
        open-on-focus
        placeholder="Select category"
      />
      <div class="flex flex-col gap-1.5">
        <FormLabel label="Description" />
        <RichTextEditor
          v-model="form.description"
          label="Description"
          placeholder="Describe the initiative..."
          content-class="h-24 overflow-auto"
          :disabled="saving"
        />
      </div>
      <template v-if="isEdit">
        <DisabledField label="Priority for Client">
          <GrowthPriorityPill
            v-if="editingDoc?.client_priority"
            :priority="editingDoc.client_priority"
          />
          <span v-else>—</span>
        </DisabledField>
        <DisabledField label="Status">
          <span class="text-ink-gray-7">
            <GrowthStatusBadge :status="editingDoc?.status" />
          </span>
        </DisabledField>
        <DisabledField v-if="editingDoc?.closed_status" label="Closed status">
          {{ editingDoc.closed_status }}
        </DisabledField>
        <DisabledField label="Billable outcome">
          {{ formatCurrency(editingDoc?.billable_outcome ?? 0, currency) }}
        </DisabledField>
        <UpdateLogNote :message="EDIT_LOG_NOTE" />
      </template>
      <template v-else>
        <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
        <Select
          v-model="form.client_priority"
          label="Priority for Client"
          size="md"
          variant="outline"
          :options="PRIORITY_OPTIONS"
          placeholder="Select priority"
        />
        <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
        <Select
          v-model="form.status"
          label="Status"
          required
          :error="errors.status"
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
      </template>
      <div class="flex flex-col gap-1.5">
        <FormLabel label="Desired outcome / ROI" />
        <RichTextEditor
          v-model="form.desired_outcome"
          label="Desired outcome / ROI"
          placeholder="Describe the desired outcome..."
          content-class="h-24 overflow-auto"
          :disabled="saving"
        />
      </div>
      <DatePicker
        v-model="form.ideation_date"
        label="Ideation date"
        required
        :error="errors.ideation_date"
        :clearable="false"
        size="md"
        variant="outline"
        placeholder="Ideation date"
      >
        <template #suffix>
          <span class="lucide-calendar size-4 shrink-0" aria-hidden="true" />
        </template>
      </DatePicker>
      <GrowthOwnerField
        v-model="form.activity_owner"
        label="Activity owner"
        placeholder="Select activity owner"
        :enabled="open"
      />
      <GrowthOwnerField
        v-model="form.ideation_owner"
        label="Ideation owner"
        placeholder="Select ideation owner"
        :enabled="open"
      />
      <TextInput
        v-if="!isEdit"
        v-model="form.billable_outcome"
        label="Billable outcome"
        type="number"
        min="0"
        :error="errors.billable_outcome"
        size="md"
        variant="outline"
        placeholder="0"
      />
    </form>

    <template #actions>
      <div class="flex w-full items-center gap-2">
        <Button
          v-if="!isEdit"
          class="w-full"
          label="Save and create another"
          :loading="submitting === 'another'"
          :disabled="disabled"
          @click="submit(true)"
        />
        <Button
          class="w-full"
          variant="solid"
          label="Save"
          :loading="submitting === 'close'"
          :disabled="disabled"
          @click="submit(false)"
        />
      </div>
    </template>
  </Dialog>
</template>
