<script setup lang="ts">
import { computed } from "vue";
import { BAR_HEIGHT } from "@/components/GanttGrid";
import { LINKED_RECORD_ICON } from "@/pages/project-details/to-do/constants";
import { cn } from "@/utils/cn";
import { floatingLabel, isFloatingChip } from "./calendar";
import { TYPE_COLOR, TYPE_TEXT_COLOR } from "./constants";
import ItemHoverCard from "./ItemHoverCard.vue";
import type { GanttPosition, TimelineItem } from "./types";

const props = defineProps<{
  item: TimelineItem;
  position: GanttPosition;
  totalWidth: number;
}>();

const icon = computed(() => LINKED_RECORD_ICON[props.item.type]);
const chip = computed(() => isFloatingChip(props.item, props.position));
const label = computed(() => floatingLabel(props.position, props.totalWidth));
const chipStyle = computed(() =>
  label.value.flip
    ? { right: `${label.value.right}px` }
    : { left: `${label.value.left}px` },
);
</script>

<template>
  <ItemHoverCard :item="item">
    <div
      v-if="chip"
      :class="
        cn(
          'absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-2',
          label.flip && 'flex-row-reverse',
        )
      "
      :style="chipStyle"
    >
      <div
        class="mx-0.5 flex h-8 shrink-0 items-center justify-center rounded-5"
        :class="TYPE_COLOR[item.type]"
        :style="{ width: `${position.width}px` }"
      >
        <span class="size-3.5" :class="icon" aria-hidden="true" />
      </div>
      <span
        class="flex items-center gap-1 whitespace-nowrap text-sm"
        :class="TYPE_TEXT_COLOR[item.type]"
      >
        <span :class="item.isComplete && 'line-through opacity-60'">
          {{ item.title }}
        </span>
        <span
          v-if="item.isInternal"
          class="lucide-lock size-3.5 shrink-0"
          aria-label="Internal"
        />
      </span>
    </div>
    <div
      v-else
      class="absolute top-1/2 z-10 mx-0.5 flex -translate-y-1/2 items-center gap-1.5 overflow-hidden rounded-5 px-2.5"
      :class="TYPE_COLOR[item.type]"
      :style="{
        left: `${position.left}px`,
        width: `${position.width}px`,
        height: `${BAR_HEIGHT}px`,
      }"
    >
      <span class="size-3.5 shrink-0" :class="icon" aria-hidden="true" />
      <span
        class="truncate text-sm"
        :class="item.isComplete && 'line-through opacity-60'"
      >
        {{ item.title }}
      </span>
      <span
        v-if="item.isInternal"
        class="lucide-lock ml-auto size-3.5 shrink-0"
        aria-label="Internal"
      />
    </div>
  </ItemHoverCard>
</template>
