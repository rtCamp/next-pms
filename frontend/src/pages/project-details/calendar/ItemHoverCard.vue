<script setup lang="ts">
import { computed } from "vue";
import { HoverCard } from "frappe-ui";
import { LINKED_RECORD_ICON } from "@/pages/project-details/to-do/constants";
import {
  formatTodoCount,
  linkedTodos,
} from "@/pages/project-details/to-do/todos";
import { useTodos } from "@/pages/project-details/to-do/useTodos";
import { toLinkedRecord } from "./calendar";
import { HOVER_CLOSE_DELAY, HOVER_OPEN_DELAY } from "./constants";
import type { TimelineItem } from "./types";

const props = defineProps<{ item: TimelineItem }>();
defineSlots<{ default: () => unknown }>();

const todos = useTodos();
const todoCount = computed(
  () => linkedTodos(todos.todos.value, toLinkedRecord(props.item)).length,
);
</script>

<template>
  <HoverCard
    side="bottom"
    align="start"
    :offset="4"
    :hover-delay="HOVER_OPEN_DELAY"
    :leave-delay="HOVER_CLOSE_DELAY"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="flex w-max max-w-70 flex-col gap-3 p-3">
      <div class="flex items-start gap-2">
        <span
          class="mt-px size-4 shrink-0 text-ink-gray-7"
          :class="LINKED_RECORD_ICON[item.type]"
          aria-hidden="true"
        />
        <span class="min-w-0 break-words text-base-medium text-ink-gray-7">
          {{ item.title }}
        </span>
      </div>
      <div class="flex flex-col gap-2.5">
        <div v-if="item.categoryLabel" class="flex items-center gap-2">
          <span
            class="lucide-tag size-4 shrink-0 text-ink-gray-6"
            aria-hidden="true"
          />
          <span class="truncate text-sm text-ink-gray-6">
            {{ item.categoryLabel }}
          </span>
        </div>
        <div v-if="item.isInternal" class="flex items-center gap-2">
          <span
            class="lucide-lock size-4 shrink-0 text-ink-gray-6"
            aria-hidden="true"
          />
          <span class="text-sm text-ink-gray-6">Internal</span>
        </div>
        <div v-if="todoCount" class="flex items-center gap-2">
          <span
            class="lucide-list-todo size-4 shrink-0 text-ink-gray-6"
            aria-hidden="true"
          />
          <span class="text-sm text-ink-gray-6">
            {{ formatTodoCount(todoCount) }}
          </span>
        </div>
      </div>
    </div>
  </HoverCard>
</template>
