<script setup lang="ts">
import { hasProjectField } from "@/utils/boot";
import { EMPTY } from "./constants";
import OverviewField from "./OverviewField.vue";
import OverviewSection from "./OverviewSection.vue";
import { useOverview } from "./useOverview";

const { values } = useOverview();
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
      />
      <OverviewField
        v-if="hasProjectField('custom_territory')"
        icon="lucide-map-pin"
        label="Primary location"
        :value="values.custom_territory || EMPTY"
      />
      <OverviewField
        v-if="hasProjectField('custom_previous_cms')"
        icon="lucide-tag"
        label="Previous CMS"
        :value="values.custom_previous_cms || EMPTY"
      />
    </div>
  </OverviewSection>
</template>
