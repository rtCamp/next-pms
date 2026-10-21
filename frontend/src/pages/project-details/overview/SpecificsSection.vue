<script setup lang="ts">
import { EMPTY } from "./constants";
import OverviewField from "./OverviewField.vue";
import OverviewSection from "./OverviewSection.vue";
import { useOverview } from "./useOverview";

const { values } = useOverview();
</script>

<template>
  <OverviewSection v-if="values" title="Specifics">
    <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- React's 880px row; the preset's widths stop at 512px -->
    <div class="flex w-[880px] max-w-full flex-wrap gap-4">
      <OverviewField
        icon="lucide-signal-high"
        label="Priority"
        :value="values.priority || EMPTY"
      />
      <OverviewField
        icon="lucide-git-branch"
        label="Complexity"
        :value="values.custom_complexity || EMPTY"
      />
      <OverviewField
        icon="lucide-user-check"
        label="Key account"
        :value="values.custom_key_account || EMPTY"
      />
      <OverviewField
        icon="lucide-server"
        label="Host"
        :value="values.custom_host || EMPTY"
      />
    </div>
  </OverviewSection>
</template>
