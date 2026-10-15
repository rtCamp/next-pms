<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { Tooltip } from "frappe-ui";

defineProps<{ subject: string }>();
defineEmits<{ open: [] }>();

const label = useTemplateRef("label");
const truncated = ref(false);

// The tooltip only adds something when the subject is cut off.
function measure() {
  const element = label.value;
  truncated.value = Boolean(
    element && element.scrollWidth > element.clientWidth,
  );
}
</script>

<template>
  <Tooltip :text="subject" :disabled="!truncated">
    <button
      type="button"
      class="inline-flex h-7 w-full cursor-pointer items-center justify-start rounded-4 bg-transparent px-0 text-left text-base font-medium text-ink-gray-8 transition-colors hover:bg-surface-gray-3 active:bg-surface-gray-4"
      @mouseenter="measure"
      @focus="measure"
      @click="$emit('open')"
    >
      <span ref="label" class="ml-2 truncate">{{ subject }}</span>
    </button>
  </Tooltip>
</template>
