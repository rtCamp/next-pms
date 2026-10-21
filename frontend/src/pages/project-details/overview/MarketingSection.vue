<script setup lang="ts">
import { hasProjectField } from "@/utils/boot";
import { EMPTY } from "./constants";
import { yesNoLabel } from "./overview";
import OverviewField from "./OverviewField.vue";
import OverviewSection from "./OverviewSection.vue";
import { useOverview } from "./useOverview";

const { values, contactLabel } = useOverview();
</script>

<template>
  <OverviewSection v-if="values" title="Marketing">
    <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- React's 880px row; the preset's widths stop at 512px -->
    <div class="flex w-[880px] max-w-full flex-wrap gap-4">
      <OverviewField
        v-if="hasProjectField('custom_restricted_under_nda')"
        icon="lucide-eye-off"
        label="NDA signed"
        :value="yesNoLabel(values.custom_restricted_under_nda)"
      />
      <OverviewField
        v-if="hasProjectField('custom_permission_for_case_study')"
        icon="lucide-newspaper"
        label="Case study approved"
        :value="yesNoLabel(values.custom_permission_for_case_study)"
      />
      <OverviewField
        v-if="hasProjectField('custom_permission_for_testimonial')"
        icon="lucide-quote"
        label="Testimonial approval"
        :value="yesNoLabel(values.custom_permission_for_testimonial)"
      />
      <OverviewField
        icon="lucide-contact"
        label="Testimonial contact"
        :value="
          values.custom_testimonial_contact
            ? contactLabel(values.custom_testimonial_contact)
            : EMPTY
        "
      />
    </div>
  </OverviewSection>
</template>
