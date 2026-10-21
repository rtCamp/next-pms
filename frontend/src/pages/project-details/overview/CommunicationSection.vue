<script setup lang="ts">
import { computed, watch } from "vue";
import { Select, toast, useCall } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import { EMPTY, TIME_REPORT_FREQUENCY_DOCTYPE } from "./constants";
import ContactCombobox from "./ContactCombobox.vue";
import OverviewField from "./OverviewField.vue";
import OverviewSection from "./OverviewSection.vue";
import { useOverview } from "./useOverview";

const { values, draft, editing, saving, contactLabel } = useOverview();

const frequencies = useCall<
  { name: string }[] | null,
  Record<string, string | number>
>({
  url: "/api/v2/method/frappe.client.get_list",
  params: {
    doctype: TIME_REPORT_FREQUENCY_DOCTYPE,
    fields: JSON.stringify(["name"]),
    order_by: "creation asc",
    limit_page_length: 100,
  },
  immediate: false,
  onError: (error: unknown) => toast.error(errorMessage(error)),
});

// As React, the list loads each time editing starts.
watch(
  editing,
  (isEditing) => {
    if (isEditing) frequencies.fetch();
  },
  { immediate: true },
);

const frequencyOptions = computed(() => {
  const names = (frequencies.data ?? []).map((row) => row.name);
  const current = draft.value?.custom_time_report_frequency;
  // Keeps the current value readable while the list loads or if it failed.
  if (current && !names.includes(current)) names.unshift(current);
  return [
    { label: "None", value: "" },
    ...names.map((name) => ({ label: name, value: name })),
  ];
});
</script>

<template>
  <OverviewSection v-if="values" title="Communication">
    <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- React's 880px row; the preset's widths stop at 512px -->
    <div class="flex w-[880px] max-w-full flex-wrap gap-4">
      <OverviewField
        icon="lucide-contact"
        label="Point of contact"
        :value="
          values.custom_client_point_of_contact
            ? contactLabel(values.custom_client_point_of_contact)
            : EMPTY
        "
        :editing="editing"
      >
        <ContactCombobox
          v-if="draft"
          v-model="draft.custom_client_point_of_contact"
          label="Point of contact"
          :disabled="saving"
        />
      </OverviewField>
      <OverviewField
        icon="lucide-calendar-clock"
        label="Time report frequency"
        :value="values.custom_time_report_frequency || EMPTY"
        :editing="editing"
      >
        <Select
          v-if="draft"
          v-model="draft.custom_time_report_frequency"
          :options="frequencyOptions"
          :disabled="saving"
          aria-label="Time report frequency"
        />
      </OverviewField>
    </div>
  </OverviewSection>
</template>
