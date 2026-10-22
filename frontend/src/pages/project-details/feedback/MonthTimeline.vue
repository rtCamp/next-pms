<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { dayjs, Spinner } from "frappe-ui";
import { TIMELINE_STEP_MONTHS } from "./constants";
import { scoreClass } from "./feedback";
import type { TimelineMonth } from "./types";

const props = defineProps<{
  months: TimelineMonth[];
  /** Shows a spinner in every pill, for the first load. */
  loading: boolean;
  /** The selected month's key, `YYYY-MM`. */
  selected: string;
}>();

const emit = defineEmits<{
  select: [month: TimelineMonth];
  /** The user scrolled to an end; move the window by `months`. */
  slide: [months: number];
}>();

const scroller = useTemplateRef<HTMLElement>("scroller");
const startSentinel = useTemplateRef<HTMLElement>("startSentinel");
const endSentinel = useTemplateRef<HTMLElement>("endSentinel");

function pill(key: string) {
  return scroller.value?.querySelector<HTMLElement>(`[data-month="${key}"]`);
}

function label(month: TimelineMonth) {
  const name = dayjs(new Date(month.year, month.month)).format("MMMM YYYY");
  return `${name}: ${month.score ?? "no score"}`;
}

// Slides the window, then scrolls so the pill that was at the edge stays where it
// was on screen, as React's sentinels did.
async function slide(months: number) {
  const root = scroller.value;
  const anchorMonth =
    months < 0 ? props.months[0] : props.months[props.months.length - 1];
  const anchor = anchorMonth && pill(anchorMonth.key);
  if (!root || !anchor) return;
  const offset = anchor.offsetLeft - root.scrollLeft;
  emit("slide", months);
  await nextTick();
  const moved = pill(anchorMonth.key);
  if (moved) root.scrollLeft = moved.offsetLeft - offset;
}

let observer: IntersectionObserver | undefined;

onMounted(() => {
  const root = scroller.value;
  const active = pill(props.selected);
  if (!root) return;
  if (active) {
    root.scrollLeft =
      active.offsetLeft - root.clientWidth / 2 + active.offsetWidth / 2;
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        void slide(
          entry.target === startSentinel.value
            ? -TIMELINE_STEP_MONTHS
            : TIMELINE_STEP_MONTHS,
        );
      }
    },
    { root, threshold: 0.5 },
  );
  if (startSentinel.value) observer.observe(startSentinel.value);
  if (endSentinel.value) observer.observe(endSentinel.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="relative">
    <div
      class="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-surface-base to-transparent"
      aria-hidden="true"
    />
    <div
      ref="scroller"
      class="mb-4 overflow-x-auto pb-4"
      role="group"
      aria-label="Feedback by month"
    >
      <div class="flex min-w-max gap-2">
        <span ref="startSentinel" class="w-2" aria-hidden="true" />
        <button
          v-for="month in months"
          :key="month.key"
          type="button"
          :data-month="month.key"
          class="relative flex w-10.5 shrink-0 flex-col items-center justify-center gap-0.5 rounded-6 py-2 transition-colors"
          :class="
            month.key === selected ? 'bg-surface-gray-10' : 'bg-surface-gray-1'
          "
          :aria-pressed="month.key === selected"
          :aria-label="label(month)"
          @click="emit('select', month)"
        >
          <span
            class="text-2xs"
            :class="
              month.key === selected ? 'text-ink-gray-3' : 'text-ink-gray-4'
            "
          >
            {{ dayjs(new Date(month.year, month.month)).format("MMM") }}
          </span>
          <span
            class="text-base-medium"
            :class="scoreClass(month.score, month.key === selected)"
          >
            <Spinner v-if="loading" class="size-4" />
            <template v-else>{{ month.score ?? "-" }}</template>
          </span>
          <span
            v-if="month.month === 0"
            class="absolute -bottom-1.5 left-1/2 flex h-3 -translate-x-1/2 items-center justify-center rounded-4 bg-surface-base px-1"
          >
            <!-- eslint-disable better-tailwindcss/no-restricted-classes -- React's 9px year badge; the scale's smallest size is 11px -->
            <span
              class="whitespace-nowrap text-[9px] leading-none text-ink-gray-5"
            >
              <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
              {{ month.year }}
            </span>
          </span>
        </button>
        <span ref="endSentinel" class="w-2" aria-hidden="true" />
      </div>
    </div>
    <div
      class="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-surface-base to-transparent"
      aria-hidden="true"
    />
  </div>
</template>
