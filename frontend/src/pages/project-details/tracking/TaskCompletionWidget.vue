<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/utils/cn";
import type { WidgetLayout } from "./types";
import { useTracking } from "./useTracking";

const props = withDefaults(defineProps<{ layout?: WidgetLayout }>(), {
  layout: "row",
});

const PATH_LENGTH = 200;
const HALF = PATH_LENGTH / 2;

const { tracking } = useTracking();

const total = computed(() => tracking.value?.tasks.total ?? 0);
const open = computed(() => tracking.value?.tasks.open ?? 0);
const completed = computed(() => tracking.value?.tasks.completed ?? 0);
const ratio = computed(() =>
  total.value > 0 ? Math.min(1, completed.value / total.value) : 0,
);
const percent = computed(() => Math.round(ratio.value * 100));
const isRow = computed(() => props.layout === "row");
</script>

<template>
  <section
    aria-label="Task completion"
    class="flex flex-1 flex-col gap-3 rounded-7 border border-outline-gray-1 bg-surface-elevation-1 p-3"
  >
    <h3 class="text-base-medium leading-tighter text-ink-gray-8">
      Task completion
    </h3>
    <div
      :class="
        cn(
          'flex flex-1 flex-col items-center justify-center gap-5',
          isRow && 'md:flex-row',
        )
      "
    >
      <div
        :class="cn('relative shrink-0', isRow ? 'w-42' : 'w-55')"
        role="img"
        :aria-label="`${percent}% completed`"
      >
        <svg
          viewBox="0 0 200 110"
          class="block h-auto w-full"
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="var(--surface-gray-2)"
            stroke-width="22"
            stroke-linecap="round"
            :pathLength="PATH_LENGTH"
            :stroke-dasharray="`${HALF} ${PATH_LENGTH}`"
            transform="rotate(180 100 100)"
          />
          <circle
            v-if="ratio > 0"
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="var(--surface-green-7)"
            stroke-width="22"
            stroke-linecap="round"
            :pathLength="PATH_LENGTH"
            :stroke-dasharray="`${ratio * HALF} ${PATH_LENGTH}`"
            transform="rotate(180 100 100)"
          />
        </svg>
        <div class="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span class="text-lg-semibold leading-tighter text-ink-gray-8"
            >{{ percent }}%</span
          >
          <span class="text-xs leading-tighter text-ink-gray-6">completed</span>
        </div>
      </div>
      <dl
        :class="
          cn(
            'flex w-full max-w-60 flex-col gap-2 text-base leading-tighter text-ink-gray-6',
            isRow && 'md:flex-1',
          )
        "
      >
        <div class="flex items-center justify-between gap-2">
          <dt class="min-w-0 truncate">Total issues created</dt>
          <dd class="font-medium">{{ total }}</dd>
        </div>
        <div class="flex items-center justify-between gap-2">
          <dt class="min-w-0 truncate">Open issues</dt>
          <dd class="font-medium">{{ open }}</dd>
        </div>
        <div class="flex items-center justify-between gap-2">
          <dt class="min-w-0 truncate">Completed issues</dt>
          <dd class="font-medium">{{ completed }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
