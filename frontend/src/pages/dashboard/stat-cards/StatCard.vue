<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { Skeleton } from "frappe-ui";
import { InfoHoverCard, type FieldHelp } from "@/components/InfoHoverCard";
import { formatNumber } from "@/utils/format";
import { cn } from "@/utils/cn";

const props = defineProps<{
  label: string;
  /** `undefined` while it can't be shown; formatted as a number. */
  value?: number;
  /** Lighter text after the value, e.g. `"this month"`. */
  subLabel?: string;
  /** Makes the card a link. */
  to?: string;
  loading?: boolean;
  help?: FieldHelp;
}>();

const cardClass =
  "flex flex-1 flex-col gap-2 rounded-6 border border-outline-gray-1 bg-surface-elevation-1 p-3";

const display = computed(() => formatNumber(props.value));
</script>

<template>
  <div v-if="loading" :class="cardClass" aria-busy="true">
    <Skeleton class="h-5 w-28" />
    <Skeleton class="h-8 w-16" />
  </div>
  <div
    v-else
    :class="
      cn(cardClass, to && 'relative transition-colors hover:bg-surface-gray-1')
    "
  >
    <RouterLink
      v-if="to"
      :to="to"
      :aria-label="label"
      class="absolute inset-0 rounded-6"
    />
    <span class="flex min-w-0 items-center gap-1.5">
      <span class="truncate text-base text-ink-gray-5">{{ label }}</span>
      <InfoHoverCard v-if="help" :help="help" class="relative z-10" />
    </span>
    <div class="flex items-baseline gap-1">
      <span class="text-3xl-medium text-ink-gray-8">{{ display }}</span>
      <span v-if="subLabel" class="truncate text-base text-ink-gray-5">
        {{ subLabel }}
      </span>
    </div>
  </div>
</template>
