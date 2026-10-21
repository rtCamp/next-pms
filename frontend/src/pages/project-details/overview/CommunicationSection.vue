<script setup lang="ts">
import { EMPTY } from "./constants";
import OverviewField from "./OverviewField.vue";
import OverviewSection from "./OverviewSection.vue";
import { useOverview } from "./useOverview";

const { values, contactLabel } = useOverview();
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
      />
      <OverviewField
        icon="lucide-calendar-clock"
        label="Time report frequency"
        :value="values.custom_time_report_frequency || EMPTY"
      />
    </div>
  </OverviewSection>
</template>
