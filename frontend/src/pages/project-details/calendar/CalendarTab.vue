<script setup lang="ts">
import { computed } from "vue";
import { Button, Spinner, TabButtons } from "frappe-ui";
import LoadError from "@/pages/project-details/LoadError.vue";
import { useTodos } from "@/pages/project-details/to-do/useTodos";
import { emptyTableMessage } from "./calendar";
import CalendarToolbar from "./CalendarToolbar.vue";
import {
  MILESTONE_COLUMNS,
  TABLE_TAB_TYPE,
  TABLE_TABS,
  TOUCHPOINT_COLUMNS,
} from "./constants";
import MonthGrid from "./MonthGrid.vue";
import TimelineGantt from "./TimelineGantt.vue";
import TimelineItemDialog from "./TimelineItemDialog.vue";
import TimelineListView from "./TimelineListView.vue";
import TimelineTable from "./TimelineTable.vue";
import type { TableTab } from "./types";
import { provideTimeline } from "./useTimeline";

const timeline = provideTimeline();
const { view, tab, tableItems, monthLoading, monthError } = timeline;

const todos = useTodos();
todos.load();
todos.loadLinkable();

const tabModel = computed({
  get: () => tab.value,
  set: (value) => (tab.value = value as TableTab),
});

const columns = computed(() =>
  tab.value === "milestones" ? MILESTONE_COLUMNS : TOUCHPOINT_COLUMNS,
);
</script>

<template>
  <div class="flex flex-col">
    <div class="py-3.5">
      <CalendarToolbar />
    </div>
    <div v-if="view !== 'list'" class="-mx-5 border-b border-outline-gray-1">
      <MonthGrid v-if="view === 'calendar'" />
      <TimelineGantt v-else />
    </div>
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
      <TimelineListView v-if="view === 'list'" />
      <LoadError
        v-else-if="monthError"
        title="Couldn't load the calendar"
        :error="monthError"
        @retry="timeline.reloadMonth()"
      />
      <div v-else-if="monthLoading" class="flex justify-center py-10">
        <Spinner class="size-5" />
      </div>
      <TimelineTable
        v-else
        :items="tableItems"
        :columns="columns"
        :empty-message="emptyTableMessage(tab)"
        :label="tab === 'milestones' ? 'Milestones' : 'Touchpoints'"
      />
    </div>
    <TimelineItemDialog />
  </div>
</template>
