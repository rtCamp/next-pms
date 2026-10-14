<script setup lang="ts">
import { computed } from "vue";
import { cva } from "class-variance-authority";
import { Tooltip } from "frappe-ui";
import type { DayChipProps } from "./types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<DayChipProps>(), {
  state: "default",
  isMonthBoundary: false,
  disabled: false,
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const isSkeleton = computed(() => props.state === "skeleton");
const isDisabled = computed(
  () => props.disabled || props.state === "disabled" || isSkeleton.value,
);

const chip = cva(
  // eslint-disable-next-line better-tailwindcss/no-restricted-classes -- 47px matches React and has no scale step
  "relative h-[47px] w-10.5 shrink-0 rounded-6 px-1.5 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3 focus-visible:ring-offset-1",
  {
    variants: {
      state: {
        default: "bg-surface-gray-1",
        active: "bg-surface-gray-10",
        selected: "bg-surface-gray-3",
        disabled: "bg-surface-gray-1",
        skeleton: "bg-surface-gray-1 opacity-30",
      },
      disabled: { true: "cursor-not-allowed", false: "cursor-pointer" },
    },
    compoundVariants: [
      { state: "default", disabled: false, class: "hover:bg-surface-gray-2" },
    ],
  },
);

const dayLabelClass = cva("text-2xs leading-tighter", {
  variants: {
    state: {
      default: "text-ink-gray-4",
      active: "text-ink-gray-3",
      selected: "text-ink-gray-5",
      disabled: "text-ink-gray-3",
      skeleton: "text-ink-gray-3",
    },
  },
});

const dayNumberClass = cva("text-base font-medium leading-tighter", {
  variants: {
    state: {
      default: "text-ink-gray-6",
      active: "text-ink-base",
      selected: "text-ink-gray-7",
      disabled: "text-ink-gray-3",
      skeleton: "text-ink-gray-3",
    },
  },
});

function onClick(event: MouseEvent) {
  if (!isDisabled.value) emit("click", event);
}
</script>

<template>
  <Tooltip :text="tooltip" :disabled="!tooltip">
    <!-- eslint-disable better-tailwindcss/no-restricted-classes -- 21px and 9px match React and have no scale step -->
    <!-- eslint-disable vue/no-restricted-v-bind -- a locked day stays focusable so keyboard users reach its tooltip -->
    <button
      v-bind="$attrs"
      type="button"
      :class="chip({ state, disabled: isDisabled })"
      :aria-disabled="isDisabled"
      :aria-pressed="state === 'active' || state === 'selected'"
      :tabindex="isSkeleton ? -1 : undefined"
      @click="onClick"
    >
      <!-- eslint-enable vue/no-restricted-v-bind -->
      <span
        class="mx-auto flex w-[21px] flex-col items-center gap-0.5 text-center"
        :class="{ 'opacity-0': isSkeleton }"
      >
        <span :class="dayLabelClass({ state })">
          {{ dayLabel }}
        </span>
        <span :class="dayNumberClass({ state })">
          {{ dayNumber }}
        </span>
      </span>
      <span
        v-if="isMonthBoundary && monthLabel"
        class="pointer-events-none absolute -bottom-1.5 left-1/2 h-3 -translate-x-1/2 rounded-2 px-1 py-0.5 text-[9px] leading-none"
        :class="
          isSkeleton
            ? 'bg-surface-gray-1 text-transparent'
            : 'bg-surface-base text-ink-gray-5'
        "
      >
        {{ monthLabel }}
      </span>
    </button>
    <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
  </Tooltip>
</template>
