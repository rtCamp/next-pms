<script setup lang="ts">
import { LINKED_RECORD_ICON } from "@/pages/project-details/to-do/constants";
import { cn } from "@/utils/cn";
import { TYPE_COLOR } from "./constants";
import ItemHoverCard from "./ItemHoverCard.vue";
import type { TimelineItem } from "./types";

defineProps<{ item: TimelineItem }>();
</script>

<template>
  <ItemHoverCard :item="item">
    <div
      :class="
        cn(
          'flex w-full cursor-pointer items-center gap-1 rounded-4 p-1 text-xs max-md:justify-center max-md:gap-0',
          TYPE_COLOR[item.type],
          item.isComplete && 'opacity-60',
        )
      "
    >
      <span
        class="size-3 shrink-0"
        :class="LINKED_RECORD_ICON[item.type]"
        aria-hidden="true"
      />
      <span
        class="min-w-0 truncate leading-tight max-md:w-0"
        :class="item.isComplete && 'line-through'"
      >
        {{ item.title }}
      </span>
      <span
        v-if="item.isInternal"
        class="lucide-lock ml-auto size-3 shrink-0 max-md:hidden"
        role="img"
        aria-label="Internal"
      />
    </div>
  </ItemHoverCard>
</template>
