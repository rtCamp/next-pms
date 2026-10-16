<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import { ProgressBar } from "@/components/ProgressBar";
import { formatHours } from "@/utils/format";

const props = defineProps<{ used: number; total: number }>();

const usedPercent = computed(() =>
  props.total > 0 ? Math.min(100, (props.used / props.total) * 100) : 0,
);
</script>

<template>
  <div class="relative flex w-full items-center py-2">
    <ProgressBar
      :value="used"
      :max-value="total"
      size="sm"
      indicator-class="bg-surface-blue-4"
      :label="`${formatHours(used)} used of ${formatHours(total)}`"
    />
    <!-- Two hover zones over the bar, as in React: the used part and the rest. -->
    <div class="absolute inset-0 flex">
      <Tooltip :text="`${formatHours(used)} used`">
        <div :style="{ width: `${usedPercent}%` }" />
      </Tooltip>
      <Tooltip :text="`${formatHours(total)} total`">
        <div class="grow" />
      </Tooltip>
    </div>
  </div>
</template>
