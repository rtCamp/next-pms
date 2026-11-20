<script setup lang="ts">
import { onScopeDispose, ref, useTemplateRef, watch } from "vue";

const props = defineProps<{ remark: string }>();

const text = useTemplateRef("text");
const expanded = ref(false);
const overflowing = ref(false);

function measure() {
  const element = text.value;
  if (element && !expanded.value)
    overflowing.value = element.scrollHeight > element.clientHeight;
}

const observer = new ResizeObserver(measure);
watch(() => props.remark, measure, { flush: "post" });
watch(text, (element, previous) => {
  if (previous) observer.unobserve(previous);
  if (element) observer.observe(element);
});
onScopeDispose(() => observer.disconnect());
</script>

<template>
  <div class="flex flex-col gap-1 rounded-6 bg-surface-amber-1 px-3 py-2">
    <span class="text-xs font-medium text-ink-amber-7">Ai remark</span>
    <p
      ref="text"
      class="whitespace-pre-line break-words text-sm text-ink-gray-7"
      :class="expanded ? 'max-h-48 overflow-y-auto' : 'line-clamp-4'"
    >
      {{ remark }}
    </p>
    <button
      v-if="overflowing || expanded"
      type="button"
      class="self-start text-xs font-medium text-ink-amber-7 hover:underline"
      @click="expanded = !expanded"
    >
      {{ expanded ? "Show less" : "Show more" }}
    </button>
  </div>
</template>
