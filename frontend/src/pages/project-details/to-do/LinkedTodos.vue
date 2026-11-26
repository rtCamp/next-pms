<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { Button, Spinner, Tooltip } from "frappe-ui";
import TodoRow from "./TodoRow.vue";
import type { LinkedRecord } from "./types";
import { useTodos } from "./useTodos";

const props = defineProps<{
  record: LinkedRecord;
  /** Offers adding and unlinking ToDos. */
  canEdit: boolean;
  emptyMessage: string;
}>();
defineSlots<{ title: () => unknown }>();

/** Whether any row's actions menu is open. */
const menuOpen = defineModel<boolean>("menuOpen", { default: false });

const todos = useTodos();
todos.load();

const rows = computed(() => todos.linkedTo(props.record));

const openMenus = reactive(new Set<string>());
function setMenuOpen(name: string, open: boolean) {
  if (open) openMenus.add(name);
  else openMenus.delete(name);
}
watch(
  () => openMenus.size > 0,
  (open) => (menuOpen.value = open),
);
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="mb-2 flex items-center justify-between gap-2">
      <slot name="title" />
      <Tooltip v-if="canEdit" text="Add ToDo">
        <Button
          variant="ghost"
          class="shrink-0"
          icon="lucide-plus"
          label="Add ToDo"
          @click="todos.openCreate(record)"
        />
      </Tooltip>
    </div>
    <div
      v-if="todos.loading.value && !rows.length"
      class="flex justify-center py-4"
    >
      <Spinner class="size-4" />
    </div>
    <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Tailwind 3 has no scrollbar-width utility -->
    <div
      v-else-if="rows.length"
      class="min-h-0 overflow-y-auto [scrollbar-width:thin]"
    >
      <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
      <TodoRow
        v-for="todo in rows"
        :key="todo.name"
        :todo="todo"
        :can-unlink="canEdit"
        condensed
        @update:menu-open="setMenuOpen(todo.name, $event)"
      />
    </div>
    <p v-else class="text-sm text-ink-gray-5">{{ emptyMessage }}</p>
  </div>
</template>
