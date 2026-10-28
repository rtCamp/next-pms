<script setup lang="ts">
import { LINKED_RECORD_ICON } from "@/pages/project-details/to-do/constants";
import { cn } from "@/utils/cn";
import { TYPE_COLOR } from "./constants";

const props = defineProps<{
  isTouchpoint?: boolean;
  isComplete?: boolean;
  isInternal?: boolean;
}>();

const type = props.isTouchpoint ? "Touchpoint" : "Milestone";
</script>

<template>
  <span
    :class="
      cn(
        'flex grow items-center gap-1 rounded-4 p-1 text-xs',
        TYPE_COLOR[type],
        isComplete && 'opacity-60',
      )
    "
  >
    <span
      class="size-3 shrink-0"
      :class="LINKED_RECORD_ICON[type]"
      aria-hidden="true"
    />
    <span class="leading-tight" :class="isComplete && 'line-through'">
      Title
    </span>
    <span
      v-if="isInternal"
      class="lucide-lock ml-auto size-3 shrink-0"
      aria-hidden="true"
    />
  </span>
</template>
