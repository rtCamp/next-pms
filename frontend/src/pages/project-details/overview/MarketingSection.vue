<script setup lang="ts">
import { Select } from "frappe-ui";
import { hasProjectField } from "@/utils/boot";
import { EMPTY, YES_NO_OPTIONS } from "./constants";
import ContactCombobox from "./ContactCombobox.vue";
import { yesNoLabel } from "./overview";
import OverviewField from "./OverviewField.vue";
import OverviewSection from "./OverviewSection.vue";
import { useOverview } from "./useOverview";

const { values, draft, editing, saving, contactLabel } = useOverview();

const CHECKS = [
  {
    field: "custom_restricted_under_nda",
    icon: "lucide-eye-off",
    label: "NDA signed",
  },
  {
    field: "custom_permission_for_case_study",
    icon: "lucide-newspaper",
    label: "Case study approved",
  },
  {
    field: "custom_permission_for_testimonial",
    icon: "lucide-quote",
    label: "Testimonial approval",
  },
] as const;

const checks = CHECKS.filter((check) => hasProjectField(check.field));
</script>

<template>
  <OverviewSection v-if="values" title="Marketing">
    <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- React's 880px row; the preset's widths stop at 512px -->
    <div class="flex w-[880px] max-w-full flex-wrap gap-4">
      <OverviewField
        v-for="check in checks"
        :key="check.field"
        :icon="check.icon"
        :label="check.label"
        :value="yesNoLabel(values[check.field])"
        :editing="editing"
      >
        <Select
          v-if="draft"
          v-model="draft[check.field]"
          :options="YES_NO_OPTIONS"
          :disabled="saving"
          :aria-label="check.label"
        />
      </OverviewField>
      <OverviewField
        icon="lucide-contact"
        label="Testimonial contact"
        :value="
          values.custom_testimonial_contact
            ? contactLabel(values.custom_testimonial_contact)
            : EMPTY
        "
        :editing="editing"
      >
        <ContactCombobox
          v-if="draft"
          v-model="draft.custom_testimonial_contact"
          label="Testimonial contact"
          :disabled="saving"
        />
      </OverviewField>
    </div>
  </OverviewSection>
</template>
