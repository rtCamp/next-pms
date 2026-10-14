<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  /** Hours, e.g. `"02:30"`. An empty string shows a dash. */
  time: string;
  /** Turns the button off. */
  disabled?: boolean;
  /** Keeps the button focusable but marks it unavailable for adding time. */
  locked?: boolean;
  /** Marks the time as non-billable with a dot under it. */
  nonBillable?: boolean;
}>();

const canAdd = computed(() => !props.disabled && !props.locked);
</script>

<template>
  <!-- eslint-disable vue/no-restricted-v-bind -- a locked cell with time stays focusable so its entries can be opened -->
  <button
    type="button"
    class="group relative flex h-7 w-14 items-center justify-center rounded-4 lining-nums tabular-nums disabled:cursor-not-allowed aria-disabled:cursor-not-allowed"
    :class="
      canAdd &&
      'hover:bg-surface-gray-2 focus-visible:bg-surface-gray-2 active:bg-surface-gray-3'
    "
    :disabled="disabled"
    :aria-disabled="locked || undefined"
    :aria-label="time === '' ? 'Add time' : undefined"
  >
    <!-- eslint-enable vue/no-restricted-v-bind -->
    <template v-if="time === ''">
      <span
        class="text-ink-gray-4"
        :class="canAdd && 'group-hover:invisible'"
        aria-hidden="true"
      >
        -
      </span>
      <span
        v-if="canAdd"
        class="lucide-plus absolute inset-0 m-auto hidden size-4 text-ink-gray-6 group-hover:block"
        aria-hidden="true"
      />
    </template>
    <span v-else>{{ time }}</span>
    <span
      v-if="nonBillable"
      class="absolute -bottom-0.5 left-1/2 block size-1 -translate-x-1/2 rounded-full bg-surface-amber-3"
      role="img"
      aria-label="Non-billable"
    />
  </button>
</template>
