<script setup lang="ts">
import { computed, shallowRef, useId } from "vue";
import { dayjs } from "frappe-ui";
import { InfoHoverCard } from "@/components/InfoHoverCard";
import { formatNumber } from "@/utils/format";
import { ALLOCATION_DIALOG_HELP } from "./help";
import type { OverAllocatedDay } from "./useOverAllocation";

const props = defineProps<{
  days: OverAllocatedDay[];
}>();

const expanded = shallowRef(false);
const panelId = useId();

const totalExcess = computed(() =>
  props.days.reduce((sum, day) => sum + day.excessHours, 0),
);
</script>

<template>
  <div v-if="days.length" class="overflow-hidden rounded-6 bg-surface-violet-1">
    <div class="flex items-center gap-1.5 pr-2.5">
      <button
        type="button"
        class="flex w-full items-center gap-2 px-2.5 py-2"
        :aria-expanded="expanded"
        :aria-controls="panelId"
        @click="expanded = !expanded"
      >
        <span
          class="lucide-triangle-alert size-4 shrink-0 text-ink-violet-8"
          aria-hidden="true"
        />
        <span class="min-w-0 flex-1 text-left text-xs text-ink-gray-8">
          This allocation causes over-allocation on {{ days.length }}
          {{ days.length === 1 ? "day" : "days" }} (+{{
            formatNumber(totalExcess)
          }}h total)
        </span>
        <span
          class="lucide-chevron-down size-4 shrink-0 text-ink-gray-7 transition-transform duration-200"
          :class="expanded && 'rotate-180'"
          aria-hidden="true"
        />
      </button>
      <InfoHoverCard :help="ALLOCATION_DIALOG_HELP.overAllocation" />
    </div>
    <div
      v-show="expanded"
      :id="panelId"
      class="flex max-h-24 flex-col gap-1.5 overflow-y-scroll px-2.5 pb-2 pl-8"
    >
      <div v-for="day in days" :key="day.date" class="flex items-center gap-2">
        <span class="text-xs text-ink-gray-7">
          {{ dayjs(day.date).format("MMM D, YYYY") }}
        </span>
        <span
          class="rounded-5 bg-surface-violet-1 px-1.5 py-0.5 text-xs font-medium text-ink-violet-8"
        >
          {{ formatNumber(day.excessHours) }}h over
        </span>
      </div>
    </div>
  </div>
</template>
