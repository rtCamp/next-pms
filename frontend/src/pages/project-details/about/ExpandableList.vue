<script setup lang="ts" generic="T">
import { computed, ref } from "vue";
import { VISIBLE_ROWS } from "./constants";

const props = defineProps<{
  items: T[];
  /** Plural noun for the "+N more" button, e.g. `"members"`. */
  itemLabel: string;
  itemKey: (item: T) => string;
}>();

defineSlots<{ default: (props: { item: T }) => unknown }>();

const expanded = ref(false);
const remaining = computed(() =>
  Math.max(0, props.items.length - VISIBLE_ROWS),
);
const shown = computed(() =>
  expanded.value ? props.items : props.items.slice(0, VISIBLE_ROWS),
);
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      :class="[
        'flex flex-col',
        expanded && 'max-h-32 overflow-y-auto pr-1 [scrollbar-width:thin]',
      ]"
    >
      <div v-for="item in shown" :key="itemKey(item)">
        <slot :item="item" />
      </div>
    </div>
    <button
      v-if="remaining > 0"
      type="button"
      :aria-expanded="expanded"
      class="rounded-1 py-1.5 text-left text-base leading-tighter text-ink-gray-5 hover:text-ink-gray-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
      @click="expanded = !expanded"
    >
      {{ expanded ? "Show less" : `+${remaining} more ${itemLabel}` }}
    </button>
  </div>
</template>
