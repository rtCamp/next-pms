<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Button, Dropdown, Tooltip } from "frappe-ui";
import { PRIORITY_DOT, STATUS_COLOR, STATUS_ICON } from "./constants";
import { formatTodoDateTime, todoTitle } from "./todos";
import type { Todo } from "./types";
import { useTodos } from "./useTodos";

const props = defineProps<{ todo: Todo }>();

const todos = useTodos();

const status = computed(() => todos.statusOf(props.todo));
const statusLabel = computed(() =>
  status.value === "Closed" ? "Reopen" : "Mark as done",
);
const assigneeHref = computed(
  () => `/desk/user/${encodeURIComponent(props.todo.allocated_to)}`,
);

const actions = computed(() => [
  {
    label: "Delete",
    theme: "red" as const,
    onClick: () => todos.requestDelete(props.todo),
  },
]);
</script>

<template>
  <div class="flex items-center gap-4 border-b border-outline-gray-2 py-4">
    <div class="min-w-0 flex-1">
      <h3 class="truncate text-base-medium leading-tighter text-ink-gray-8">
        {{ todoTitle(todo) }}
      </h3>
      <div
        class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-tighter text-ink-gray-5"
      >
        <a
          :href="assigneeHref"
          class="flex items-center gap-1.5 hover:text-ink-gray-7"
        >
          <Avatar
            size="xs"
            shape="circle"
            :label="todo.assigneeName"
            :image="todo.assigneeImage ?? undefined"
          />
          <span class="truncate">{{ todo.assigneeName }}</span>
        </a>
        <template v-if="todos.customFields">
          <span aria-hidden="true">·</span>
          <span class="flex items-center gap-1.5">
            <span class="lucide-calendar size-3.5" aria-hidden="true" />
            <span class="sr-only">Start</span>
            {{ formatTodoDateTime(todo.custom_from_time) }}
          </span>
          <span aria-hidden="true">·</span>
          <span class="flex items-center gap-1.5">
            <span class="lucide-calendar size-3.5" aria-hidden="true" />
            <span class="sr-only">End</span>
            {{ formatTodoDateTime(todo.custom_to_time) }}
          </span>
        </template>
        <span aria-hidden="true">·</span>
        <span class="flex items-center gap-1.5">
          <span
            class="inline-block size-2 rounded-full"
            :class="PRIORITY_DOT[todo.priority]"
            aria-hidden="true"
          />
          <span class="sr-only">Priority</span>
          {{ todo.priority }}
        </span>
      </div>
    </div>
    <Tooltip :text="statusLabel">
      <button
        type="button"
        class="flex shrink-0 transition-colors"
        :class="[
          STATUS_COLOR[status],
          status === 'Open' && 'hover:text-ink-gray-8',
        ]"
        :aria-label="statusLabel"
        :aria-busy="todos.isStatusBusy(todo)"
        @click="todos.toggleDone(todo)"
      >
        <span class="size-5" :class="STATUS_ICON[status]" aria-hidden="true" />
      </button>
    </Tooltip>
    <Dropdown :options="actions" side="bottom" align="end">
      <Button variant="ghost" icon="lucide-ellipsis" label="ToDo actions" />
    </Dropdown>
  </div>
</template>
