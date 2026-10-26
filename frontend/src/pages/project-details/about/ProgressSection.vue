<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import { ProgressBar } from "@/components/ProgressBar";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { formatHoursLabel, targetNotSetHint } from "./sidebar";
import { useProjectSidebar } from "./useProjectSidebar";

const { doc } = useProjectDetails();
const { sidebar } = useProjectSidebar();

const consumed = computed(() => sidebar.value?.progress.actual_time ?? 0);
const total = computed(
  () => sidebar.value?.progress.total_hours_purchased ?? 0,
);
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex items-center justify-between gap-2">
      <span class="text-base-medium leading-tighter text-ink-gray-7">
        {{ formatHoursLabel(consumed) }}
      </span>
      <span
        v-if="total > 0"
        class="text-base font-light leading-tighter text-ink-gray-5"
      >
        {{ formatHoursLabel(total) }}
      </span>
      <Tooltip v-else :text="targetNotSetHint(doc?.custom_billing_type)">
        <!-- eslint-disable-next-line vuejs-accessibility/no-noninteractive-tabindex -- focusable so the hint shows on keyboard focus -->
        <span
          tabindex="0"
          class="text-base font-light leading-tighter text-ink-gray-5"
        >
          Target not set
        </span>
      </Tooltip>
    </div>
    <ProgressBar
      :value="consumed"
      :max-value="Math.max(0, total)"
      indicator-class="bg-surface-blue-4"
      label="Hours used"
    />
  </div>
</template>
