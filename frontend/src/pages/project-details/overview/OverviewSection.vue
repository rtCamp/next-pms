<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { cn } from "@/utils/cn";

defineOptions({ inheritAttrs: false });
defineProps<{ title: string }>();

defineSlots<{
  default?: () => unknown;
  actions?: () => unknown;
}>();

const attrs = useAttrs();
const rootAttrs = computed(() => {
  const { class: className, ...rest } = attrs;
  return { ...rest, class: cn("flex flex-col gap-3", className as string) };
});
</script>

<template>
  <section v-bind="rootAttrs" :aria-label="title">
    <div class="flex items-center justify-between">
      <h3 class="text-lg-medium leading-tighter text-ink-gray-8">
        {{ title }}
      </h3>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>
