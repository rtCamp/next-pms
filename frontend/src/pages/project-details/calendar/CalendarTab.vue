<script setup lang="ts">
import { computed } from "vue";
import { Button, TabButtons } from "frappe-ui";
import { useTodos } from "@/pages/project-details/to-do/useTodos";
import CalendarToolbar from "./CalendarToolbar.vue";
import { TABLE_TAB_TYPE, TABLE_TABS } from "./constants";
import type { TableTab } from "./types";
import { provideTimeline } from "./useTimeline";

const timeline = provideTimeline();
const { view, tab } = timeline;

const todos = useTodos();
todos.load();
todos.loadLinkable();

const tabModel = computed({
  get: () => tab.value,
  set: (value) => (tab.value = value as TableTab),
});
</script>

<template>
  <div class="flex flex-col">
    <div class="py-3.5">
      <CalendarToolbar />
    </div>
    <div v-if="view !== 'list'" class="-mx-5 border-b border-outline-gray-1" />
    <div class="mt-4">
      <div class="mb-3 flex items-center justify-between px-1">
        <TabButtons
          v-model="tabModel"
          :options="TABLE_TABS"
          aria-label="Table"
        />
        <Button
          variant="solid"
          icon-left="lucide-plus"
          label="Create"
          @click="timeline.openCreate(TABLE_TAB_TYPE[tab])"
        />
      </div>
    </div>
  </div>
</template>
