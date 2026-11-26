<script setup lang="ts">
withDefaults(
  defineProps<{
    /** lucide icon class, e.g. `"lucide-server"`. */
    icon: string;
    label: string;
    /** What view mode shows. */
    value: string;
    editing?: boolean;
  }>(),
  { editing: false },
);

defineSlots<{
  /** The editor, shown instead of the value while editing. */
  default?: () => unknown;
}>();
</script>

<template>
  <div class="flex w-52 items-center gap-2">
    <span
      class="flex size-8 shrink-0 items-center justify-center rounded-6 text-ink-gray-7"
      aria-hidden="true"
    >
      <span :class="[icon, 'size-4.5']" />
    </span>
    <div class="flex min-w-0 flex-col">
      <span class="text-sm leading-tighter text-ink-gray-6">{{ label }}</span>
      <slot v-if="editing && $slots.default" />
      <span
        v-else
        class="truncate text-base-medium leading-tighter text-ink-gray-7"
      >
        {{ value }}
      </span>
    </div>
  </div>
</template>
