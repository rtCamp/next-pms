<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import type { DayChipProps, DayChipState } from "./types";

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

const CONTAINER: Record<DayChipState, string> = {
  default: "bg-surface-gray-1",
  active: "bg-surface-gray-7",
  selected: "bg-surface-gray-3",
  disabled: "bg-surface-gray-1",
  skeleton: "bg-surface-gray-1 opacity-30",
};

const DAY_LABEL: Record<DayChipState, string> = {
  default: "text-ink-gray-4",
  active: "text-ink-gray-3",
  selected: "text-ink-gray-5",
  disabled: "text-ink-gray-3",
  skeleton: "text-ink-gray-3",
};

const DAY_NUMBER: Record<DayChipState, string> = {
  default: "text-ink-gray-6",
  active: "text-ink-base",
  selected: "text-ink-gray-7",
  disabled: "text-ink-gray-3",
  skeleton: "text-ink-gray-3",
};

function onClick(event: MouseEvent) {
  if (!isDisabled.value) emit("click", event);
}
</script>

<template>
  <Tooltip :text="tooltip" :disabled="!tooltip">
    <button
      v-bind="$attrs"
      type="button"
      class="relative h-[47px] w-[42px] shrink-0 rounded-6 px-1.5 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3 focus-visible:ring-offset-1"
      :class="[
        CONTAINER[state],
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        { 'hover:bg-surface-gray-2': state === 'default' && !isDisabled },
      ]"
      :aria-disabled="isDisabled"
      :aria-pressed="state === 'active' || state === 'selected'"
      :tabindex="isSkeleton ? -1 : undefined"
      @click="onClick"
    >
      <span
        class="mx-auto flex w-[21px] flex-col items-center gap-0.5 text-center"
        :class="{ 'opacity-0': isSkeleton }"
      >
        <span class="text-2xs leading-[1.15]" :class="DAY_LABEL[state]">
          {{ dayLabel }}
        </span>
        <span
          class="text-base font-medium leading-[1.15]"
          :class="DAY_NUMBER[state]"
        >
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
  </Tooltip>
</template>
