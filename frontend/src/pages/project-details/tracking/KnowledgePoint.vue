<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { Tooltip } from "frappe-ui";
import { InfoHoverCard, type FieldHelp } from "@/components/InfoHoverCard";
import TruncatedText from "@/pages/project-details/TruncatedText.vue";
import { cn } from "@/utils/cn";

defineProps<{
  title: string;
  value: string;
  href?: string;
  help?: FieldHelp;
}>();

const CARD =
  "flex h-20 min-w-0 flex-1 flex-col justify-between rounded-7 border border-outline-gray-1 bg-surface-elevation-1 p-3";
const VALUE = "text-2xl-medium leading-tighter text-ink-gray-8";

const valueLabel = useTemplateRef("valueLabel");
const truncated = ref(false);

// A linked card's link covers it, keeping the info button out of the link; the link
// then carries the truncated value's tooltip, so it measures the value itself.
function measure() {
  const element = valueLabel.value;
  truncated.value = Boolean(
    element && element.scrollWidth > element.clientWidth,
  );
}
</script>

<template>
  <div
    :class="
      cn(CARD, href && 'relative transition-colors hover:bg-surface-gray-1')
    "
  >
    <Tooltip v-if="href" :text="value" :disabled="!truncated">
      <a
        :href="href"
        target="_blank"
        rel="noreferrer noopener"
        :aria-label="title"
        class="absolute inset-0 rounded-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
        @mouseenter="measure"
        @focus="measure"
      />
    </Tooltip>
    <div class="flex min-w-0 items-center gap-1.5">
      <span class="truncate text-base leading-tighter text-ink-gray-5">{{
        title
      }}</span>
      <InfoHoverCard v-if="help" :help="help" class="relative z-10" />
    </div>
    <span v-if="href" ref="valueLabel" :class="cn('truncate', VALUE)">
      {{ value }}
    </span>
    <TruncatedText v-else :class="VALUE" :text="value" />
  </div>
</template>
