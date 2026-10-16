<script setup lang="ts">
import { useAttrs } from "vue";
import { cn } from "@/utils/cn";

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
</script>

<template>
  <div
    v-bind="{ ...attrs, class: undefined }"
    :class="
      cn(
        'flex flex-col gap-2 rounded-4 border border-outline-gray-1 bg-surface-base p-3',
        attrs.class as string,
      )
    "
  >
    <slot />
  </div>
</template>
