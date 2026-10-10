<script setup lang="ts">
import { computed } from "vue";
import type {
  CircularProgressBarColor,
  CircularProgressBarCustomTheme,
  CircularProgressBarProps,
  CircularProgressBarSize,
  CircularProgressBarThemeName,
} from "./types";

const props = withDefaults(defineProps<CircularProgressBarProps>(), {
  step: 1,
  totalSteps: 4,
  showPercentage: false,
  theme: "black",
  size: "md",
  themeComplete: "surface-green-3",
  variant: "solid",
});

const SIZES: Record<
  CircularProgressBarSize,
  { ring: string; inner: string; step: string; percent: string; icon: string }
> = {
  xs: {
    ring: "size-[30px]",
    inner: "size-[24px]",
    step: "text-[12px]",
    percent: "text-[8px]",
    icon: "size-4",
  },
  sm: {
    ring: "size-[42px]",
    inner: "size-[32px]",
    step: "text-[16px]",
    percent: "text-[12px]",
    icon: "size-5",
  },
  md: {
    ring: "size-[60px]",
    inner: "size-[46px]",
    step: "text-[20px]",
    percent: "text-[16px]",
    icon: "size-6",
  },
  lg: {
    ring: "size-[84px]",
    inner: "size-[66px]",
    step: "text-[24px]",
    percent: "text-[20px]",
    icon: "size-10",
  },
  xl: {
    ring: "size-[108px]",
    inner: "size-[86px]",
    step: "text-[28px]",
    percent: "text-[24px]",
    icon: "size-12",
  },
};

const THEMES: Record<
  CircularProgressBarThemeName,
  CircularProgressBarCustomTheme
> = {
  black: { primary: "ink-gray-7", secondary: "ink-gray-4" },
  red: { primary: "ink-red-5", secondary: "surface-red-3" },
  green: { primary: "ink-green-5", secondary: "surface-green-3" },
  blue: { primary: "ink-blue-5", secondary: "surface-blue-3" },
  orange: { primary: "ink-orange-5", secondary: "surface-orange-3" },
};

const TOKEN = /^(surface|ink|outline)-[a-z]+(-[a-z]+)*(-\d+)?$/;

function resolveColor(color: CircularProgressBarColor) {
  return TOKEN.test(color) ? `var(--${color})` : color;
}

const sizeClasses = computed(() => SIZES[props.size] ?? SIZES.md);
const colors = computed(() =>
  typeof props.theme === "string"
    ? (THEMES[props.theme] ?? THEMES.black)
    : props.theme,
);

const progress = computed(() => {
  if (props.totalSteps <= 0) return 100;
  return Math.min(100, Math.max(0, (props.step / props.totalSteps) * 100));
});
const isCompleted = computed(() => props.step >= props.totalSteps);
const valueText = computed(() => {
  if (isCompleted.value) return "Completed";
  return props.showPercentage
    ? `${Math.round(progress.value)}%`
    : `Step ${props.step} of ${props.totalSteps}`;
});

const cssVars = computed(() => ({
  "--cpb-progress": `${progress.value}%`,
  "--cpb-color-progress": resolveColor(colors.value.primary),
  "--cpb-color-remaining": resolveColor(colors.value.secondary),
  "--cpb-color-complete": resolveColor(props.themeComplete),
}));
</script>

<template>
  <div
    class="cpb-ring relative grid shrink-0 place-items-center rounded-full text-ink-gray-8"
    :class="[
      sizeClasses.ring,
      { 'cpb-ring--complete': isCompleted && variant === 'outline' },
    ]"
    :style="cssVars"
    role="progressbar"
    :aria-valuenow="Math.round(progress)"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuetext="valueText"
  >
    <div
      class="grid place-items-center rounded-full"
      :class="[
        sizeClasses.inner,
        isCompleted && variant === 'solid'
          ? 'bg-[--cpb-color-complete]'
          : 'bg-surface-base',
      ]"
    >
      <span
        v-if="isCompleted"
        class="lucide-check"
        :class="sizeClasses.icon"
        aria-hidden="true"
      />
      <span
        v-else
        class="leading-none"
        :class="showPercentage ? sizeClasses.percent : sizeClasses.step"
      >
        {{ showPercentage ? `${progress.toFixed(0)}%` : step }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Registered so the conic gradient can animate between steps. */
@property --cpb-progress {
  syntax: "<length-percentage>";
  inherits: true;
  initial-value: 0%;
}

.cpb-ring {
  background: conic-gradient(
    var(--cpb-color-progress) var(--cpb-progress),
    var(--cpb-color-remaining) 0%
  );
  transition: --cpb-progress 500ms linear;
}

.cpb-ring--complete {
  background: var(--cpb-color-complete);
}
</style>
