<script setup lang="ts">
import { computed, ref } from "vue";
import { MultiSelect, Select } from "frappe-ui";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";
import {
  COMPLEXITY_OPTIONS,
  EMPTY,
  KEY_ACCOUNT_OPTIONS,
  PRIORITY_OPTIONS,
} from "./constants";
import LinkCombobox, { type LinkLookupInputs } from "./LinkCombobox.vue";
import OverviewField from "./OverviewField.vue";
import OverviewSection from "./OverviewSection.vue";
import { useOverview } from "./useOverview";

const { values, draft, editing, saving } = useOverview();

const hostLookup = ({ query, selected }: LinkLookupInputs) =>
  useDoctypeLinkLookup({ doctype: "Host", query, selected });

const techStackQuery = ref("");
const techStackLookup = useDoctypeLinkLookup({
  doctype: "Technology",
  filters: [["disabled", "=", 0]],
  enabled: editing,
  query: techStackQuery,
});
// The picked values stay listed while a search shows other results.
const techStackOptions = computed(() => {
  const picked = draft.value?.tech_stack ?? [];
  return [
    ...picked.map((value) => ({ label: value, value })),
    ...techStackLookup.options.filter(
      (option) => !picked.includes(option.value),
    ),
  ];
});
const techStack = computed({
  get: () => draft.value?.tech_stack ?? [],
  set: (next: (string | number)[]) => {
    if (draft.value) draft.value.tech_stack = next.map(String);
  },
});
</script>

<template>
  <OverviewSection v-if="values" title="Specifics">
    <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- React's 880px row; the preset's widths stop at 512px -->
    <div class="flex w-[880px] max-w-full flex-wrap gap-4">
      <OverviewField
        icon="lucide-signal-high"
        label="Priority"
        :value="values.priority || EMPTY"
        :editing="editing"
      >
        <Select
          v-if="draft"
          v-model="draft.priority"
          :options="PRIORITY_OPTIONS"
          :disabled="saving"
          aria-label="Priority"
        />
      </OverviewField>
      <OverviewField
        icon="lucide-git-branch"
        label="Complexity"
        :value="values.custom_complexity || EMPTY"
        :editing="editing"
      >
        <Select
          v-if="draft"
          v-model="draft.custom_complexity"
          :options="COMPLEXITY_OPTIONS"
          :disabled="saving"
          aria-label="Complexity"
        />
      </OverviewField>
      <OverviewField
        icon="lucide-user-check"
        label="Key account"
        :value="values.custom_key_account || EMPTY"
        :editing="editing"
      >
        <Select
          v-if="draft"
          v-model="draft.custom_key_account"
          :options="KEY_ACCOUNT_OPTIONS"
          :disabled="saving"
          aria-label="Key account"
        />
      </OverviewField>
      <OverviewField
        icon="lucide-server"
        label="Host"
        :value="values.custom_host || EMPTY"
        :editing="editing"
      >
        <LinkCombobox
          v-if="draft"
          v-model="draft.custom_host"
          label="Host"
          placeholder="Select host"
          :create-lookup="hostLookup"
          :disabled="saving"
        />
      </OverviewField>
      <OverviewField
        icon="lucide-layers"
        label="Tech stack"
        :value="values.tech_stack.join(', ') || EMPTY"
        :editing="editing"
      >
        <MultiSelect
          v-model="techStack"
          v-model:query="techStackQuery"
          :options="techStackOptions"
          :loading="techStackLookup.loading"
          :filterable="false"
          :disabled="saving"
          placeholder="Select tech stack"
        />
      </OverviewField>
    </div>
  </OverviewSection>
</template>
