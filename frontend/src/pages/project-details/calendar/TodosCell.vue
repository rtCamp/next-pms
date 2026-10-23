<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button, HoverCard, Tooltip } from "frappe-ui";
import LinkedTodos from "@/pages/project-details/to-do/LinkedTodos.vue";
import {
  formatTodoCount,
  linkedTodos,
} from "@/pages/project-details/to-do/todos";
import { useTodos } from "@/pages/project-details/to-do/useTodos";
import { toLinkedRecord } from "./calendar";
import { HOVER_CLOSE_DELAY, HOVER_OPEN_DELAY } from "./constants";
import type { TimelineItem } from "./types";

const props = defineProps<{ item: TimelineItem }>();

const todos = useTodos();
const record = computed(() => toLinkedRecord(props.item));
const count = computed(
  () => linkedTodos(todos.todos.value, record.value).length,
);
const canEdit = computed(() => todos.canLink(record.value));

const open = ref(false);
const menuOpen = ref(false);
// A row's actions menu renders outside the card; leaving the card for it must not
// close the card, and picking an action (or closing the menu) does.
const cardOpen = computed({
  get: () => open.value,
  set: (value) => {
    if (value || !menuOpen.value) open.value = value;
  },
});
watch(menuOpen, (isOpen) => {
  if (!isOpen) open.value = false;
});
watch(
  () => todos.editorOpen.value,
  (isOpen) => {
    if (isOpen) open.value = false;
  },
);
</script>

<template>
  <HoverCard
    v-if="count"
    v-model:open="cardOpen"
    side="bottom"
    align="start"
    :offset="4"
    :hover-delay="HOVER_OPEN_DELAY"
    :leave-delay="HOVER_CLOSE_DELAY"
  >
    <template #trigger>
      <Button
        variant="ghost"
        size="sm"
        icon-left="lucide-list-todo"
        :aria-label="`${formatTodoCount(count)} linked`"
        :aria-expanded="cardOpen"
        @click="open = !open"
      >
        {{ count }}
      </Button>
    </template>
    <div class="flex max-h-96 w-96 flex-col p-3">
      <LinkedTodos
        v-model:menu-open="menuOpen"
        :record="record"
        :can-edit="canEdit"
        empty-message="No ToDos linked."
      >
        <template #title>
          <span class="truncate text-sm-medium text-ink-gray-7">
            ToDos · {{ item.title }}
          </span>
        </template>
      </LinkedTodos>
    </div>
  </HoverCard>
  <Tooltip v-else-if="canEdit" text="Add ToDo">
    <Button
      variant="ghost"
      icon="lucide-plus"
      :label="`Add ToDo to ${item.title}`"
      @click="todos.openCreate(record)"
    />
  </Tooltip>
  <span v-else class="text-ink-gray-4">—</span>
</template>
