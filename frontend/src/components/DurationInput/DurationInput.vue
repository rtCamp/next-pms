<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { cva } from "class-variance-authority";
import { ErrorMessage, FormLabel, Spinner } from "frappe-ui";
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from "reka-ui";
import { floatToTime } from "@/utils/format";
import type { DurationInputProps } from "./types";
import {
  SLIDER_STEP_MINUTES,
  clampHours,
  formatHoursBalance,
  getNotchOffsets,
  getPreviewMinutes,
  getSliderHours,
  normalizeCommittedHours,
  sanitizeHoursInput,
  timeToFloat,
} from "./utils";

const props = withDefaults(defineProps<DurationInputProps>(), {
  modelValue: 0,
  maxDuration: 8,
  hoursLeft: 8,
  snap: "step",
  size: "sm",
  variant: "subtle",
});

const emit = defineEmits<{ "update:modelValue": [value: number] }>();

const generatedId = useId();
const inputId = computed(() => props.id ?? generatedId);
const errorId = computed(() => `${inputId.value}-error`);

// Text being typed; null when the field shows the committed value.
const draftValue = ref<string | null>(null);
// Unsnapped slider minutes during a smooth drag; null otherwise.
const dragValue = ref<number | null>(null);
const isDragging = ref(false);

const maxHours = computed(() => Math.max(props.maxDuration, 0));
const maxMinutes = computed(() => maxHours.value * 60);
const isSmooth = computed(() => props.snap === "smooth");
const hasError = computed(() => Boolean(props.error));
const errorMessage = computed(() =>
  typeof props.error === "string" ? props.error : "",
);

const committedHours = computed(() =>
  normalizeCommittedHours(
    props.modelValue,
    maxHours.value,
    props.allowOverflow,
  ),
);
const sliderMinutes = computed(
  () =>
    dragValue.value ?? clampHours(committedHours.value, maxHours.value) * 60,
);
const previewMinutes = computed(() =>
  getPreviewMinutes(sliderMinutes.value, props.snap),
);
const previewHours = computed(() =>
  dragValue.value !== null ? previewMinutes.value / 60 : committedHours.value,
);
const inputValue = computed(
  () =>
    draftValue.value ??
    floatToTime(
      dragValue.value !== null ? previewHours.value : props.modelValue,
    ),
);
const balance = computed(() => props.hoursLeft - previewHours.value);
const isOver = computed(() => balance.value < 0);
const balanceText = computed(() =>
  isOver.value
    ? `${formatHoursBalance(Math.abs(balance.value))} over`
    : `${formatHoursBalance(balance.value)} left`,
);
const accessibleLabel = computed(
  () => props.label || props.inlineLabel || "Duration",
);
const notchOffsets = computed(() => getNotchOffsets(maxMinutes.value));
const sliderStep = computed(() =>
  isSmooth.value && isDragging.value ? 1 : SLIDER_STEP_MINUTES,
);

function setModel(hours: number) {
  if (hours !== props.modelValue) emit("update:modelValue", hours);
}

function onSliderChange(values: number[] | undefined) {
  const minutes = values?.[0] ?? 0;
  if (isSmooth.value && isDragging.value) {
    dragValue.value = minutes;
    return;
  }
  emit("update:modelValue", minutes / 60);
}

function startDrag() {
  if (!props.disabled) isDragging.value = true;
}

// reka-ui's `valueCommit` only fires when the value changed, so a press without
// movement would leave `isDragging` stuck; end the drag on the pointer itself.
function endDrag() {
  if (!isDragging.value) return;
  if (isSmooth.value && dragValue.value !== null) {
    const hours = getSliderHours(dragValue.value, props.snap, maxHours.value);
    dragValue.value = null;
    setModel(hours);
  }
  isDragging.value = false;
}

function onFocus(event: FocusEvent) {
  draftValue.value = floatToTime(props.modelValue);
  dragValue.value = null;
  (event.target as HTMLInputElement).select();
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const sanitized = sanitizeHoursInput(input.value);
  // When the draft doesn't change (a rejected character), Vue won't re-render,
  // so the DOM has to be corrected here.
  input.value = sanitized;
  draftValue.value = sanitized;
}

function commitInput() {
  const hours = normalizeCommittedHours(
    timeToFloat(draftValue.value ?? floatToTime(props.modelValue)),
    maxHours.value,
    props.allowOverflow,
  );
  draftValue.value = null;
  dragValue.value = null;
  setModel(hours);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    (event.target as HTMLInputElement).blur();
  } else if (event.key === "Escape") {
    event.preventDefault();
    draftValue.value = null;
    dragValue.value = null;
  }
}

const control = cva("relative flex items-center overflow-hidden rounded-4", {
  variants: {
    variant: { subtle: "", outline: "ring-1" },
    // Tailwind 3.4 has no `has-focus-visible` variant.
    /* eslint-disable better-tailwindcss/no-restricted-classes */
    error: {
      true: "has-[:focus-visible]:focus-ring-red",
      false: "has-[:focus-visible]:focus-ring",
    },
    /* eslint-enable better-tailwindcss/no-restricted-classes */
    disabled: { true: "cursor-not-allowed", false: "" },
    dragging: { true: "", false: "" },
  },
  compoundVariants: [
    { disabled: false, dragging: true, class: "cursor-grabbing" },
    { disabled: false, dragging: false, class: "cursor-pointer" },
    { variant: "outline", error: true, class: "ring-outline-red-3" },
    { variant: "outline", error: false, class: "ring-outline-gray-2" },
  ],
});

const track = cva("relative w-full rounded-4 transition-colors", {
  variants: {
    size: { sm: "h-7", md: "h-8" },
    variant: { subtle: "", outline: "bg-surface-base" },
    error: { true: "", false: "" },
  },
  compoundVariants: [
    { variant: "subtle", error: true, class: "bg-surface-red-2" },
    { variant: "subtle", error: false, class: "bg-surface-gray-2" },
  ],
});

const range = cva("absolute inset-y-0 cursor-grab select-none rounded-4", {
  variants: {
    error: { true: "bg-surface-red-3", false: "" },
    disabled: { true: "", false: "" },
    variant: { subtle: "", outline: "" },
  },
  compoundVariants: [
    {
      error: false,
      disabled: false,
      variant: "subtle",
      class: "bg-surface-gray-4",
    },
    { error: false, disabled: true, class: "bg-surface-gray-3" },
    {
      error: false,
      disabled: false,
      variant: "outline",
      class: "bg-surface-gray-3",
    },
  ],
});

const grip = cva(
  "pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-4 transition-colors",
  {
    variants: {
      // Up to one step the range is too short to centre the grip.
      short: { true: "right-1", false: "right-2" },
      empty: { true: "invisible", false: "" },
      error: { true: "bg-surface-red-4", false: "" },
      dragging: { true: "", false: "" },
    },
    // The grip's 36% and 9% opacities match React and have no scale step.
    /* eslint-disable better-tailwindcss/no-restricted-classes */
    compoundVariants: [
      { error: false, dragging: true, class: "bg-surface-gray-10/[0.36]" },
      { error: false, dragging: false, class: "bg-surface-gray-10/[0.09]" },
    ],
    /* eslint-enable better-tailwindcss/no-restricted-classes */
  },
);

const field = cva(
  "absolute right-2.5 top-1/2 h-auto w-10 -translate-y-1/2 rounded-1 border-0 bg-transparent p-0 text-center tabular-nums shadow-none focus:ring-0 focus-visible:outline-offset-1",
  {
    variants: {
      size: { sm: "text-sm", md: "text-base" },
      disabled: {
        true: "pointer-events-none text-ink-gray-3",
        false: "text-ink-gray-8",
      },
      error: { true: "focus-visible:focus-ring-red", false: "" },
    },
  },
);

const controlClasses = computed(() =>
  control({
    variant: props.variant,
    error: hasError.value,
    disabled: props.disabled,
    dragging: isDragging.value,
  }),
);
const trackClasses = computed(() =>
  track({ size: props.size, variant: props.variant, error: hasError.value }),
);
const rangeClasses = computed(() =>
  range({
    error: hasError.value,
    disabled: props.disabled,
    variant: props.variant,
  }),
);
const gripClasses = computed(() =>
  grip({
    short: previewMinutes.value <= SLIDER_STEP_MINUTES,
    empty: previewMinutes.value === 0,
    error: hasError.value,
    dragging: isDragging.value,
  }),
);
const inputClasses = computed(() =>
  field({ size: props.size, disabled: props.disabled, error: hasError.value }),
);
</script>

<template>
  <div
    class="relative space-y-1.5"
    :class="{ 'pointer-events-none opacity-90': disabled }"
  >
    <div
      v-if="label"
      class="flex w-full items-center justify-between gap-2 text-sm leading-tighter"
    >
      <FormLabel :id="inputId" :label="label" :required="required" />
      <span :class="isOver ? 'text-ink-red-7' : 'text-ink-gray-5'">
        {{ balanceText }}
      </span>
    </div>

    <div class="relative">
      <SliderRoot
        :model-value="[sliderMinutes]"
        :min="0"
        :max="maxMinutes"
        :step="sliderStep"
        :disabled="disabled"
        :class="controlClasses"
        @update:model-value="onSliderChange"
        @pointerdown.capture="startDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
      >
        <SliderTrack :class="trackClasses">
          <template v-if="isDragging && !disabled">
            <!-- eslint-disable better-tailwindcss/no-restricted-classes -- a hairline notch; the border scale has no half pixel -->
            <div
              v-for="offset in notchOffsets"
              :key="offset"
              class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-4 border-[0.5px]"
              :class="
                hasError ? 'border-outline-red-1' : 'border-outline-gray-2'
              "
              :style="{ left: `${offset}%` }"
            />
            <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
          </template>
          <SliderRange :class="rangeClasses">
            <span :class="gripClasses" />
          </SliderRange>
          <SliderThumb
            class="size-0 opacity-0 focus-visible:outline-none"
            :aria-label="accessibleLabel"
            :aria-valuetext="formatHoursBalance(previewHours)"
          />
          <!-- eslint-disable-next-line vuejs-accessibility/label-has-for -- the input sits outside the slider track; `for` links it -->
          <label
            v-if="inlineLabel"
            :for="inputId"
            class="absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center text-sm tabular-nums"
            :class="disabled ? 'text-ink-gray-5' : 'text-ink-gray-8'"
          >
            {{ inlineLabel }}
          </label>
        </SliderTrack>
      </SliderRoot>

      <Spinner
        v-if="loading"
        class="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-ink-gray-8"
        :class="size === 'md' ? 'right-15' : 'right-14'"
      />

      <input
        :id="inputId"
        type="text"
        inputmode="decimal"
        placeholder="00:00"
        autocomplete="off"
        :class="inputClasses"
        :value="inputValue"
        :disabled="disabled"
        :required="required"
        :aria-invalid="hasError || undefined"
        :aria-errormessage="errorMessage ? errorId : undefined"
        @focus="onFocus"
        @input="onInput"
        @blur="commitInput"
        @keydown="onKeydown"
      />
    </div>

    <ErrorMessage v-if="errorMessage" :id="errorId" :message="errorMessage" />
  </div>
</template>
