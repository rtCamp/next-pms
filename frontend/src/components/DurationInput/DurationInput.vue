<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { ErrorMessage, FormLabel, Spinner } from "frappe-ui";
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from "reka-ui";
import type { DurationInputProps } from "./types";
import {
  SLIDER_STEP_MINUTES,
  clampHours,
  floatToTime,
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

const controlClasses = computed(() => [
  "relative flex items-center overflow-hidden rounded-4",
  props.disabled
    ? "cursor-not-allowed"
    : isDragging.value
      ? "cursor-grabbing"
      : "cursor-pointer",
  hasError.value
    ? "has-[:focus-visible]:focus-ring-red"
    : "has-[:focus-visible]:focus-ring",
  props.variant === "outline" &&
    (hasError.value
      ? "ring-1 ring-outline-red-3"
      : "ring-1 ring-outline-gray-2"),
]);

const trackClasses = computed(() => [
  "relative w-full rounded-4 transition-colors",
  props.size === "md" ? "h-8" : "h-7",
  props.variant === "outline"
    ? "bg-surface-base"
    : hasError.value
      ? "bg-surface-red-2"
      : "bg-surface-gray-2",
]);

const rangeClasses = computed(() => [
  "absolute inset-y-0 cursor-grab select-none rounded-4",
  hasError.value
    ? "bg-surface-red-3"
    : props.disabled || props.variant === "outline"
      ? "bg-surface-gray-3"
      : "bg-surface-gray-4",
]);

const gripClasses = computed(() => [
  "pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-4 transition-colors",
  previewMinutes.value <= SLIDER_STEP_MINUTES ? "right-1" : "right-2",
  previewMinutes.value === 0 && "invisible",
  hasError.value
    ? "bg-surface-red-4"
    : isDragging.value
      ? "bg-surface-gray-10/[0.36]"
      : "bg-surface-gray-10/[0.09]",
]);

const inputClasses = computed(() => [
  "absolute right-2.5 top-1/2 h-auto w-10 -translate-y-1/2 rounded-1 border-0 bg-transparent p-0 text-center tabular-nums shadow-none focus:ring-0 focus-visible:outline-offset-1",
  props.size === "md" ? "text-base" : "text-sm",
  props.disabled ? "pointer-events-none text-ink-gray-3" : "text-ink-gray-8",
  hasError.value && "focus-visible:focus-ring-red",
]);
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
            <div
              v-for="offset in notchOffsets"
              :key="offset"
              class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-4 border-[0.5px]"
              :class="
                hasError ? 'border-outline-red-1' : 'border-outline-gray-2'
              "
              :style="{ left: `${offset}%` }"
            />
          </template>
          <SliderRange :class="rangeClasses">
            <span :class="gripClasses" />
          </SliderRange>
          <SliderThumb
            class="size-0 opacity-0 focus-visible:outline-none"
            :aria-label="accessibleLabel"
            :aria-valuetext="formatHoursBalance(previewHours)"
          />
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
        :class="size === 'md' ? 'right-[3.75rem]' : 'right-14'"
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
