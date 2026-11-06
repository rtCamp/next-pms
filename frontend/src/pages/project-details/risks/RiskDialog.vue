<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Avatar,
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  Spinner,
  useCall,
  useList,
} from "frappe-ui";
import { useEmployeeLookup } from "@/composables/useEmployeeLookup";
import type { LookupOption } from "@/composables/useRemoteLookup";
import RichTextEditor from "@/pages/project-details/RichTextEditor.vue";
import DisabledField from "@/pages/project-details/shared/DisabledField.vue";
import PriorityIcon from "@/pages/project-details/shared/PriorityIcon.vue";
import { toEmployeeUserOptions } from "@/pages/project-details/shared/permissions";
import {
  PRIORITY_INK,
  isPriorityLevel,
} from "@/pages/project-details/shared/priority";
import type { Person } from "@/pages/project-details/shared/types";
import UpdateLogNote from "@/pages/project-details/shared/UpdateLogNote.vue";
import { documentUrl } from "@/pages/project-details/shared/useDocumentWrite";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage, isAbortError } from "@/utils/errors";
import {
  EDIT_LOG_NOTE,
  RISK_CATEGORY_DOCTYPE,
  RISK_CATEGORY_LIMIT,
  RISK_DOCTYPE,
  RISK_LEVELS,
  RISK_STATUSES,
} from "./constants";
import RiskLevelPill from "./RiskLevelPill.vue";
import RiskStatusBadge from "./RiskStatusBadge.vue";
import { riskForm, validateRiskForm } from "./risks";
import RiskStatusDot from "./RiskStatusDot.vue";
import type { RiskDoc, RiskForm, RiskFormErrors } from "./types";
import { useRisks } from "./useRisks";

const risks = useRisks();
const { dialogOpen, editingId, saving } = risks;
const { doc: project } = useProjectDetails();

const open = computed({
  get: () => dialogOpen.value,
  set: (value) => (dialogOpen.value = value),
});
const isEdit = computed(() => Boolean(editingId.value));

const existing = useCall<RiskDoc>({
  url: computed(() => documentUrl(RISK_DOCTYPE, editingId.value)),
  immediate: false,
});
/** The risk being edited, once read for this opening. */
const editingRisk = ref<RiskDoc | null>(null);
const readError = computed(() =>
  existing.error && !isAbortError(existing.error) ? existing.error : null,
);

const categories = useList<{ name: string }>({
  doctype: RISK_CATEGORY_DOCTYPE,
  fields: ["name"],
  orderBy: "name asc",
  limit: RISK_CATEGORY_LIMIT,
  immediate: false,
  refetch: false,
});
const categoryOptions = computed(() =>
  (categories.data ?? []).map((category) => ({
    label: category.name,
    value: category.name,
  })),
);

const form = reactive<RiskForm>(riskForm(null));
const errors = reactive<RiskFormErrors>({});
const ownerQuery = ref("");
const levelMenuHost = ref<HTMLElement>();
/** The owner shown when the lookup's results don't include them. */
const ownerPerson = ref<Person | null>(null);

function reset(values: RiskForm, owner: Person | null) {
  Object.assign(form, values);
  ownerPerson.value = owner;
  ownerQuery.value = "";
  for (const key of Object.keys(errors))
    delete errors[key as keyof RiskFormErrors];
}

/** Counts openings, so a read for an earlier one is ignored. */
let openings = 0;

watch(open, async (isOpen) => {
  if (!isOpen) return;
  const opening = ++openings;
  categories.fetch();
  editingRisk.value = null;
  if (!editingId.value) {
    const managerId = project.value?.custom_project_manager ?? "";
    reset(
      riskForm(null, managerId),
      managerId
        ? {
            userId: managerId,
            label: project.value?.custom_project_manager_name || managerId,
          }
        : null,
    );
    return;
  }
  const name = editingId.value;
  reset(riskForm(null), null);
  const risk = await existing.fetch();
  // A superseded read resolves with the data it had, possibly another risk's.
  if (opening !== openings || !open.value || existing.error) return;
  if (!risk || risk.name !== name) return;
  editingRisk.value = risk;
  // As React: the current owner is labelled by their user ID.
  reset(
    riskForm(risk),
    risk.risk_owner
      ? { userId: risk.risk_owner, label: risk.risk_owner }
      : null,
  );
});

watch(
  () => [form.risk_level, form.status],
  () => {
    delete errors.risk_level;
    delete errors.status;
  },
);

const lookup = useEmployeeLookup({
  enabled: open,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () =>
    ownerQuery.value === ownerPerson.value?.label ? "" : ownerQuery.value,
});
const ownerOptions = computed(() =>
  toEmployeeUserOptions(lookup.options, ownerPerson.value),
);
const searchError = computed(() =>
  lookup.error ? errorMessage(lookup.error) : null,
);
const owner = computed({
  get: () => form.risk_owner || null,
  set: (value) => {
    form.risk_owner = value ? String(value) : "";
    const option = ownerOptions.value.find((item) => item.value === value);
    ownerPerson.value = option
      ? {
          userId: String(option.value),
          label: option.label,
          image: option.image,
        }
      : null;
  },
});
const category = computed({
  get: () => form.risk_category || null,
  set: (value) => (form.risk_category = value ? String(value) : ""),
});

const LEVEL_OPTIONS = RISK_LEVELS.map((level) => ({
  label: `${level} risk`,
  value: level,
}));
const STATUS_OPTIONS = RISK_STATUSES.map((status) => ({
  label: status,
  value: status,
}));

function personOf(option: unknown) {
  return option as LookupOption;
}

function levelInk(level: unknown) {
  return isPriorityLevel(level) ? PRIORITY_INK[level] : "";
}

const loadingRisk = computed(
  () => isEdit.value && !editingRisk.value && !readError.value,
);

async function submit() {
  Object.assign(errors, validateRiskForm(form, isEdit.value));
  if (Object.keys(errors).length || loadingRisk.value || readError.value)
    return;
  if (await risks.save({ ...form })) open.value = false;
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="isEdit ? 'Edit risk' : 'Create risk'"
    size="md"
    position="top"
    :padding-top="120"
    :dismissible="!saving"
  >
    <div v-if="loadingRisk" class="flex justify-center py-8">
      <Spinner class="size-5" />
    </div>
    <ErrorMessage v-else-if="readError" :message="errorMessage(readError)" />
    <form v-else class="-mt-2 space-y-4" novalidate @submit.prevent="submit">
      <Combobox
        v-model="category"
        label="Risk category"
        size="md"
        variant="outline"
        :options="categoryOptions"
        :loading="categories.loading"
        open-on-focus
        placeholder="Select category"
      />
      <DisabledField v-if="isEdit" label="Risk level">
        <RiskLevelPill
          v-if="editingRisk?.risk_level"
          :level="editingRisk.risk_level"
          bare
        />
        <span v-else>—</span>
      </DisabledField>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-else
        v-model="form.risk_level"
        label="Risk level"
        required
        :error="errors.risk_level"
        size="md"
        variant="outline"
        :options="LEVEL_OPTIONS"
        placeholder="Select level"
        side="bottom"
        :portal-to="levelMenuHost"
      >
        <template #item-prefix="{ item }">
          <PriorityIcon
            :level="String(item.value)"
            :class="levelInk(item.value)"
          />
        </template>
        <template #item-label="{ item }">
          <span class="text-sm" :class="levelInk(item.value)">
            {{ item.label }}
          </span>
        </template>
      </Select>
      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Select has no prop for its list's width; the list renders in here to keep React's compact one -->
      <div
        v-if="!isEdit"
        ref="levelMenuHost"
        class="absolute [&_[data-slot=content]]:min-w-0"
      />
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
      <DisabledField v-if="isEdit" label="Status">
        <span v-if="editingRisk?.status" class="text-base text-ink-gray-7">
          <RiskStatusBadge :status="editingRisk.status" />
        </span>
        <span v-else>—</span>
      </DisabledField>
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-else
        v-model="form.status"
        label="Status"
        required
        :error="errors.status"
        size="md"
        variant="outline"
        :options="STATUS_OPTIONS"
        placeholder="Select status"
      >
        <template #item-prefix="{ item }">
          <RiskStatusDot :status="String(item.value)" />
        </template>
      </Select>
      <UpdateLogNote v-if="isEdit" :message="EDIT_LOG_NOTE" />
      <Combobox
        v-model="owner"
        v-model:query="ownerQuery"
        label="Risk owner"
        size="md"
        variant="outline"
        :options="ownerOptions"
        :loading="lookup.loading"
        :filterable="false"
        open-on-focus
        placeholder="Select risk owner"
      >
        <template #item-prefix="{ item }">
          <Avatar
            size="xs"
            shape="circle"
            :image="personOf(item).image"
            :label="personOf(item).label"
          />
        </template>
        <template v-if="searchError && !ownerOptions.length" #empty>
          <span role="alert" class="text-ink-red-6">{{ searchError }}</span>
        </template>
        <template v-else-if="searchError" #footer>
          <p role="alert" class="px-3 py-1.5 text-base text-ink-red-6">
            {{ searchError }}
          </p>
        </template>
      </Combobox>
      <div class="flex flex-col gap-1.5">
        <FormLabel label="Summary" />
        <RichTextEditor
          v-model="form.summary"
          label="Summary"
          placeholder="Describe the risk..."
          content-class="h-24 overflow-auto"
          :disabled="saving"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <FormLabel label="Mitigation plan" />
        <RichTextEditor
          v-model="form.mitigation_plan"
          label="Mitigation plan"
          placeholder="Describe the mitigation plan..."
          content-class="h-24 overflow-auto"
          :disabled="saving"
        />
      </div>
    </form>

    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        :label="isEdit ? 'Save' : 'Create'"
        :loading="saving"
        :disabled="saving || loadingRisk || Boolean(readError)"
        @click="submit"
      />
    </template>
  </Dialog>
</template>
