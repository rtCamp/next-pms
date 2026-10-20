<script setup lang="ts">
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "reka-ui";

defineProps<{ value: string; title: string }>();

defineSlots<{
  default?: () => unknown;
  /** Buttons beside the trigger, outside it. */
  actions?: () => unknown;
}>();
</script>

<template>
  <AccordionItem
    :value="value"
    class="border-t border-outline-gray-1 first:border-t-0"
  >
    <AccordionHeader as="h3" class="flex">
      <AccordionTrigger
        class="group flex min-w-0 flex-1 select-none items-center gap-3 rounded-1 px-5 py-3 text-left text-base font-medium leading-tighter text-ink-gray-8 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-outline-gray-3"
      >
        <span
          class="lucide-chevron-down size-4 shrink-0 -rotate-90 text-ink-gray-7 transition-transform duration-200 group-aria-expanded:rotate-0 motion-reduce:transition-none"
          aria-hidden="true"
        />
        <span class="truncate">{{ title }}</span>
      </AccordionTrigger>
      <div v-if="$slots.actions" class="flex shrink-0 items-center py-3 pr-5">
        <slot name="actions" />
      </div>
    </AccordionHeader>
    <AccordionContent
      class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none"
    >
      <div class="px-5 pb-4 empty:hidden">
        <slot />
      </div>
    </AccordionContent>
  </AccordionItem>
</template>
