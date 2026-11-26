<script setup lang="ts">
import { TextInput } from "frappe-ui";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";
import { hasProjectField } from "@/utils/boot";
import { EMPTY } from "./constants";
import LinkCombobox, { type LinkLookupInputs } from "./LinkCombobox.vue";
import OverviewField from "./OverviewField.vue";
import OverviewSection from "./OverviewSection.vue";
import { useOverview } from "./useOverview";

const { values, draft, editing, saving } = useOverview();

const sourceLookup = ({ query, selected }: LinkLookupInputs) =>
  useDoctypeLinkLookup({ doctype: "UTM Source", query, selected });
const territoryLookup = ({ query, selected }: LinkLookupInputs) =>
  useDoctypeLinkLookup({ doctype: "Territory", query, selected });
</script>

<template>
  <OverviewSection v-if="values" title="Sourcing">
    <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- React's 880px row; the preset's widths stop at 512px -->
    <div class="flex w-[880px] max-w-full flex-wrap gap-4">
      <OverviewField
        v-if="hasProjectField('custom_source')"
        icon="lucide-search"
        label="Source"
        :value="values.custom_source || EMPTY"
        :editing="editing"
      >
        <LinkCombobox
          v-if="draft"
          v-model="draft.custom_source"
          label="Source"
          placeholder="Select source"
          :create-lookup="sourceLookup"
          :disabled="saving"
        />
      </OverviewField>
      <OverviewField
        v-if="hasProjectField('custom_territory')"
        icon="lucide-map-pin"
        label="Primary location"
        :value="values.custom_territory || EMPTY"
        :editing="editing"
      >
        <LinkCombobox
          v-if="draft"
          v-model="draft.custom_territory"
          label="Primary location"
          placeholder="Select primary location"
          :create-lookup="territoryLookup"
          :disabled="saving"
        />
      </OverviewField>
      <OverviewField
        v-if="hasProjectField('custom_previous_cms')"
        icon="lucide-tag"
        label="Previous CMS"
        :value="values.custom_previous_cms || EMPTY"
        :editing="editing"
      >
        <TextInput
          v-if="draft"
          v-model="draft.custom_previous_cms"
          :disabled="saving"
          aria-label="Previous CMS"
        />
      </OverviewField>
    </div>
  </OverviewSection>
</template>
