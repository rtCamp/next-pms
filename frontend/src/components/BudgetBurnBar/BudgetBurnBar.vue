<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import { ProgressBar } from "../ProgressBar";
import { budgetBurnTier, scale } from "./utils";
import type { BudgetBurnBarProps, BudgetBurnTier } from "./types";

const props = withDefaults(defineProps<BudgetBurnBarProps>(), {
  secondaryValue: 0,
  maxValue: 100,
  markerValue: 0,
  size: "md",
});

defineSlots<{
  /** Rich tooltip content for the `value` segment. */
  "primary-tooltip"?: () => unknown;
  /** Rich tooltip content for the `secondaryValue` segment. */
  "secondary-tooltip"?: () => unknown;
  /** Rich tooltip content for the marker. */
  "marker-tooltip"?: () => unknown;
}>();

const PRIMARY: Record<BudgetBurnTier, string> = {
  healthy: "rounded-full bg-surface-green-5",
  moderate: "rounded-full bg-surface-amber-5",
  over: "rounded-full bg-surface-red-5",
};
const SECONDARY: Record<BudgetBurnTier, string> = {
  healthy: "rounded-full bg-surface-green-2",
  moderate: "rounded-full bg-surface-amber-2",
  over: "rounded-full bg-surface-red-3",
};

const primaryPercent = computed(() => scale(props.value, props.maxValue));
const totalPercent = computed(() =>
  scale(props.value + Math.max(0, props.secondaryValue), props.maxValue),
);
const secondaryPercent = computed(
  () => totalPercent.value - primaryPercent.value,
);
const markerPercent = computed(() => scale(props.markerValue, props.maxValue));

const tier = computed(() =>
  budgetBurnTier(
    scale(
      props.value + props.secondaryValue,
      props.markerValue || props.maxValue,
    ),
  ),
);

// ProgressBar draws `secondaryValue` from the start of the track, so the
// running total is passed to lay it out after `value`.
const progressSecondary = computed(() =>
  secondaryPercent.value > 0 ? props.value + props.secondaryValue : undefined,
);
</script>

<template>
  <div class="relative w-full" :data-tier="tier">
    <ProgressBar
      :value="value"
      :secondary-value="progressSecondary"
      :max-value="maxValue"
      :size="size"
      :indicator-class="PRIMARY[tier]"
      :secondary-indicator-class="SECONDARY[tier]"
    />
    <div class="absolute inset-0 flex">
      <Tooltip
        v-if="primaryPercent > 0"
        :text="primaryTooltip"
        :disabled="!primaryTooltip && !$slots['primary-tooltip']"
      >
        <div
          data-segment="primary"
          :class="{
            'cursor-pointer': primaryTooltip || $slots['primary-tooltip'],
          }"
          :style="{ width: `${primaryPercent}%` }"
        />
        <template v-if="$slots['primary-tooltip']" #content>
          <slot name="primary-tooltip" />
        </template>
      </Tooltip>
      <Tooltip
        v-if="secondaryPercent > 0"
        :text="secondaryTooltip"
        :disabled="!secondaryTooltip && !$slots['secondary-tooltip']"
      >
        <div
          data-segment="secondary"
          :class="{
            'cursor-pointer': secondaryTooltip || $slots['secondary-tooltip'],
          }"
          :style="{ width: `${secondaryPercent}%` }"
        />
        <template v-if="$slots['secondary-tooltip']" #content>
          <slot name="secondary-tooltip" />
        </template>
      </Tooltip>
    </div>
    <template v-if="markerPercent > 0">
      <span
        aria-hidden="true"
        class="absolute bottom-full mb-px h-1 w-0 -translate-x-1/2 border-l border-outline-gray-3"
        :style="{ left: `${markerPercent}%` }"
      />
      <span
        aria-hidden="true"
        class="absolute top-full mt-px h-1 w-0 -translate-x-1/2 border-l border-outline-gray-3"
        :style="{ left: `${markerPercent}%` }"
      />
      <Tooltip
        v-if="markerTooltip || $slots['marker-tooltip']"
        :text="markerTooltip"
      >
        <span
          data-segment="marker"
          class="absolute -inset-y-1 w-1.5 -translate-x-1/2 cursor-pointer"
          :style="{ left: `${markerPercent}%` }"
        />
        <template v-if="$slots['marker-tooltip']" #content>
          <slot name="marker-tooltip" />
        </template>
      </Tooltip>
    </template>
  </div>
</template>
