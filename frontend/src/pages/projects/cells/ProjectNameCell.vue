<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { Tooltip } from "frappe-ui";
import RagDot from "./RagDot.vue";

defineProps<{ projectId: string; name: string; ragStatus?: string | null }>();

const label = useTemplateRef("label");
const truncated = ref(false);

// The tooltip only adds something when the name is cut off.
function measure() {
  const element = label.value;
  truncated.value = Boolean(
    element && element.scrollWidth > element.clientWidth,
  );
}
</script>

<template>
  <Tooltip :text="name" :disabled="!truncated">
    <RouterLink
      :to="`/projects/${encodeURIComponent(projectId)}`"
      class="inline-flex h-7 w-full items-center justify-start rounded-4 text-base font-medium text-ink-gray-8 transition-colors hover:bg-surface-gray-3 focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3 active:bg-surface-gray-4"
      @mouseenter="measure"
      @focus="measure"
    >
      <RagDot :status="ragStatus" />
      <span ref="label" class="ml-2 truncate">{{ name }}</span>
    </RouterLink>
  </Tooltip>
</template>
