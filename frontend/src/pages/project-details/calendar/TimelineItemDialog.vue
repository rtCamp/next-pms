<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Avatar,
  Button,
  Checkbox,
  Combobox,
  DatePicker,
  Dialog,
  Select,
  TextInput,
  useList,
} from "frappe-ui";
import type { LookupOption } from "@/composables/useRemoteLookup";
import { useUserLookup } from "@/composables/useUserLookup";
import { errorMessage } from "@/utils/errors";
import { itemForm, validateItemForm } from "./calendar";
import { CATEGORY_LIMIT } from "./constants";
import type {
  TimelineCategory,
  TimelineItemErrors,
  TimelineItemForm,
} from "./types";
import { useTimeline } from "./useTimeline";

const timeline = useTimeline();
const { dialogType, editing, saving } = timeline;

const open = computed({
  get: () => dialogType.value !== null,
  set: (value) => {
    if (!value) timeline.closeDialog();
  },
});
const type = computed(() => dialogType.value ?? "Milestone");
const label = computed(() => type.value.toLowerCase());
const isMilestone = computed(() => type.value === "Milestone");
const isEdit = computed(() => editing.value !== null);

const form = reactive<TimelineItemForm>(itemForm("Milestone", null));
const errors = reactive<TimelineItemErrors>({});
const ownerQuery = ref("");
const ownerOption = ref<LookupOption | null>(null);

watch(open, (isOpen) => {
  if (!isOpen) return;
  const item = editing.value;
  Object.assign(form, itemForm(type.value, item));
  ownerOption.value = item?.owner.userId
    ? {
        label: item.owner.fullName || item.owner.userId,
        value: item.owner.userId,
        image: item.owner.image,
      }
    : null;
  ownerQuery.value = "";
  for (const key of Object.keys(errors)) {
    delete errors[key as keyof TimelineItemForm];
  }
});

for (const key of Object.keys(form) as (keyof TimelineItemForm)[]) {
  watch(
    () => form[key],
    () => delete errors[key],
  );
}

const categories = useList<TimelineCategory>({
  doctype: "Project Timeline Item Category",
  fields: ["name", "category_name"],
  filters: () => ({ applies_to: type.value }),
  orderBy: "position asc",
  limit: CATEGORY_LIMIT,
  immediate: false,
  refetch: false,
});
watch(open, (isOpen) => {
  if (isOpen) categories.fetch();
});
const categoryOptions = computed(() =>
  (categories.data ?? []).map((category) => ({
    label: category.category_name,
    value: category.name,
  })),
);
const category = computed({
  get: () => form.category || undefined,
  set: (value) => (form.category = value ? String(value) : ""),
});

const lookup = useUserLookup({
  enabled: open,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () =>
    ownerQuery.value === ownerOption.value?.label ? "" : ownerQuery.value,
  selected: ownerOption,
});
const searchError = computed(() =>
  lookup.error ? errorMessage(lookup.error) : null,
);
const owner = computed({
  get: () => form.owner || null,
  set: (value) => {
    form.owner = value ? String(value) : "";
    ownerOption.value =
      lookup.options.find((option) => option.value === form.owner) ?? null;
  },
});

function personOf(option: unknown) {
  return option as { label: string; image?: string };
}

async function submit() {
  Object.assign(errors, validateItemForm(type.value, form));
  if (Object.keys(errors).length) return;
  if (await timeline.save({ ...form })) timeline.closeDialog();
}
</script>

<template>
  <Dialog
    v-model:open="open"
    :title="`${isEdit ? 'Edit' : 'Create'} ${label}`"
    size="md"
    :dismissible="!saving"
  >
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <TextInput
        v-model="form.title"
        :label="isMilestone ? 'Milestone name' : 'Touchpoint name'"
        required
        :error="errors.title"
        size="md"
        variant="outline"
        :placeholder="`Enter ${label} name`"
      />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- frappe-ui's Select renders a <label> from `label` -->
      <Select
        v-model="category"
        label="Type"
        required
        :error="errors.category"
        size="md"
        variant="outline"
        :options="categoryOptions"
        placeholder="Select type"
      />
      <div v-if="isMilestone" class="flex gap-4">
        <DatePicker
          v-model="form.startDate"
          class="min-w-0 flex-1"
          label="Start date"
          required
          :error="errors.startDate"
          :clearable="false"
          variant="outline"
          placeholder="Start date"
        >
          <template #suffix>
            <span class="lucide-calendar size-4 shrink-0" aria-hidden="true" />
          </template>
        </DatePicker>
        <DatePicker
          v-model="form.plannedEndDate"
          class="min-w-0 flex-1"
          label="Completion date"
          required
          :error="errors.plannedEndDate"
          :clearable="false"
          variant="outline"
          placeholder="Completion date"
        >
          <template #suffix>
            <span class="lucide-calendar size-4 shrink-0" aria-hidden="true" />
          </template>
        </DatePicker>
      </div>
      <DatePicker
        v-else
        v-model="form.plannedEndDate"
        label="Scheduled date"
        required
        :error="errors.plannedEndDate"
        :clearable="false"
        variant="outline"
        placeholder="Scheduled date"
      >
        <template #suffix>
          <span class="lucide-calendar size-4 shrink-0" aria-hidden="true" />
        </template>
      </DatePicker>
      <Combobox
        v-model="owner"
        v-model:query="ownerQuery"
        label="Owner"
        required
        :error="errors.owner"
        size="md"
        variant="outline"
        :options="lookup.options"
        :loading="lookup.loading"
        :filterable="false"
        open-on-focus
        placeholder="Select owner"
      >
        <template #item-prefix="{ item }">
          <Avatar
            size="xs"
            shape="circle"
            :image="personOf(item).image"
            :label="personOf(item).label"
          />
        </template>
        <template v-if="searchError && !lookup.options.length" #empty>
          <span role="alert" class="text-ink-red-6">{{ searchError }}</span>
        </template>
        <template v-else-if="searchError" #footer>
          <p role="alert" class="px-3 py-1.5 text-base text-ink-red-6">
            {{ searchError }}
          </p>
        </template>
      </Combobox>
      <Checkbox v-model="form.isInternal" label="Mark as internal" />
    </form>

    <template #actions>
      <Button
        class="w-full"
        variant="solid"
        :label="isEdit ? 'Save' : 'Create'"
        :loading="saving"
        :disabled="saving"
        @click="submit"
      />
    </template>
  </Dialog>
</template>
